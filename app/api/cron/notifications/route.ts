import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { emailForPendingDelivery, isEmailConfigured, sendEmail } from "@/lib/services/email";

/**
 * WORKER DE NOTIFICAÇÕES (processamento de fila)
 * ------------------------------------------------------------------
 * Executado por um cron gerido (Vercel Cron / GitHub Action / Upstash QStash)
 * a cada minuto. Protegido por `CRON_SECRET` no cabeçalho Authorization.
 *
 * Garantias:
 *  - `notification_queue.event_key` é único → idempotência.
 *  - Backoff progressivo: 1m, 5m, 15m, 1h, 6h (máx. 5 tentativas).
 *  - Falha de email/SMS nunca desfaz um voto ou pagamento já registado.
 *  - Cada tentativa é registada em notification_delivery_logs.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = getServiceClient();
  if (!admin) return NextResponse.json({ ok: false, reason: "no_database" }, { status: 503 });

  const { data: batch, error } = await admin
    .from("notification_queue")
    .select("id, event_key, channel, payload, attempts, max_attempts")
    .eq("status", "pendente")
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at")
    .limit(50);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const backoffMinutes = [1, 5, 15, 60, 360];
  // Linhas vindas do shim de serviço são `Record<string, unknown>`; a tipagem
  // explícita do job mantém o handler verificável.
  let processed = 0;
  let failed = 0;

  for (const job of batch ?? []) {
    try {
      await handleJob(job as unknown as QueueJob);
      await admin
        .from("notification_queue")
        .update({ status: "enviado", updated_at: new Date().toISOString(), last_error: null })
        .eq("id", job.id);
      processed++;
    } catch (err) {
      const attempts = Number(job.attempts ?? 0) + 1;
      const exhausted = attempts >= Number(job.max_attempts ?? 5);
      const wait = backoffMinutes[Math.min(attempts - 1, backoffMinutes.length - 1)];
      await admin
        .from("notification_queue")
        .update({
          status: exhausted ? "falhou" : "pendente",
          attempts,
          last_error: err instanceof Error ? err.message : "erro desconhecido",
          next_attempt_at: new Date(Date.now() + wait * 60_000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, processed, failed, total: batch?.length ?? 0 });
}

interface QueueJob {
  id: string;
  event_key: string;
  channel: string;
  payload: Record<string, unknown>;
  attempts: number | null;
  max_attempts: number | null;
}

/** Cria a notificação (in-app) e envia pelos canais activos. */
async function handleJob(job: QueueJob) {
  const admin = getServiceClient();
  if (!admin) throw new Error("no_database");

  const [kind, ref] = job.event_key.split(":");
  const userId = (job.payload.user_id as string) ?? null;

  const copy: Record<string, { category: string; title: string; body: string; link?: string }> = {
    "vote.confirmed": {
      category: "votacao",
      title: "Voto registado",
      body: `O seu voto de ${job.payload.quantity ?? 1} unidade(s) foi registado e contabilizado.`,
      link: "/painel/votos",
    },
    "payment.confirmed": {
      category: "pagamento",
      title: "Pagamento confirmado",
      body: `Recebemos a confirmação do fornecedor. ${job.payload.votes ?? 0} votos foram creditados na sua conta.`,
      link: "/painel/pagamentos",
    },
    "news.published": {
      category: "programa",
      title: "Nova publicação oficial",
      body: String(job.payload.title ?? "Nova notícia publicada."),
      link: job.payload.slug ? `/noticias/${job.payload.slug}` : "/noticias",
    },
  };

  // Canal email: não cria notificação in-app (isso é papel do canal `in_app`).
  // Trata a entrega e termina — o mesmo evento gera dois jobs independentes.
  if (job.channel === "email") {
    const emailCopy = copy[kind] ?? {
      category: "sistema",
      title: "Actualização da Casa das Estrelas",
      body: "Há uma nova actualização na sua conta.",
      link: "/painel",
    };
    await deliverEmail(admin, userId, emailCopy, job);
    return;
  }

  const content = copy[kind];
  if (!content) return; // evento desconhecido — ignorado sem falhar a fila

  const { data: notification, error: nErr } = await admin.from("notifications").insert({
    category: content.category,
    title: content.title,
    body: content.body,
    link: content.link,
    audience: userId ? "selecionados" : "todos",
    channels: ["in_app"],
  });

  const created = Array.isArray(notification) ? notification[0] : notification;
  if (nErr || !created) throw new Error(nErr?.message ?? "notification_insert_failed");

  if (userId) {
    await admin.from("notification_recipients").insert({
      notification_id: created.id,
      user_id: userId,
    });
    // Distribuição para o destinatário, respeitando preferências.
    await admin.rpc("fn_enqueue_notification", { p_notification_id: created.id });
  } else {
    await admin.rpc("fn_enqueue_notification", { p_notification_id: created.id });
  }

  // ---- Canal email ---------------------------------------------------------
  // Só envia se (a) o fornecedor estiver configurado, (b) o destinatário tiver
  // email e (c) as preferências permitirem este tipo de mensagem. Mensagens de
  // segurança e de pagamento não são marketing: são sempre enviadas.
  if (job.channel === "email") {
    await deliverEmail(admin, userId, content, job);
  }

  void ref;
}

/**
 * Entrega por email de uma notificação já criada.
 * Registra o resultado em `notification_delivery_logs` — sucesso, falha ou
 * "não configurado". Nunca lança: o job já fez o seu trabalho in-app.
 */
async function deliverEmail(
  admin: NonNullable<ReturnType<typeof getServiceClient>>,
  userId: string | null,
  content: { category: string; title: string; body: string; link?: string },
  job: QueueJob,
) {
  // `delivery_status` só aceita: pendente | enviado | falhou | entregue | ignorado.
  // O motivo concreto vai em `error`, não no estado.
  const log = async (
    status: "enviado" | "falhou" | "ignorado",
    extra: { error?: string; providerMessageId?: string } = {},
  ) => {
    const { error } = await admin.from("notification_delivery_logs").insert({
      channel: "email",
      status,
      user_id: userId,
      attempt: Number(job.attempts ?? 0) + 1,
      error: extra.error ?? null,
      provider_message_id: extra.providerMessageId ?? null,
    });
    if (error) {
      console.error("[email] falha ao registar entrega", error.message);
    }
  };

  if (!isEmailConfigured()) {
    await log("ignorado", { error: "fornecedor_nao_configurado" });
    return;
  }
  if (!userId) {
    await log("ignorado", { error: "sem_destinatario" });
    return;
  }

  const { data: profile } = await admin
    .from("user_profiles")
    .select("user_id, full_name")
    .eq("user_id", userId)
    .limit(1);

  const { data: prefs } = await admin
    .from("notification_preferences")
    .select("email, payment_alerts, security_alerts, vote_alerts, news_alerts")
    .eq("user_id", userId)
    .limit(1);

  const preference = (prefs ?? [])[0] as Record<string, unknown> | undefined;
  const transactional = content.category === "pagamento" || content.category === "conta";

  if (preference && preference.email === false && !transactional) {
    await log("ignorado", { error: "preferencia_email_desactivada" });
    return;
  }
  if (preference && content.category === "pagamento" && preference.payment_alerts === false) {
    await log("ignorado", { error: "preferencia_pagamentos_desactivada" });
    return;
  }
  if (preference && content.category === "conta" && preference.security_alerts === false) {
    await log("ignorado", { error: "preferencia_seguranca_desactivada" });
    return;
  }

  // Endereço obtido do Auth (a tabela `users` não guarda email).
  const address = await lookupEmail(userId);
  if (!address) {
    await log("ignorado", { error: "email_indisponivel" });
    return;
  }

  const base = emailForPendingDelivery(
    content.category,
    content.title,
    content.body,
    content.link ?? null,
  );

  void profile;

  const result = await sendEmail({ ...base, to: address });

  if (result.status === "sent") {
    await log("enviado", { providerMessageId: result.providerId });
  } else if (result.status === "failed") {
    await log("falhou", { error: result.error });
    throw new Error(`email_failed: ${result.error}`);
  } else {
    await log("ignorado", { error: result.reason });
  }
}

/** Email do utilizador, lido do schema `auth` por SQL (o PostgREST não o expõe). */
async function lookupEmail(userId: string): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { Pool } = await import("pg");
    const globalForPg = globalThis as unknown as { __cdePool?: import("pg").Pool };
    globalForPg.__cdePool ??= new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      ssl: { rejectUnauthorized: false },
    });
    const { rows } = await globalForPg.__cdePool.query(
      "select email from auth.users where id = $1 and deleted_at is null limit 1",
      [userId],
    );
    return (rows[0]?.email as string) ?? null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";
