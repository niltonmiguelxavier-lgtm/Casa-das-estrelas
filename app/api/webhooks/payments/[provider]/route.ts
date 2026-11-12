import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/services/audit";

/**
 * ============================================================================
 *  WEBHOOK DE PAGAMENTOS
 * ============================================================================
 *  Este endpoint é a ÚNICA via pela qual votos pagos são creditados.
 *
 *  Regras implementadas:
 *   1. Cada fornecedor tem o seu segredo em variável de ambiente (nunca no repo).
 *   2. A assinatura HMAC-SHA256 do corpo bruto é verificada antes de qualquer
 *      leitura de dados (comparação em tempo constante).
 *   3. O evento é registado em `payment_webhooks` com a chave de idempotência
 *      fornecida pelo fornecedor — eventos repetidos são ignorados.
 *   4. O valor e a moeda são comparados com a ordem guardada na base de dados.
 *      Nunca confiamos em valores enviados pelo cliente.
 *   5. O crédito de votos e a alteração de estado ocorrem numa transacção SQL
 *      (fn_confirm_payment), garantindo atomicidade.
 *   6. Qualquer falha é registada e devolvida com o código adequado para que o
 *      fornecedor possa reenviar a notificação.
 * ============================================================================
 */

const PROVIDER_SECRET_ENV: Record<string, string> = {
  mpesa: "PAYMENT_MPESA_WEBHOOK_SECRET",
  emola: "PAYMENT_EMOLA_WEBHOOK_SECRET",
  mkesh: "PAYMENT_MKESH_WEBHOOK_SECRET",
  card: "PAYMENT_CARD_WEBHOOK_SECRET",
};

interface WebhookPayload {
  event_id: string;
  reference: string;
  status: "confirmed" | "failed" | "expired" | "refunded";
  amount: number;
  currency: string;
  provider_transaction_id?: string;
  paid_at?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;

  const secretEnv = PROVIDER_SECRET_ENV[provider];
  if (!secretEnv) {
    return NextResponse.json({ ok: false, error: "provider_unknown" }, { status: 404 });
  }

  const secret = process.env[secretEnv];
  if (!secret) {
    // Sem segredo configurado não processamos nada (nunca aceitar em modo aberto).
    await recordAudit({
      action: "payment.webhook.rejected",
      entity: "payment_webhooks",
      severity: "critico",
      metadata: { provider, reason: "secret_not_configured" },
    });
    return NextResponse.json({ ok: false, error: "provider_not_configured" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? req.headers.get("x-webhook-signature") ?? "";

  const expected = createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  const sig = signature.replace(/^sha256=/, "").trim();

  const valid =
    sig.length === expected.length &&
    timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));

  if (!valid) {
    await recordAudit({
      action: "payment.webhook.rejected",
      entity: "payment_webhooks",
      severity: "critico",
      metadata: { provider, reason: "invalid_signature" },
    });
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw) as WebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  if (!payload.event_id || !payload.reference || !payload.status) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 422 });
  }

  const admin = getServiceClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "database_unavailable" }, { status: 503 });
  }

  // 1) Registo do evento com chave de idempotência (UNIQUE em provider + event_id).
  const { error: insertError } = await admin.from("payment_webhooks").insert({
    provider,
    event_id: payload.event_id,
    signature_valid: true,
    payload,
    received_at: new Date().toISOString(),
  });

  if (insertError) {
    // Violação de unicidade → evento já processado. Responder 200 evita reenvios.
    if (insertError.code === "23505" || /duplicate key/i.test(insertError.message)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // O erro fica no log do servidor; a resposta não expõe detalhes internos.
    console.error("[webhook] falha ao registar evento", provider, insertError.message);
    return NextResponse.json({ ok: false, error: "log_failed" }, { status: 500 });
  }

  await recordAudit({
    action: "payment.webhook.received",
    entity: "payment_webhooks",
    entityId: payload.event_id,
    metadata: { provider, reference: payload.reference, status: payload.status },
  });

  // 2) Confirmação atómica: valida valor/moeda e credita votos uma única vez.
  const { data, error } = await admin.rpc("fn_confirm_payment", {
    p_reference: payload.reference,
    p_provider: provider,
    p_status: payload.status,
    p_amount: payload.amount,
    p_currency: payload.currency,
    p_provider_transaction_id: payload.provider_transaction_id ?? null,
    p_paid_at: payload.paid_at ?? new Date().toISOString(),
  });

  if (error) {
    await recordAudit({
      action: "payment.webhook.rejected",
      entity: "payment_webhooks",
      entityId: payload.event_id,
      severity: "critico",
      metadata: { provider, reference: payload.reference, reason: error.message },
    });
    // 409 → o fornecedor deve reenviar; 422 → erro definitivo (valor divergente).
    const status = error.message.includes("AMOUNT_MISMATCH") ? 422 : 409;
    return NextResponse.json({ ok: false, error: error.message }, { status });
  }

  await recordAudit({
    action: "payment.confirmed",
    entity: "payment_orders",
    entityId: payload.reference,
    metadata: { provider, result: data },
  });

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
