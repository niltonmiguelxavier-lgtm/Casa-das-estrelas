import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Sparkles, Star, TrendingUp, Users } from "lucide-react";
import { Avatar } from "@/components/ui/logo";
import { CountryLabel } from "@/components/ui/country-tag";
import { VoteCta } from "@/components/voting/vote-cta";
import { PortraitPlaceholder } from "@/components/participants/participant-card";
import { RankingTable } from "@/components/home/ranking-preview";
import { getActiveCampaign, getParticipant, getRanking, listParticipants } from "@/lib/services/data";
import { getCurrentUser } from "@/lib/services/session";
import { site } from "@/lib/site";
import { formatDate, formatNumber } from "@/lib/utils";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getParticipant(id);
  if (!p) return { title: "Concorrente" };
  return {
    title: `${p.name} — Concorrente`,
    description: `${p.name}, concorrente nº ${p.number} de ${p.country} na Casa das Estrelas. ${p.tagline}`,
    openGraph: { images: p.photo ? [{ url: p.photo }] : undefined },
  };
}

export default async function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [participant, ranking, campaign, user, all] = await Promise.all([
    getParticipant(id),
    getRanking(),
    getActiveCampaign(),
    getCurrentUser(),
    listParticipants(),
  ]);

  if (!participant) notFound();

  const position = ranking.find((r) => r.participantId === participant.id)?.position ?? null;
  const totalVotes = ranking.reduce((a, r) => a + r.votes, 0) || 1;
  const share = Math.round((participant.totalVotes / totalVotes) * 100);
  const sameCountry = all.filter(
    (p) => p.country === participant.country && p.id !== participant.id,
  );
  const showVotes = site.showPublicVoteTotals;

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0">
          {participant.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={participant.photo}
              alt=""
              aria-hidden
              className="h-full w-full scale-110 object-cover opacity-25 blur-2xl"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(60%_80%_at_50%_0%,rgba(242,182,43,0.16),#05060a_70%)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,#05060a_6%,rgba(5,6,10,0.9)_55%,rgba(5,6,10,0.8))]" />
        </div>

        <div className="container-page relative py-10 md:py-16">
          <Link
            href="/concorrentes"
            className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white/40 transition hover:text-gold-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Todos os concorrentes
          </Link>

          <div className="mt-7 grid gap-8 md:grid-cols-[280px_1fr] md:items-end lg:grid-cols-[320px_1fr]">
            <div className="relative">
              <div className="overflow-hidden rounded-xl2 border border-white/12 bg-ink-800 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
                {participant.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={participant.photo}
                    alt={participant.name}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="group aspect-[3/4] w-full">
                    <PortraitPlaceholder
                      name={participant.name}
                      number={participant.number}
                      country={participant.country}
                    />
                  </div>
                )}
              </div>
              <div className="absolute -right-3 -top-3 grid h-14 w-14 place-items-center rounded-full border border-gold-400/40 bg-ink-950/90 font-display text-lg font-black text-gold-300 backdrop-blur">
                {String(participant.number).padStart(2, "0")}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-gold">
                  <CountryLabel country={participant.country} />
                </span>
                {participant.city && (
                  <span className="badge badge-muted">
                    <MapPin className="h-3 w-3" /> {participant.city}
                  </span>
                )}
                <span className="badge badge-live">{participant.status}</span>
              </div>

              <h1 className="mt-4 font-display text-[2.4rem] font-black leading-[0.95] tracking-tight text-white sm:text-[3.2rem]">
                {participant.name}
              </h1>
              <p className="mt-2 max-w-xl text-[0.98rem] text-white/60">{participant.tagline}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {participant.talents.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.72rem] text-white/60"
                  >
                    <Sparkles className="mr-1 inline h-3 w-3 text-gold-400" />
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
                <StatBox
                  label="Posição"
                  value={position ? `#${position}` : "—"}
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                />
                <StatBox
                  label="Votos"
                  value={showVotes ? formatNumber(participant.totalVotes) : "—"}
                  icon={<Star className="h-3.5 w-3.5" />}
                />
                <StatBox label="Quota" value={`${showVotes ? share : "—"}${showVotes ? "%" : ""}`} icon={<Users className="h-3.5 w-3.5" />} />
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <VoteCta
                  participant={{
                    id: participant.id,
                    name: participant.name,
                    number: participant.number,
                    country: participant.country,
                    photo: participant.photo,
                  }}
                  campaignId={campaign?.id}
                  authenticated={Boolean(user)}
                  eliminated={participant.status === "eliminado"}
                />
                <Link
                  href={`/votar/pacotes?concorrente=${participant.id}`}
                  className="btn btn-ghost"
                >
                  Comprar votos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="title-eyebrow">Biografia</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-white">Quem é</h2>
            <div className="mt-4 space-y-4 text-[0.92rem] leading-[1.75] text-white/60">
              {participant.bio.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-white">Galeria</h3>
                <span className="text-[0.66rem] uppercase tracking-widest text-white/30">
                  {participant.gallery.length} ficheiros
                </span>
              </div>
              {participant.gallery.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {participant.gallery.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`Galeria de ${participant.name} — ${i + 1}`}
                      className="aspect-square w-full rounded-lg border border-white/8 object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="grid aspect-square place-items-center rounded-lg border border-dashed border-white/10 bg-white/[0.015] text-[0.62rem] uppercase tracking-widest text-white/25"
                    >
                      em breve
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10">
              <h3 className="font-display text-lg font-bold text-white">
                Outros concorrentes de {participant.country}
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {sameCountry.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    href={`/concorrentes/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-2.5 transition hover:border-gold-400/30 hover:bg-white/[0.05]"
                  >
                    <Avatar name={p.name} src={p.photo} size={34} />
                    <span className="min-w-0">
                      <span className="block truncate text-[0.82rem] font-semibold text-white">
                        {p.name}
                      </span>
                      <span className="text-[0.64rem] text-white/35">
                        Nº {String(p.number).padStart(2, "0")} · {p.city ?? p.country}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            {ranking.length > 0 ? (
              <RankingTable rows={ranking} limit={10} compact />
            ) : (
              <div className="border border-dashed border-white/12 p-5">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-white/40">
                  Classificação
                </p>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-white/40">
                  Ainda sem votos contabilizados nesta campanha. A tabela é preenchida a partir dos
                  votos registados — nunca com valores estimados.
                </p>
              </div>
            )}
            <div className="panel rounded-xl2 p-5">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/70">
                Informação do perfil
              </h3>
              <dl className="mt-3 space-y-2.5 text-[0.82rem]">
                <Row label="Número" value={String(participant.number).padStart(2, "0")} />
                <Row label="País" value={participant.country} />
                <Row label="Cidade" value={participant.city ?? "—"} />
                <Row label="Idade" value={participant.age ? `${participant.age} anos` : "—"} />
                <Row label="Ocupação" value={participant.occupation ?? "—"} />
                <Row
                  label="Votos gratuitos"
                  value={showVotes ? formatNumber(participant.freeVotes) : "não publicado"}
                />
                <Row
                  label="Votos pagos"
                  value={showVotes ? formatNumber(participant.paidVotes) : "não publicado"}
                />
                <Row label="Actualizado" value={formatDate(new Date())} />
              </dl>
            </div>
            <p className="text-[0.68rem] leading-relaxed text-white/25">
              Os dados apresentados são os autorizados pela produção. A publicação de totais de
              votos pode ser desactivada a qualquer momento pela administração.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <span className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/35">
        <span className="text-gold-400/70">{icon}</span>
        {label}
      </span>
      <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2 last:border-0">
      <dt className="text-white/35">{label}</dt>
      <dd className="text-right font-medium text-white/80">{value}</dd>
    </div>
  );
}
