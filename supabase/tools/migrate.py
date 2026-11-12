#!/usr/bin/env python3
"""
Executor de migrações — Casa das Estrelas
==========================================

Aplica, por ordem, os ficheiros `supabase/migrations/*.sql` contra o PostgreSQL
do projecto, usando uma tabela de controlo `public.schema_migrations`.

Características:
  * idempotente — ficheiros já aplicados com o mesmo checksum são ignorados;
  * transaccional — cada ficheiro corre numa transacção (tudo ou nada);
  * sem segredos no repositório — lê a ligação de variáveis de ambiente.

Uso:
  export DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
  python3 supabase/tools/migrate.py            # aplica
  python3 supabase/tools/migrate.py --dry-run  # só mostra o que faria

Notas:
  * Usar a porta 5432 (pooler de sessão) para DDL. A 6543 (transacção) não
    suporta bem transacções longas.
  * A ligação directa `db.<ref>.supabase.co` é IPv6; em redes IPv4 usar o pooler.
"""

from __future__ import annotations

import hashlib
import os
import sys
from pathlib import Path

try:
    import psycopg
except ImportError:
    sys.exit("Falta o driver: pip install 'psycopg[binary]'")

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "migrations"

LEDGER = """
create table if not exists public.schema_migrations (
  version    text primary key,
  checksum   text not null,
  applied_at timestamptz not null default now(),
  duration_ms int
);
"""


def main() -> int:
    dry = "--dry-run" in sys.argv
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        return sys.exit("Defina DATABASE_URL (ver cabeçalho deste ficheiro).")

    files = sorted(MIGRATIONS.glob("*.sql"))
    if not files:
        return sys.exit(f"Nenhuma migração em {MIGRATIONS}")

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(LEDGER)
            conn.commit()
            cur.execute("select version, checksum from public.schema_migrations")
            applied = {row[0]: row[1] for row in cur.fetchall()}

        for path in files:
            sql = path.read_text(encoding="utf-8")
            checksum = hashlib.sha256(sql.encode()).hexdigest()[:16]
            name = path.name
            previous = applied.get(name)

            if previous == checksum:
                print(f"SKIP  {name} (já aplicado)")
                continue
            if previous and previous != checksum:
                print(f"WARN  {name} (checksum diferente — revisão manual necessária)")
                continue

            if dry:
                print(f"WOULD {name}")
                continue

            try:
                with conn.transaction():
                    with conn.cursor() as cur:
                        cur.execute(sql)
                        cur.execute(
                            "insert into public.schema_migrations(version, checksum) values (%s,%s)",
                            (name, checksum),
                        )
                print(f"OK    {name}")
            except Exception as exc:  # noqa: BLE001 — queremos a mensagem do PostgreSQL
                print(f"ERRO  {name}: {exc}")
                return 1

    print("MIGRAÇÕES APLICADAS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
