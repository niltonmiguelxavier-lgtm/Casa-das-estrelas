import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CreditCard,
  Heart,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Stat } from "@/components/ui/section";
import { getUserOrders, getUserVotes, getVoteBalance } from "@/lib/services/user-data";
import { getActiveCampaign, getRanking } from "@/lib/services/data";
import { requireUser } from "@/lib/services/session";
import { daysLeft, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/dashboard/status-badge";

export default async function DashboardHome() {
  const user = await requireUser("/painel");
  const [votes, orders, balance, ranking, campaign] = await Promise.all([
    getUserVotes(5),
    getUserOrders(4),
    getVoteBalance(),
    getRanking(),
    getActiveCampaign(),
  ]);

  const totalVotesGiven = votes.reduce((a, v) => a + v.quantity, 0);
  const totalSpent = orders
    .filter((o) => o.status === "confirmado")
    .reduce((a, o) => a + o.amount, 0);
  const top3 = ranking.slice(0, 3);
  const favourite = votes[0];

  return (
    <div className="space-y-6">
      {/* Aviso da campanha */}
      {campaign && (
        <div className="relative overflow-hidden rounded-xl2 border border-gold-400/25 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(242,182,43,0.14),transparent_60%)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-gold-400">
                <span className="live-dot" /> campanha activa
              </p>
              <h2 className="mt-1.5 font-display text-lg font-extrabold text-white">
                {campaign.name}
              </h2>
              <p className="mt-1 text-[0.8rem] text-white/50">
                Encerra em {daysLeft(campaign.endsAt)} dias ·{" "}
                {formatDate(campaign.endsAt, { day: "2-digit", month: "long" })}
              </p>
            </div>
            <Link href="/votar" className="btn btn-gold">
              <Heart className="h-4 w-4" /> Votar agora
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Votos gratuitos hoje"
          value={`${balance.free}/${balance.freeLimit}`}
          hint="renovam diariamente"
          icon={<Heart className="h-4 w-4" />}
          tone="gold"
        />
        <Stat
          label="Votos pagos disponíveis"
          value={formatNumber(balance.paid)}
          hint="creditados após confirmação"
          icon={<Wallet className="h-4 w-4" />}
        />
        <Stat
          label="Votos totais dados"
          value={formatNumber(totalVotesGiven)}
          hint="nas campanhas activas"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Stat
          label="Total investido"
          value={formatCurrency(totalSpent)}
          hint="pagamentos confirmados"
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Histórico recente de votos */}
        <section className="panel rounded-xl2">
          <header className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              Votos recentes
            </h2>
            <Link
              href="/painel/votos"
              className="flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-wider text-gold-300 hover:text-gold-200"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </header>
          <ul className="divide-y divide-white/5">
            {votes.length === 0 && (
              <li className="px-5 py-8 text-center text-[0.8rem] text-white/40">
                Ainda não registou votos.
              </li>
            )}
            {votes.map((v) => (
              <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    v.type === "pago" ? "bg-gold-400/12 text-gold-300" : "bg-white/6 text-white/50"
                  }`}
                >
                  <Heart className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.84rem] font-semibold text-white">
                    {v.participantName}
                  </p>
                  <p className="text-[0.68rem] text-white/35">
                    {v.campaign} · {formatDate(v.createdAt, { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[0.82rem] font-bold tabular-nums text-white">
                    +{v.quantity}
                  </p>
                  <p className="text-[0.58rem] uppercase tracking-wider text-white/30">{v.type}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Pedidos / pagamentos */}
        <section className="panel rounded-xl2">
          <header className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              Compras recentes
            </h2>
            <Link
              href="/painel/pagamentos"
              className="flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-wider text-gold-300 hover:text-gold-200"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </header>
          <ul className="divide-y divide-white/5">
            {orders.length === 0 && (
              <li className="px-5 py-8 text-center text-[0.8rem] text-white/40">
                Ainda não efetuou compras.
              </li>
            )}
            {orders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/6 text-white/50">
                  <CreditCard className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.84rem] font-semibold text-white">{o.packageName}</p>
                  <p className="font-mono text-[0.66rem] text-white/35">{o.reference}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[0.82rem] font-bold tabular-nums text-white">
                    {formatCurrency(o.amount, o.currency)}
                  </p>
                  <PaymentStatusBadge status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top 3 */}
        <section className="panel rounded-xl2 p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            <Star className="h-4 w-4 text-gold-400" /> Top 3 actual
          </h2>
          <ol className="mt-4 space-y-2.5">
            {top3.map((r) => (
              <li key={r.participantId}>
                <Link
                  href={`/concorrentes/${r.participantId}`}
                  className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/[0.02] p-2.5 transition hover:border-gold-400/30"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-gold-400/15 font-display text-[0.66rem] font-extrabold text-gold-200">
                    {r.position}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.82rem] font-semibold text-white">
                    {r.name}
                  </span>
                  <span className="font-display text-[0.76rem] tabular-nums text-white/50">
                    {formatNumber(r.votes)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/classificacao" className="btn btn-ghost mt-4 w-full !py-2 !text-[0.76rem]">
            Classificação completa
          </Link>
        </section>

        {/* Avisos */}
        <section className="space-y-3">
          {!user.emailVerified && (
            <div className="flex items-start gap-3 rounded-xl2 border border-star-rose/25 bg-star-rose/[0.07] p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-star-rose" />
              <div>
                <p className="text-[0.84rem] font-semibold text-white">Confirme o seu email</p>
                <p className="mt-0.5 text-[0.78rem] leading-relaxed text-white/50">
                  A votação completa exige um email verificado. Verifique a caixa de entrada.
                </p>
              </div>
            </div>
          )}
          <div className="panel rounded-xl2 p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              <Bell className="h-4 w-4 text-gold-400" /> Notificações
            </h2>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-white/45">
              Receba avisos de votação, pagamentos e comunicados oficiais. Configure os canais que
              prefere utilizar.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/painel/notificacoes" className="btn btn-ghost !py-2 !text-[0.76rem]">
                Ver notificações
              </Link>
              <Link href="/painel/preferencias" className="btn btn-outline-gold !py-2 !text-[0.76rem]">
                Preferências
              </Link>
            </div>
          </div>
          {favourite && (
            <div className="panel rounded-xl2 p-5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/35">
                O seu concorrente mais votado
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-display text-lg font-extrabold text-white">{favourite.participantName}</p>
                <Link
                  href={`/concorrentes/${favourite.participantId}`}
                  className="text-[0.68rem] font-bold uppercase tracking-wider text-gold-300 hover:text-gold-200"
                >
                  Ver perfil
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
