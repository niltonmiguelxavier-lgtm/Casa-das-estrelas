import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de serviço (privilegiado) para operações de servidor.
 * ---------------------------------------------------------------------------
 * Usa `SUPABASE_SERVICE_ROLE_KEY` quando existe (chave secreta `sb_secret_…`).
 *
 * Alternativa, deliberada e documentada: quando a chave secreta não está
 * definida, a aplicação liga-se directamente ao PostgreSQL com o utilizador
 * `postgres` (liga `DATABASE_URL`) e expõe apenas as três operações que os
 * webhooks e o worker de notificações precisam:
 *
 *   .rpc(fn, args)            → executa uma função SQL (SECURITY DEFINER)
 *   .from(t).insert(row)      → inserção simples (ex.: payment_webhooks)
 *   .from(t).select/update…   → filtros mínimos usados pela fila
 *
 * Não é um cliente PostgREST e não deve ser usado em código de UI. Existe para
 * que o caminho crítico (webhook → fn_confirm_payment) funcione em produção
 * antes de a chave secreta ser configurada, sem simular nada.
 */

type Row = Record<string, unknown>;

interface QueryResult<T = Row[]> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface Filter {
  op: "eq" | "lte" | "in" | "order" | "limit";
  column?: string;
  value?: unknown;
  ascending?: boolean;
}

export interface ServiceClient {
  rpc(fn: string, args: Row): Promise<QueryResult<unknown>>;
  from(table: string): {
    insert(row: Row | Row[]): Promise<QueryResult<Row[]>>;
    select(columns?: string): FilterBuilder;
    update(patch: Row): FilterBuilder;
  };
  kind: "rest" | "postgres";
}

interface FilterBuilder {
  eq(column: string, value: unknown): FilterBuilder;
  lte(column: string, value: unknown): FilterBuilder;
  in(column: string, values: unknown[]): FilterBuilder;
  order(column: string, opts?: { ascending?: boolean }): FilterBuilder;
  limit(n: number): FilterBuilder;
  then<T>(onFulfilled: (value: QueryResult<Row[]>) => T): Promise<T>;
}

const IDENT = /^[a-z_][a-z0-9_]*$/i;
const COLUMNS = /^[a-z0-9_,\s*]+$/i;

function assertIdent(value: string, what: string) {
  if (!IDENT.test(value)) throw new Error(`Identificador inválido (${what}): ${value}`);
}

/**
 * Normaliza a DSN: sem `uselibpqcompat`, o driver `pg` trata `sslmode=require`
 * como `verify-full`, o que falha com a cadeia de certificados do pooler da
 * Supabase. Com a flag, `require` significa «cifrado, sem verificar a CA».
 */
function normalizeDsn(raw: string) {
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("uselibpqcompat")) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

async function pgPool() {
  const rawDsn = process.env.DATABASE_URL;
  if (!rawDsn) return null;
  const dsn = normalizeDsn(rawDsn);
  const { Pool } = await import("pg");

  // Configuração TLS:
  //   DATABASE_CA_CERT — certificado do projecto (recomendado; verificação completa)
  //   caso contrário    — TLS cifrado sem verificação da CA, porque o pooler da
  //                       Supabase apresenta uma cadeia própria que não está nas
  //                       âncoras públicas do runtime.
  const ca = process.env.DATABASE_CA_CERT;
  const ssl = ca
    ? { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true }
    : { rejectUnauthorized: false };

  const globalForPg = globalThis as unknown as { __cdePool?: import("pg").Pool };
  globalForPg.__cdePool ??= new Pool({
    connectionString: dsn,
    max: 5,
    idleTimeoutMillis: 30_000,
    ssl,
  });
  return globalForPg.__cdePool;
}

function pgQueryBuilder(table: string, action: "select" | "update", payload?: Row, columns = "*") {
  assertIdent(table, "tabela");
  if (!COLUMNS.test(columns)) throw new Error("Lista de colunas inválida");

  const filters: Filter[] = [];

  const builder: FilterBuilder = {
    eq(column, value) {
      assertIdent(column, "coluna");
      filters.push({ op: "eq", column, value });
      return builder;
    },
    lte(column, value) {
      assertIdent(column, "coluna");
      filters.push({ op: "lte", column, value });
      return builder;
    },
    in(column, values) {
      assertIdent(column, "coluna");
      filters.push({ op: "in", column, value: values });
      return builder;
    },
    order(column, opts) {
      assertIdent(column, "coluna");
      filters.push({ op: "order", column, ascending: opts?.ascending ?? true });
      return builder;
    },
    limit(n) {
      filters.push({ op: "limit", value: Math.max(1, Math.min(500, Math.trunc(n))) });
      return builder;
    },
    async then(onFulfilled) {
      const pool = await pgPool();
      if (!pool) {
        return onFulfilled({
          data: null,
          error: { message: "DATABASE_URL não configurado", code: "no_database" },
        });
      }

      const values: unknown[] = [];
      const where: string[] = [];

      if (action === "update" && payload) {
        const sets = Object.keys(payload).map((key) => {
          assertIdent(key, "coluna");
          values.push(payload[key]);
          return `${key} = $${values.length}`;
        });
        if (!sets.length) {
          return onFulfilled({ data: null, error: { message: "update sem campos" } });
        }

        let sql = `update public.${table} set ${sets.join(", ")}`;

        for (const f of filters) {
          if (f.op === "eq") {
            values.push(f.value);
            where.push(`${f.column} = $${values.length}`);
          } else if (f.op === "lte") {
            values.push(f.value);
            where.push(`${f.column} <= $${values.length}`);
          } else if (f.op === "in") {
            values.push(f.value);
            where.push(`${f.column} = any($${values.length})`);
          }
        }
        if (where.length) sql += ` where ${where.join(" and ")}`;
        sql += " returning *";

        try {
          const result = await pool.query(sql, values);
          return onFulfilled({ data: result.rows, error: null });
        } catch (error) {
          return onFulfilled({
            data: null,
            error: { message: error instanceof Error ? error.message : "erro SQL" },
          });
        }
      }

      let sql = `select ${columns === "*" ? "*" : columns} from public.${table}`;
      const orderParts: string[] = [];
      let limit = "";

      for (const f of filters) {
        if (f.op === "eq") {
          values.push(f.value);
          where.push(`${f.column} = $${values.length}`);
        } else if (f.op === "lte") {
          values.push(f.value);
          where.push(`${f.column} <= $${values.length}`);
        } else if (f.op === "in") {
          values.push(f.value);
          where.push(`${f.column} = any($${values.length})`);
        } else if (f.op === "order") {
          orderParts.push(`${f.column} ${f.ascending ? "asc" : "desc"}`);
        } else if (f.op === "limit") {
          limit = ` limit ${Number(f.value)}`;
        }
      }
      if (where.length) sql += ` where ${where.join(" and ")}`;
      if (orderParts.length) sql += ` order by ${orderParts.join(", ")}`;
      sql += limit;

      try {
        const result = await pool.query(sql, values);
        return onFulfilled({ data: result.rows, error: null });
      } catch (error) {
        return onFulfilled({
          data: null,
          error: { message: error instanceof Error ? error.message : "erro SQL" },
        });
      }
    },
  };

  return builder;
}

function postgresClient(): ServiceClient {
  return {
    kind: "postgres",
    async rpc(fn, args) {
      if (!IDENT.test(fn)) return { data: null, error: { message: "nome de função inválido" } };
      const pool = await pgPool();
      if (!pool) return { data: null, error: { message: "DATABASE_URL não configurado", code: "no_database" } };

      const keys = Object.keys(args);
      keys.forEach((k) => assertIdent(k, "argumento"));
      const params = keys.map((_, i) => `$${i + 1}`).join(", ");
      const sql = `select public.${fn}(${params}) as result`;

      try {
        const result = await pool.query(sql, keys.map((k) => args[k]));
        return { data: result.rows[0]?.result ?? null, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "erro na função SQL";
        const code = (error as { code?: string }).code;
        return { data: null, error: { message, code } };
      }
    },
    from(table) {
      return {
        async insert(row) {
          assertIdent(table, "tabela");
          const rows = Array.isArray(row) ? row : [row];
          const pool = await pgPool();
          if (!pool) return { data: null, error: { message: "DATABASE_URL não configurado", code: "no_database" } };

          const columns = Object.keys(rows[0] ?? {});
          columns.forEach((c) => assertIdent(c, "coluna"));

          const values: unknown[] = [];
          const tuples = rows.map((r) => {
            const placeholders = columns.map((c) => {
              values.push(r[c]);
              return `$${values.length}`;
            });
            return `(${placeholders.join(", ")})`;
          });

          const sql = `insert into public.${table} (${columns.join(", ")}) values ${tuples.join(", ")} returning *`;
          try {
            const result = await pool.query(sql, values);
            return { data: result.rows, error: null };
          } catch (error) {
            const code = (error as { code?: string }).code;
            return {
              data: null,
              error: { message: error instanceof Error ? error.message : "erro SQL", code },
            };
          }
        },
        select(columns = "*") {
          return pgQueryBuilder(table, "select", undefined, columns);
        },
        update(patch) {
          return pgQueryBuilder(table, "update", patch);
        },
      };
    },
  };
}

function restBuilder(
  client: SupabaseClient,
  table: string,
  action: "select" | "update",
  payload?: Row,
  columns = "*",
): FilterBuilder {
  let query = action === "update" ? client.from(table).update(payload ?? {}) : client.from(table).select(columns);

  const builder: FilterBuilder = {
    eq(column, value) {
      query = query.eq(column, value as never);
      return builder;
    },
    lte(column, value) {
      query = query.lte(column, value as never);
      return builder;
    },
    in(column, values) {
      query = query.in(column, values as never);
      return builder;
    },
    order(column, opts) {
      query = query.order(column, { ascending: opts?.ascending ?? true });
      return builder;
    },
    limit(n) {
      query = query.limit(n);
      return builder;
    },
    async then(onFulfilled) {
      if (action === "update") {
        const { data, error } = await query.select();
        return onFulfilled({
          data: (data as unknown as Row[]) ?? null,
          error: error ? { message: error.message, code: error.code } : null,
        });
      }
      const { data, error } = await query;
      return onFulfilled({
        data: (data as unknown as Row[]) ?? null,
        error: error ? { message: error.message, code: error.code } : null,
      });
    },
  };

  return builder;
}

function restClient(url: string, key: string): ServiceClient {
  const client: SupabaseClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    kind: "rest",
    async rpc(fn, args) {
      const { data, error } = await client.rpc(fn, args);
      return { data: data as unknown, error: error ? { message: error.message, code: error.code } : null };
    },
    // Com a chave secreta presente delegamos no cliente oficial.
    from(table) {
      return {
        async insert(row) {
          const rows = Array.isArray(row) ? row : [row];
          const { data, error } = await client.from(table).insert(rows).select();
          return {
            data: (data as unknown as Row[]) ?? null,
            error: error ? { message: error.message, code: error.code } : null,
          };
        },
        select(columns = "*") {
          return restBuilder(client, table, "select", undefined, columns);
        },
        update(patch) {
          return restBuilder(client, table, "update", patch);
        },
      };
    },
  };
}

let cached: ServiceClient | null = null;

/**
 * Devolve o cliente privilegiado disponível:
 *   1. Supabase com chave secreta (recomendado);
 *   2. PostgreSQL directo via DATABASE_URL (só funções SQL e operações mínimas);
 *   3. `null` quando não há configuração — as rotas respondem 503, nunca simulam.
 */
export function getServiceClient(): ServiceClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && secret) {
    cached = restClient(url, secret);
    return cached;
  }

  if (process.env.DATABASE_URL) {
    cached = postgresClient();
    return cached;
  }

  return null;
}

export function serviceClientKind(): "rest" | "postgres" | null {
  return getServiceClient()?.kind ?? null;
}
