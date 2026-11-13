"use server";

import { revalidatePath } from "next/cache";
import { can, requireAdmin } from "@/lib/services/session";
import { getServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/services/audit";

export interface AdminActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

const CATEGORIES = ["conta", "votacao", "pagamento", "programa", "sistema"] as const;
const CHANNELS = ["in_app", "email", "push", "sms", "whatsapp"] as const;
type Category = (typeof CATEGORIES)[number];
type Channel = (typeof CHANNELS)[number];

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/**
 * Criação e envio de uma notificação.
 * ---------------------------------------------------------------------------
 * 1. Autorização verificada no servidor (papel + estado da conta).
 * 2. Validação de todos os campos.
 * 3. Inserção em `notifications` + `fn_enqueue_notification` (transacção SQL)
 *    que cria um destinatário por utilizador activo e regista o canal.
 * 4. Auditoria com autor, audiência e canais.
 *
 * Regras de honestidade:
 *  - Canais sem fornecedor configurado não podem ser escolhidos.
 *  - «Todos os utilizadores» exige confirmação explícita (campo `confirmar`).
 *  - Agendamentos futuros ficam com `scheduled_at` e são enviados pelo worker.
 */
export async function sendNotificationAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const staff = await requireAdmin();
  if (!can(staff.role, "notificacoes.gerir")) {
    return { ok: false, message: "A sua conta não tem permissão para enviar notificações." };
  }

  const title = text(formData, "title");
  const body = text(formData, "body");
  const category = text(formData, "category") as Category;
  const audience = text(formData, "audience") || "todos";
  const country = text(formData, "country");
  const link = text(formData, "link");
  const scheduledAt = text(formData, "scheduledAt");
  const confirmar = formData.get("confirmar") === "on";

  const fieldErrors: Record<string, string> = {};
  if (title.length < 3) fieldErrors.title = "O título deve ter pelo menos 3 caracteres.";
  if (title.length > 120) fieldErrors.title = "O título não pode exceder 120 caracteres.";
  if (body.length < 5) fieldErrors.body = "A mensagem deve ter pelo menos 5 caracteres.";
  if (body.length > 1000) fieldErrors.body = "A mensagem não pode exceder 1000 caracteres.";
  if (!CATEGORIES.includes(category)) fieldErrors.category = "Categoria inválida.";
  if (audience === "pais" && !["Moçambique", "Angola"].includes(country))
    fieldErrors.country = "Seleccione o país de destino.";
  if (link && !link.startsWith("/") && !/^https?:\/\//.test(link))
    fieldErrors.link = "A ligação deve ser um caminho interno (ex.: /votar) ou um URL completo.";
  if (audience === "todos" && !scheduledAt && !confirmar)
    fieldErrors.confirmar = "Confirme o envio para todos os utilizadores.";

  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Verifique os campos assinalados.", fieldErrors };
  }

  // Canais: apenas os efectivamente configurados.
  const available: Channel[] = ["in_app"];
  if (process.env.NOTIFICA_API_TOKEN) available.push("email");
  const requested = CHANNELS.filter(
    (c) => c !== "in_app" && formData.get(`channel_${c}`) === "on" && available.includes(c),
  );
  const channels: Channel[] = ["in_app", ...requested];

  const db = getServiceClient();
  if (!db) {
    return { ok: false, message: "Ligação à base de dados indisponível. Nada foi enviado." };
  }

  const scheduledIso = scheduledAt ? new Date(scheduledAt).toISOString() : null;
  if (scheduledIso && new Date(scheduledIso).getTime() < Date.now() - 60_000) {
    return { ok: false, message: "A data de agendamento já passou.", fieldErrors: { scheduledAt: "Escolha uma data futura." } };
  }

  const { data, error } = await db.from("notifications").insert({
    category,
    title,
    body,
    link: link || null,
    audience,
    target_country: audience === "pais" ? country : null,
    channels,
    scheduled_at: scheduledIso,
    created_by: staff.id,
  });

  if (error || !data?.[0]) {
    return { ok: false, message: `Não foi possível criar a notificação: ${error?.message ?? "erro desconhecido"}.` };
  }

  const created = (data as unknown as { id: string }[])[0];

  // Envio imediato: distribui pelos utilizadores activos.
  if (!scheduledIso) {
    const enqueue = await db.rpc("fn_enqueue_notification", { p_notification_id: created.id });
    if (enqueue.error) {
      return {
        ok: false,
        message: `A notificação foi criada mas o envio falhou: ${enqueue.error.message}.`,
      };
    }
  }

  await recordAudit({
    action: "admin.notification.sent",
    actorId: staff.id,
    actorEmail: staff.email,
    entity: "notifications",
    entityId: created.id,
    metadata: { title, audience, country: audience === "pais" ? country : null, channels, scheduled: scheduledIso },
  });

  revalidatePath("/admin/notificacoes");

  return {
    ok: true,
    message: scheduledIso
      ? `Notificação criada e agendada para ${new Date(scheduledIso).toLocaleString("pt-MZ")}.`
      : `Notificação enviada (canais: ${channels.join(", ")}).`,
  };
}

/**
 * Cancela um agendamento ainda não processado.
 */
export async function cancelScheduledAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const staff = await requireAdmin();
  if (!can(staff.role, "notificacoes.gerir")) {
    return { ok: false, message: "Sem permissão." };
  }

  const id = text(formData, "notificationId");
  if (!id) return { ok: false, message: "Identificador inválido." };

  const db = getServiceClient();
  if (!db) return { ok: false, message: "Ligação à base de dados indisponível." };

  const { data, error } = await db
    .from("notifications")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .is("sent_at", null);

  if (error) return { ok: false, message: `Não foi possível cancelar: ${error.message}.` };
  if (!data?.length) return { ok: false, message: "Este envio já foi processado e não pode ser cancelado." };

  await recordAudit({
    action: "admin.notification.cancelled",
    actorId: staff.id,
    actorEmail: staff.email,
    entity: "notifications",
    entityId: id,
    severity: "aviso",
  });

  revalidatePath("/admin/notificacoes");
  return { ok: true, message: "Agendamento cancelado." };
}
