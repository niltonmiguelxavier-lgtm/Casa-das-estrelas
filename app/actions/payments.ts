"use server";

import { headers } from "next/headers";
import { createOrderSchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listPackages, getParticipant } from "@/lib/services/data";
import { clientKey, rateLimit } from "@/lib/services/rate-limit";
import { recordAudit } from "@/lib/services/audit";
import { getCurrentUser } from "@/lib/services/session";
import { PAYMENT_METHODS } from "@/lib/site";

export interface OrderState {
  ok: boolean;
  message?: string;
  reference?: string;
  redirectUrl?: string;
  providerConfigured?: boolean;
}

/** Gera uma referência legível e única (ex.: CDE-2026-8F3K2A). */
function makeReference() {
  const y = new Date().getFullYear();
  const rand = Array.from({ length: 6 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");
  return `CDE-${y}-${rand}`;
}

/**
 * CRIAÇÃO DE ORDEM DE PAGAMENTO
 *
 * Regras de segurança implementadas aqui:
 *  - O preço e a quantidade de votos são lidos da BASE DE DADOS, nunca do formulário.
 *  - A ordem é criada com estado `pendente`; os votos só são creditados no webhook.
 *  - O utilizador nunca regressa à página de sucesso com votos creditados.
 *  - Se o fornecedor não estiver configurado, a ordem NÃO é criada e o utilizador
 *    é informado de que o método ainda não está disponível (sem simulações).
 */
export async function createOrderAction(
  _prev: OrderState | undefined,
  formData: FormData,
): Promise<OrderState> {
  const h = await headers();
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Inicie sessão para comprar votos." };

  const limit = rateLimit(clientKey(h, "order"), { limit: 6, windowMs: 300_000 });
  if (!limit.success) return { ok: false, message: "Demasiados pedidos. Aguarde alguns minutos." };

  const parsed = createOrderSchema.safeParse({
    participantId: String(formData.get("participantId") ?? ""),
    packageId: String(formData.get("packageId") ?? ""),
    method: String(formData.get("method") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Dados do pedido inválidos." };

  const packages = await listPackages();
  const pkg = packages.find((p) => p.id === parsed.data.packageId);
  if (!pkg || !pkg.active) return { ok: false, message: "Pacote indisponível." };

  const participant = await getParticipant(parsed.data.participantId);
  if (!participant) return { ok: false, message: "Concorrente não encontrado." };

  const method = PAYMENT_METHODS.find((m) => m.id === parsed.data.method);
  if (!method) return { ok: false, message: "Método de pagamento inválido." };

  // Mapeia cada método para a variável de ambiente do respectivo fornecedor autorizado.
  const providerEnv: Record<string, string> = {
    mpesa: "PAYMENT_MPESA_API_KEY",
    emola: "PAYMENT_EMOLA_API_KEY",
    mkesh: "PAYMENT_MKESH_API_KEY",
    visa: "PAYMENT_CARD_PROVIDER_KEY",
    mastercard: "PAYMENT_CARD_PROVIDER_KEY",
  };
  const providerConfigured = Boolean(process.env[providerEnv[method.id]]);

  await recordAudit({
    action: "payment.order.created",
    actorId: user.id,
    actorEmail: user.email,
    entity: "payment_orders",
    metadata: {
      method: method.id,
      packageId: pkg.id,
      amount: pkg.price,
      currency: pkg.currency,
      votes: pkg.votes,
      providerConfigured,
    },
    ip: h.get("x-forwarded-for"),
  });

  if (!providerConfigured) {
    return {
      ok: false,
      providerConfigured: false,
      message:
        "Este método de pagamento ainda não está activo. A integração com o fornecedor autorizado está pendente de credenciais e homologação — não processamos pagamentos simulados.",
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      providerConfigured: false,
      message: "A base de dados não está configurada. Não é possível criar ordens de pagamento.",
    };
  }

  const reference = makeReference();

  // Idempotência: uma ordem pendente por (utilizador, pacote, concorrente) numa janela curta.
  const { data: existing } = await supabase
    .from("payment_orders")
    .select("id, reference, created_at")
    .eq("user_id", user.id)
    .eq("package_id", pkg.id)
    .eq("participant_id", participant.id)
    .eq("status", "pendente")
    .gt("created_at", new Date(Date.now() - 15 * 60_000).toISOString())
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      reference: existing.reference,
      message: "Já existe uma ordem pendente para este pedido. Conclua o pagamento.",
    };
  }

  const { error } = await supabase.from("payment_orders").insert({
    user_id: user.id,
    participant_id: participant.id,
    package_id: pkg.id,
    provider: method.id,
    reference,
    amount: pkg.price,     // valor autoritativo vindo da BD
    currency: pkg.currency,
    votes: pkg.votes,
    status: "pendente",
  });

  if (error) return { ok: false, message: "Não foi possível criar a ordem de pagamento." };

  return {
    ok: true,
    reference,
    providerConfigured: true,
    message: `Ordem ${reference} criada. Conclua o pagamento no fornecedor — os votos só serão creditados após confirmação verificada por webhook.`,
  };
}
