import { Lock, Plus } from "lucide-react";
import { requireAdmin, can } from "@/lib/services/session";
import { redirect } from "next/navigation";
import { getActiveCampaign, getRanking } from "@/lib/services/data";
import { daysLeft, formatDateTime, formatNumber } from "@/lib/utils";

export default async function AdminVotingPage() {
  const user = await requireAdmin();
  if (!can(user.role, "votacoes.gerir")) redirect("/admin");
  const [campaign, ranking] = await Promise.all([getActiveCampaign(), getRanking()]);
  const total = ranking.reduce((a, r) => a + r.votes, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-white">Votações</h1>
          <p className="mt-1 text-[0.82rem] text-white/45">
            Campanhas, regras e resultados. Alterações de regras ficam auditadas.
          </p>
        </div>
        <button className="btn btn-gold !py-2 !text-[0.76rem]">
          <Plus className="h-3.5 w-3.5" /> Nova campanha
        </button>
      </div>

      {campaign && (
        <section className="panel rounded-xl2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="badge badge-green">activa</span>
              <h2 className="mt-2 font-display text-lg font-extrabold text-white">{campaign.name}</h2>
              <p className="mt-1 text-[0.78rem] text-white/45">
                {formatDateTime(campaign.startsAt)} → {formatDateTime(campaign.endsAt)} ·{" "}
                {daysLeft(campaign.endsAt)} dias restantes
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-2">
                <p className="font-display text-lg font-extrabold text-white">
                  {campaign.freeVotesPerUser}
                </p>
                <p className="text-[0.55rem] uppercase tracking-wider text-white/30">votos/conta</p>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-2">
                <p className="font-display text-lg font-extrabold capitalize text-white">
                  {campaign.frequency}
                </p>
                <p className="text-[0.55rem] uppercase tracking-wider text-white/30">frequência</p>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-2">
                <p className="font-display text-lg font-extrabold text-gold-200">
                  {formatNumber(total)}
                </p>
                <p className="text-[0.55rem] uppercase tracking-wider text-white/30">votos</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <h3 className="text-[0.66rem] font-bold uppercase tracking-widest text-white/40">
                Regras publicadas
              </h3>
              <ol className="mt-2 space-y-1.5 text-[0.76rem] leading-relaxed text-white/55">
                {campaign.rules.map((r, i) => (
                  <li key={i}>
                    {i + 1}. {r}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <h3 className="text-[0.66rem] font-bold uppercase tracking-widest text-white/40">
                Acções
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[0.7rem] text-white/60 hover:border-gold-400/40 hover:text-white">
                  Editar limites
                </button>
                <button className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[0.7rem] text-white/60 hover:border-gold-400/40 hover:text-white">
                  Exportar votos (CSV)
                </button>
                <button className="rounded-lg border border-star-rose/30 px-2.5 py-1.5 text-[0.7rem] text-rose-200 hover:bg-star-rose/10">
                  Encerrar campanha
                </button>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[0.68rem] leading-relaxed text-white/30">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                Nenhuma acção permite alterar totais de votos. Correções exigem estorno auditado com
                justificação e aprovação de superadministrador.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
        <header className="border-b border-white/8 px-4 py-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            Resultados actuais
          </h2>
        </header>
        <ul className="divide-y divide-white/5">
          {ranking.map((r) => (
            <li key={r.participantId} className="grid grid-cols-[36px_1fr_90px_70px] items-center gap-3 px-4 py-2.5">
              <span className="font-display text-[0.74rem] font-bold text-white/40">{r.position}</span>
              <span className="truncate text-[0.82rem] text-white">{r.name}</span>
              <span className="text-[0.66rem] text-white/30">{r.country}</span>
              <span className="text-right font-display text-[0.78rem] tabular-nums text-gold-200">
                {formatNumber(r.votes)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
