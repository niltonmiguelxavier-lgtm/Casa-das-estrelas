import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";
import { getServiceClient } from "@/lib/supabase/service";

const DEMO_LOG = [
  { id: "1", action: "vote.free", actor: "utilizador@exemplo.mz", entity: "participants/mz-11", severity: "info", at: new Date(Date.now() - 6e5).toISOString() },
  { id: "2", action: "payment.order.created", actor: "utilizador@exemplo.mz", entity: "payment_orders/CDE-2026-K5R8NC", severity: "info", at: new Date(Date.now() - 3.2e6).toISOString() },
  { id: "3", action: "auth.login.failed", actor: "desconhecido", entity: "—", severity: "aviso", at: new Date(Date.now() - 5.4e6).toISOString() },
  { id: "4", action: "admin.news.published", actor: "produção@casadasestrelas.tv", entity: "news/casa-das-estrelas-abre-portas", severity: "info", at: new Date(Date.now() - 8.6e6).toISOString() },
  { id: "5", action: "payment.webhook.rejected", actor: "fornecedor", entity: "payment_webhooks/—", severity: "critico", at: new Date(Date.now() - 9.1e6).toISOString() },
];

export default async function AdminAuditPage() {
  await requireAdmin();
  const admin = getServiceClient();

  let logs = DEMO_LOG;
  if (admin) {
    const { data } = await admin
      .from("audit_logs")
      .select("id, action, actor_email, entity, entity_id, severity, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    logs = (data ?? []).map((l) => ({
      id: String(l.id),
      action: String(l.action),
      actor: l.actor_email ? String(l.actor_email) : "—",
      entity: l.entity_id ? `${l.entity}/${l.entity_id}` : String(l.entity ?? "—"),
      severity: String(l.severity ?? "info"),
      at: String(l.created_at),
    }));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
          <ShieldCheck className="h-5 w-5 text-star-teal" /> Auditoria
        </h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Registo imutável (append-only) das operações sensíveis. Sem possibilidade de edição ou
          eliminação através da aplicação.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
        <div className="hidden grid-cols-[180px_1fr_120px_140px] gap-3 border-b border-white/6 px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/25 md:grid">
          <span>Acção</span>
          <span>Autor / Entidade</span>
          <span>Severidade</span>
          <span className="text-right">Data</span>
        </div>
        <ul className="divide-y divide-white/5">
          {logs.map((l) => (
            <li
              key={l.id}
              className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-[180px_1fr_120px_140px] md:items-center md:gap-3"
            >
              <span className="font-mono text-[0.72rem] text-gold-200">{l.action}</span>
              <span className="min-w-0">
                <span className="block truncate text-[0.76rem] text-white/70">{l.actor}</span>
                <span className="block truncate text-[0.64rem] text-white/25">{l.entity}</span>
              </span>
              <span>
                <span
                  className={`badge ${
                    l.severity === "critico"
                      ? "badge-live"
                      : l.severity === "aviso"
                        ? "badge-gold"
                        : "badge-muted"
                  } !text-[0.52rem]`}
                >
                  {l.severity}
                </span>
              </span>
              <span className="text-[0.68rem] text-white/30 md:text-right">
                {formatDateTime(l.at)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[0.7rem] leading-relaxed text-white/25">
        Em produção, a tabela <code>audit_logs</code> tem RLS activo, sem políticas de UPDATE/DELETE.
        Os registos são ainda replicados para armazenamento de longo prazo para fins de conformidade.
      </p>
    </div>
  );
}
