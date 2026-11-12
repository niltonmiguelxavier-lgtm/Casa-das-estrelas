import "server-only";
import { getServiceClient } from "@/lib/supabase/service";

export type AuditAction =
  | "auth.register"
  | "auth.login"
  | "auth.login.failed"
  | "auth.logout"
  | "auth.password_reset.requested"
  | "auth.password_reset.completed"
  | "vote.free"
  | "vote.paid.credited"
  | "payment.order.created"
  | "payment.webhook.received"
  | "payment.webhook.rejected"
  | "payment.confirmed"
  | "admin.participant.updated"
  | "admin.news.published"
  | "admin.notification.sent"
  | "admin.user.suspended"
  | "admin.export";

export interface AuditEntry {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  entity?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
  severity?: "info" | "aviso" | "critico";
}

/**
 * Registo de auditoria imutável (append-only).
 * A tabela audit_logs tem política RLS de INSERT apenas via service role e
 * ausência de políticas UPDATE/DELETE.
 */
export async function recordAudit(entry: AuditEntry) {
  const supabase = getServiceClient();
  const payload = {
    action: entry.action,
    actor_id: entry.actorId ?? null,
    actor_email: entry.actorEmail ?? null,
    entity: entry.entity ?? null,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
    ip: entry.ip ?? null,
    user_agent: entry.userAgent ?? null,
    severity: entry.severity ?? "info",
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    // Modo demonstração sem base de dados: apenas log estruturado no servidor.
    console.info("[audit]", JSON.stringify(payload));
    return;
  }

  const { error } = await supabase.from("audit_logs").insert(payload);
  if (error) console.error("[audit] falha ao registar", error.message);
}
