import Link from "next/link";
import { Download, Receipt } from "lucide-react";
import { getUserOrders } from "@/lib/services/user-data";
import { requireUser } from "@/lib/services/session";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/dashboard/status-badge";

export const metadata = { title: "Pagamentos" };

export default async function PaymentsPage() {
  await requireUser("/painel/pagamentos");
  const orders = await getUserOrders(100);
  const confirmed = orders.filter((o) => o.status === "confirmado");

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/35">Pedidos</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-white">{orders.length}</p>
        </div>
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/35">
            Confirmados
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-star-teal">
            {confirmed.length}
          </p>
        </div>
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/35">
            Total pago
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-gold-200">
            {formatCurrency(confirmed.reduce((a, o) => a + o.amount, 0))}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5">
          <h1 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            <Receipt className="h-4 w-4 text-gold-400" /> Histórico de pagamentos
          </h1>
          <Link href="/votar/pacotes" className="btn btn-ghost !py-1.5 !text-[0.72rem]">
            Comprar votos
          </Link>
        </header>

        <ul className="divide-y divide-white/5">
          {orders.length === 0 && (
            <li className="px-5 py-14 text-center text-[0.85rem] text-white/40">
              Ainda não existem pedidos de pagamento.
            </li>
          )}
          {orders.map((o) => (
            <li key={o.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.9rem] font-semibold text-white">
                    {o.packageName}{" "}
                    <span className="text-[0.72rem] font-normal text-white/35">· {o.votes} votos</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[0.7rem] text-white/35">{o.reference}</p>
                  <p className="mt-1 text-[0.7rem] text-white/30">
                    {o.method} · criado {formatDateTime(o.createdAt)}
                    {o.paidAt ? ` · pago ${formatDateTime(o.paidAt)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-extrabold tabular-nums text-white">
                    {formatCurrency(o.amount, o.currency)}
                  </p>
                  <PaymentStatusBadge status={o.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={o.status !== "confirmado"}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[0.68rem] font-semibold text-white/60 transition hover:border-gold-400/30 hover:text-white disabled:opacity-30"
                >
                  <Download className="h-3 w-3" /> Recibo
                </button>
                {o.status === "pendente" && (
                  <span className="rounded-lg border border-gold-400/25 bg-gold-400/8 px-2.5 py-1.5 text-[0.68rem] text-gold-100">
                    Aguarda confirmação do fornecedor
                  </span>
                )}
                {o.status === "expirado" && (
                  <span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[0.68rem] text-white/35">
                    Ordem expirada — nenhum valor foi cobrado
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-xl2 border border-white/8 bg-white/[0.02] p-4 text-[0.74rem] leading-relaxed text-white/40">
        Os votos são creditados apenas após a confirmação verificada do fornecedor de pagamento.
        Uma ordem com estado <strong className="text-white/60">pendente</strong> não significa
        pagamento efectuado. Se o seu fornecedor confirmou o pagamento e os votos não aparecem no
        prazo de 30 minutos, contacte o apoio indicando a referência da ordem.
      </div>
    </div>
  );
}
