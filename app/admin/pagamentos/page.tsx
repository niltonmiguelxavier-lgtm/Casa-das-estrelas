import { AlertTriangle, Download, Search } from "lucide-react";
import { requireAdmin, can } from "@/lib/services/session";
import { redirect } from "next/navigation";
import { getUserOrders } from "@/lib/services/user-data";
import { getPlatformStats } from "@/lib/services/data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/dashboard/status-badge";
import { PAYMENT_METHODS } from "@/lib/site";

export default async function AdminPaymentsPage() {
  const user = await requireAdmin();
  if (!can(user.role, "financeiro.consultar")) redirect("/admin");
  const [orders, stats] = await Promise.all([getUserOrders(20), getPlatformStats()]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-white">Pagamentos</h1>
          <p className="mt-1 text-[0.82rem] text-white/45">
            Transacções, reconciliação e reembolsos. Nenhum valor pode ser alterado manualmente.
          </p>
        </div>
        <button className="btn btn-ghost !py-2 !text-[0.76rem]">
          <Download className="h-3.5 w-3.5" /> Exportar relatório
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { l: "Receita confirmada", v: formatCurrency(stats.revenue) },
          { l: "Pagamentos confirmados", v: String(stats.confirmedPayments) },
          { l: "Pendentes", v: String(stats.pendingPayments) },
          { l: "Reembolsos", v: "0" },
        ].map((k) => (
          <div key={k.l} className="panel rounded-xl2 p-4">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/35">{k.l}</p>
            <p className="mt-1.5 font-display text-xl font-extrabold text-white">{k.v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              Transacções recentes
            </h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input className="field !py-1.5 !pl-8 !text-[0.72rem]" placeholder="Referência…" />
            </div>
          </div>
          <ul className="divide-y divide-white/5">
            {orders.map((o) => (
              <li key={o.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[0.74rem] text-white/80">{o.reference}</p>
                    <p className="text-[0.66rem] text-white/30">
                      {o.packageName} · {o.method} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[0.82rem] font-bold tabular-nums text-white">
                      {formatCurrency(o.amount, o.currency)}
                    </span>
                    <PaymentStatusBadge status={o.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4">
          <div className="panel rounded-xl2 p-4">
            <h3 className="text-[0.66rem] font-bold uppercase tracking-widest text-white/40">
              Estado dos fornecedores
            </h3>
            <ul className="mt-2.5 space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-[0.76rem]">
                  <span className="text-white/60">{m.label}</span>
                  <span className="badge badge-muted !text-[0.52rem]">não configurado</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.66rem] leading-relaxed text-white/25">
              As credenciais são guardadas apenas em variáveis de ambiente no servidor. Nenhum
              fornecedor é apresentado como activo sem homologação.
            </p>
          </div>

          <div className="rounded-xl2 border border-star-rose/20 bg-star-rose/[0.05] p-4">
            <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest text-rose-200">
              <AlertTriangle className="h-3.5 w-3.5" /> Regras financeiras
            </p>
            <ul className="mt-2 space-y-1.5 text-[0.72rem] leading-relaxed text-white/50">
              <li>• Votos creditados só após webhook verificado.</li>
              <li>• Idempotência por chave de evento do fornecedor.</li>
              <li>• Reconciliação diária obrigatória.</li>
              <li>• Reembolsos com aprovação e registo de auditoria.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
