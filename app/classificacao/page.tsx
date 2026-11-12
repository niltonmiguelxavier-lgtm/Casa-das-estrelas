import type { Metadata } from "next";
import Link from "next/link";
import { Info, TrendingUp, Trophy } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Avatar } from "@/components/ui/logo";
import { CountryCode } from "@/components/ui/country-tag";
import { Variation } from "@/components/home/ranking-preview";
import { LocalDateTime } from "@/components/ui/local-time";
import { getActiveCampaign, getRanking } from "@/lib/services/data";
import { cn, formatNumber } from "@/lib/utils";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Classificação",
  description:
    "Classificação oficial actualizada da Casa das Estrelas — posição, votos contabilizados e variação.",
};

export default async function RankingPage() {
  const [ranking, campaign] = await Promise.all([getRanking(), getActiveCampaign()]);
  const total = ranking.reduce((a, r) => a + r.votes, 0) || 1;
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <>
      <PageHero
        eyebrow="Resultados"
        title="Classificação oficial"
        description="Calculada exclusivamente a partir dos votos válidos registados na base de dados. Resultados provisórios até à publicação do comunicado oficial de cada gala."
        breadcrumb={[{ href: "/classificacao", label: "Classificação" }]}
        image="/media/spotlights.jpg"
        size="sm"
      >
        <div className="flex flex-wrap items-center gap-2 text-[0.74rem]">
          <span className="badge badge-gold">provisória</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/55">
            Actualizado: <LocalDateTime value={campaign?.updatedAt} />
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/55">
            {campaign?.name ?? "sem campanha activa"}
          </span>
        </div>
      </PageHero>

      <section className="container-page py-12 md:py-16">
        {ranking.length === 0 && (
          <div className="panel rounded-xl2 px-6 py-16 text-center">
            <p className="font-display text-lg font-bold text-white">
              A classificação começa com o primeiro voto válido
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              Ainda não existem votos contabilizados nesta campanha. A tabela é preenchida
              automaticamente assim que a votação oficial abrir — nunca com valores estimados.
            </p>
            <Link href="/concorrentes" className="btn btn-ghost mt-5">
              Ver concorrentes
            </Link>
          </div>
        )}

        {/* Pódio */}
        {podium.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {podium.map((row, i) => (
            <div
              key={row.participantId}
              className={cn(
                "relative overflow-hidden rounded-xl2 border p-5",
                i === 0
                  ? "border-gold-400/40 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(242,182,43,0.18),#0b0d15_70%)]"
                  : "border-white/10 bg-ink-900/70",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-black text-white/15">#{row.position}</span>
                {i === 0 && <Trophy className="h-5 w-5 text-gold-400" />}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={row.name} src={row.photo} size={48} />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-extrabold text-white">
                    {row.name}
                  </p>
                  <p className="flex items-center gap-1.5 text-[0.66rem] uppercase tracking-wider text-white/40">
                    <CountryCode country={row.country} /> Nº {String(row.number).padStart(2, "0")}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="font-display text-2xl font-black tabular-nums text-gold-200">
                    {formatNumber(row.votes)}
                  </p>
                  <p className="text-[0.6rem] uppercase tracking-wider text-white/30">
                    {Math.round((row.votes / total) * 100)}% dos votos
                  </p>
                </div>
                <Variation value={row.variation} />
              </div>
              <Link
                href={`/concorrentes/${row.participantId}`}
                className="mt-4 block rounded-full border border-white/12 py-1.5 text-center text-[0.68rem] font-bold uppercase tracking-wider text-white/70 transition hover:border-gold-400/40 hover:text-white"
              >
                Ver perfil
              </Link>
            </div>
          ))}
        </div>
        )}

        {/* Tabela completa */}
        {ranking.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white">
              Classificação completa
            </h2>
            <span className="flex items-center gap-1.5 text-[0.66rem] uppercase tracking-wider text-white/30">
              <TrendingUp className="h-3 w-3 text-star-teal" /> variação vs. actualização anterior
            </span>
          </div>

          <div className="hidden grid-cols-[56px_1fr_100px_140px_70px] items-center gap-3 border-b border-white/6 px-4 py-2 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/25 md:grid">
            <span>Pos.</span>
            <span>Concorrente</span>
            <span>País</span>
            <span className="text-right">Votos</span>
            <span className="text-right">Var.</span>
          </div>

          <ul className="divide-y divide-white/5">
            {rest.map((row) => (
              <li key={row.participantId}>
                <Link
                  href={`/concorrentes/${row.participantId}`}
                  className="grid grid-cols-[44px_1fr_70px] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03] md:grid-cols-[56px_1fr_100px_140px_70px]"
                >
                  <span className="font-display text-sm font-extrabold tabular-nums text-white/50">
                    {row.position}
                  </span>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={row.name} src={row.photo} size={30} />
                    <span className="min-w-0">
                      <span className="block truncate text-[0.85rem] font-semibold text-white">
                        {row.name}
                      </span>
                      <span className="block text-[0.6rem] uppercase tracking-wider text-white/30 md:hidden">
                        {row.country} · Nº {String(row.number).padStart(2, "0")}
                      </span>
                    </span>
                  </span>
                  <span className="hidden items-center gap-1.5 text-[0.74rem] text-white/45 md:flex">
                    <CountryCode country={row.country} /> {row.country}
                  </span>
                  <span className="text-right font-display text-[0.85rem] font-bold tabular-nums text-white">
                    {formatNumber(row.votes)}
                  </span>
                  <span className="hidden justify-end md:flex">
                    <Variation value={row.variation} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        )}

        <div className="mt-6 flex items-start gap-2.5 rounded-xl2 border border-white/8 bg-white/[0.02] p-4 text-[0.76rem] leading-relaxed text-white/40">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-400/70" />
          <p>
            Os totais apresentados resultam da agregação dos votos válidos (gratuitos e pagos
            confirmados). Os resultados são provisórios até à publicação do comunicado oficial de
            cada gala. Actualização automática a cada 30 segundos. A produção pode desactivar a
            publicação de totais a qualquer momento.
          </p>
        </div>
      </section>
    </>
  );
}
