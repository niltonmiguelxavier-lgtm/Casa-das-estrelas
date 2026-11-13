import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Heart,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Stat } from "@/components/ui/section";
import { getPlatformStats, getRanking, listNews } from "@/lib/services/data";
import { cn, formatCurrency, formatNumber, timeAgo } from "@/lib/utils";

export default async function AdminDashboard() {
  const [stats, ranking, news] = await Promise.all([
    getPlatformStats(),
    getRanking(),
    listNews(5),
  ]);

  const conversion =
    stats.freeVotes + stats.paidVotes > 0
      ? Math.round((stats.paidVotes / (stats.freeVotes + stats.paidVotes)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Dashboard</h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Visão geral operacional do programa. Dados actualizados a cada carregamento.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Utilizadores registados" value={formatNumber(stats.registeredUsers)} hint={`${formatNumber(stats.newUsers24h)} novos · ${formatNumber(stats.activeUsers24h)} activos nas últimas 24h`} icon={<Users className="h-4 w-4" />} />
        <Stat label="Concorrentes" value={String(stats.participants)} hint={`${stats.publishedParticipants} publicados`} icon={<Star className="h-4 w-4" />} />
        <Stat label="Votos gratuitos" value={formatNumber(stats.freeVotes)} hint="acumulados" icon={<Heart className="h-4 w-4" />} tone="gold" />
        <Stat label="Votos pagos" value={formatNumber(stats.paidVotes)} hint={`${conversion}% do total`} icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Receita confirmada" value={formatCurrency(stats.revenue)} hint={`${formatNumber(stats.confirmedPayments)} pagamentos · ${formatCurrency(stats.pendingAmount)} pendentes`} icon={<CreditCard className="h-4 w-4" />} tone="green" />
        <Stat label="Pagamentos pendentes" value={String(stats.pendingPayments)} hint="a aguardar confirmação" icon={<TrendingUp className="h-4 w-4" />} />
        <div className="panel rounded-xl2 p-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">Alertas do sistema</p>
          <ul className="mt-3 space-y-2 text-[0.76rem]">
            <li className="flex items-center gap-2 text-gold-200">
              <AlertTriangle className="h-3.5 w-3.5" /> {stats.pendingPayments} ordens pendentes
            </li>
            <li className={cn("flex items-center gap-2", stats.expiredOrders > 0 ? "text-star-red" : "text-white/40")}>
              <AlertTriangle className="h-3.5 w-3.5" /> {stats.expiredOrders} ordens expiradas por reconciliar
            </li>
            <li className="flex items-center gap-2 text-white/40">
              <AlertTriangle className="h-3.5 w-3.5" /> {stats.totalVotes > 0
                ? `${formatNumber(stats.totalVotes)} votos totais contabilizados`
                : "Sem votos registados nesta campanha"}
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel rounded-xl2">
          <header className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              Top 8 — classificação
            </h2>
            <Link href="/admin/votacoes" className="text-[0.66rem] font-bold uppercase tracking-wider text-gold-300">
              Gerir votações
            </Link>
          </header>
          <ul className="divide-y divide-white/5">
            {ranking.slice(0, 8).map((r) => (
              <li key={r.participantId} className="flex items-center gap-3 px-5 py-2.5">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-white/5 font-display text-[0.66rem] font-bold text-white/50">
                  {r.position}
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.82rem] text-white">{r.name}</span>
                <span className="text-[0.64rem] text-white/30">{r.country}</span>
                <span className="font-display text-[0.8rem] font-bold tabular-nums text-gold-200">
                  {formatNumber(r.votes)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel rounded-xl2">
          <header className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              Conteúdos recentes
            </h2>
            <Link href="/admin/conteudos" className="text-[0.66rem] font-bold uppercase tracking-wider text-gold-300">
              Gerir
            </Link>
          </header>
          <ul className="divide-y divide-white/5">
            {news.map((n) => (
              <li key={n.id} className="flex items-center gap-3 px-5 py-3">
                <span className="badge badge-muted !text-[0.55rem]">{n.category}</span>
                <span className="min-w-0 flex-1 truncate text-[0.8rem] text-white/80">{n.title}</span>
                <span className="shrink-0 text-[0.64rem] text-white/25">{timeAgo(n.publishedAt)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/8 p-3">
            <Link href="/admin/notificacoes" className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-[0.68rem] font-bold uppercase tracking-widest text-gold-300 hover:bg-white/5">
              Enviar notificação <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
