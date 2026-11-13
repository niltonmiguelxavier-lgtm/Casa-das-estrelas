import Link from "next/link";
import { ArrowRight, Clock, Heart, Play, Vote } from "lucide-react";
import { HomeHero } from "@/components/home/home-hero";
import { ParticipantCard } from "@/components/participants/participant-card";
import { NewsCard } from "@/components/news/news-card";
import { VoteCountdown } from "@/components/voting/vote-countdown";
import {
  getActiveCampaign,
  listGallery,
  listNews,
  listParticipants,
  listSponsors,
} from "@/lib/services/data";
import { getCurrentUser } from "@/lib/services/session";
import { formatDate, formatNumber } from "@/lib/utils";
import { site } from "@/lib/site";

export const revalidate = 60;

/**
 * Página inicial.
 * ---------------------------------------------------------------
 * Composição editorial em sete blocos: apresentação, concorrentes,
 * votação, notícias, vídeos, patrocinadores e rodapé (global).
 *
 * Todos os dados vêm do PostgreSQL. Quando uma secção ainda não tem
 * conteúdo oficial, apresenta-se um estado vazio honesto — nunca
 * conteúdo inventado.
 * ---------------------------------------------------------------
 */
export default async function HomePage() {
  const [participants, news, gallery, campaign, sponsors, user] = await Promise.all([
    listParticipants(),
    listNews(5),
    listGallery(),
    getActiveCampaign(),
    listSponsors(),
    getCurrentUser(),
  ]);

  const featured = participants.slice(0, 8);
  const [lead, ...rest] = news;
  const videos = gallery.filter((g) => g.type === "video").slice(0, 3);
  const now = Date.now();
  const votingOpen = Boolean(
    campaign &&
      campaign.status === "activa" &&
      now >= new Date(campaign.startsAt).getTime() &&
      now <= new Date(campaign.endsAt).getTime(),
  );
  const eligible = participants.filter((p) => p.status !== "eliminado");

  return (
    <>
      <HomeHero
        edition={site.edition}
        participantsCount={participants.length}
        campaignEndsAt={votingOpen && campaign ? campaign.endsAt : null}
        campaignName={votingOpen && campaign ? campaign.name : null}
        featured={featured.map((p) => ({
          id: p.id,
          name: p.name,
          number: p.number,
          photo: p.photo,
        }))}
      />

      {/* ================= CONCORRENTES ================= */}
      <section className="border-b border-white/10 py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">A casa</p>
              <h2 className="mt-3 display-2 text-white">Concorrentes</h2>
              <p className="mt-3 max-w-xl text-[0.92rem] leading-relaxed text-white/50">
                {participants.length > 0
                  ? "Conheça quem está na casa, o percurso de cada um e o estado na competição."
                  : "Os concorrentes desta edição são publicados pela produção antes do início das emissões."}
              </p>
            </div>
            {participants.length > 0 && (
              <Link
                href="/concorrentes"
                className="group inline-flex shrink-0 items-center gap-2 text-[0.74rem] font-bold uppercase tracking-[0.18em] text-gold-300 hover:text-gold-200"
              >
                Ver todos
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          {featured.length > 0 ? (
            <>
              <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {featured.map((p, i) => (
                  <ParticipantCard
                    key={p.id}
                    participant={p}
                    index={i}
                    campaignId={campaign?.id}
                    authenticated={Boolean(user)}
                    votingClosed={!votingOpen}
                  />
                ))}
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-[0.82rem] text-white/45">
                <span>
                  <strong className="font-display text-white">
                    {participants.filter((p) => p.country === "Moçambique").length}
                  </strong>{" "}
                  Moçambique
                </span>
                <span>
                  <strong className="font-display text-white">
                    {participants.filter((p) => p.country === "Angola").length}
                  </strong>{" "}
                  Angola
                </span>
                <span>
                  <strong className="font-display text-white">{eligible.length}</strong> ainda na
                  competição
                </span>
                <Link href="/classificacao" className="ml-auto text-gold-300 hover:text-gold-200">
                  Classificação oficial
                </Link>
              </div>
            </>
          ) : (
            <EmptyBlock
              title="Ainda sem concorrentes publicados"
              text="A grelha oficial é carregada pela produção através do painel administrativo. Assim que os perfis forem publicados, aparecem aqui automaticamente."
              href="/noticias"
              hrefLabel="Ler os comunicados"
            />
          )}
        </div>
      </section>

      {/* ================= VOTAÇÃO ================= */}
      <section className="border-b border-white/10 bg-ink-900/40 py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <p className="eyebrow">Votação oficial</p>
            <h2 className="mt-3 display-2 text-white">
              {votingOpen ? "A votação está aberta" : "O público decide"}
            </h2>
            <p className="mt-4 max-w-md text-[0.94rem] leading-relaxed text-white/55">
              {votingOpen
                ? "Cada conta dispõe de votos gratuitos por período. Todos os votos são validados e registados no servidor, com data, hora e campanha."
                : "Quando a votação abrir, poderá apoiar o seu concorrente com votos gratuitos ou com pacotes de votos. Todas as regras são publicadas nesta página."}
            </p>

            <dl className="mt-8 divide-hair border-t border-white/10">
              <div className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Estado
                </dt>
                <dd className="text-[0.86rem] font-semibold text-white">
                  {votingOpen ? (
                    <span className="inline-flex items-center gap-2 text-gold-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> Aberta
                    </span>
                  ) : (
                    <span className="text-white/45">Fechada</span>
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Campanha
                </dt>
                <dd className="text-right text-[0.86rem] text-white/75">
                  {campaign?.name ?? "Sem campanha activa"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Prazo
                </dt>
                <dd className="text-right text-[0.86rem] text-white/75">
                  {campaign
                    ? `${formatDate(campaign.startsAt, { day: "2-digit", month: "short" })} — ${formatDate(
                        campaign.endsAt,
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}`
                    : "A anunciar"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Concorrentes elegíveis
                </dt>
                <dd className="text-[0.86rem] font-semibold tabular-nums text-white">
                  {eligible.length}
                </dd>
              </div>
              {votingOpen && campaign && (
                <div className="py-4">
                  <dt className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/35">
                    Encerra em
                  </dt>
                  <dd>
                    <VoteCountdown target={campaign.endsAt} />
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/votar" className="btn btn-gold px-6 py-3">
                <Heart className="h-4 w-4" /> Votar
              </Link>
              <Link href="/votar/pacotes" className="btn btn-ghost px-6 py-3">
                Pacotes de votos
              </Link>
            </div>
          </div>

          {/* Concorrentes disponíveis para voto */}
          <div className="self-start border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-display text-[0.82rem] font-bold uppercase tracking-[0.14em] text-white">
                Concorrentes a votação
              </p>
              <span className="text-[0.66rem] uppercase tracking-[0.14em] text-white/30">
                {eligible.length} disponíveis
              </span>
            </div>

            {eligible.length > 0 ? (
              <ul className="max-h-[22rem] overflow-y-auto">
                {eligible.map((p) => (
                  <li key={p.id} className="border-b border-white/6 last:border-0">
                    <Link
                      href={`/concorrentes/${p.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.03]"
                    >
                      <span className="w-6 font-display text-[0.72rem] font-black tabular-nums text-white/30">
                        {String(p.number).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.86rem] font-semibold text-white">
                          {p.name}
                        </span>
                        <span className="block text-[0.64rem] uppercase tracking-[0.12em] text-white/30">
                          {p.country}
                          {site.showPublicVoteTotals && p.totalVotes > 0
                            ? ` · ${formatNumber(p.totalVotes)} votos`
                            : ""}
                        </span>
                      </span>
                      <Vote className="h-3.5 w-3.5 text-gold-400/70" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-12 text-center">
                <p className="text-[0.84rem] text-white/45">
                  A lista de concorrentes a votação será publicada com a abertura da campanha.
                </p>
              </div>
            )}

            <div className="border-t border-white/10 px-5 py-3.5">
              <Link
                href="/votar"
                className="flex items-center justify-between text-[0.72rem] font-bold uppercase tracking-[0.14em] text-gold-300 hover:text-gold-200"
              >
                Abrir página de votação <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= NOTÍCIAS ================= */}
      <section className="border-b border-white/10 py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Sala de imprensa</p>
              <h2 className="mt-3 display-2 text-white">Notícias</h2>
            </div>
            {news.length > 0 && (
              <Link
                href="/noticias"
                className="group inline-flex shrink-0 items-center gap-2 text-[0.74rem] font-bold uppercase tracking-[0.18em] text-gold-300 hover:text-gold-200"
              >
                Todas as notícias
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          {lead ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
              <NewsCard post={lead} variant="feature" />
              <ul className="divide-hair border-t border-white/10 lg:border-t-0">
                {rest.slice(0, 4).map((post) => (
                  <li key={post.id}>
                    <NewsCard post={post} variant="compact" />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyBlock
              title="Ainda sem notícias publicadas"
              text="Os comunicados oficiais da produção aparecem aqui. Consulte também as páginas do programa e do regulamento."
              href="/programa"
              hrefLabel="Sobre o programa"
            />
          )}
        </div>
      </section>

      {/* ================= VÍDEOS ================= */}
      <section className="border-b border-white/10 bg-ink-900/40 py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Multimédia</p>
              <h2 className="mt-3 display-2 text-white">Vídeos</h2>
              <p className="mt-3 max-w-lg text-[0.9rem] leading-relaxed text-white/50">
                Actuações, bastidores e os momentos decisivos de cada gala.
              </p>
            </div>
            <Link
              href="/galeria"
              className="group inline-flex shrink-0 items-center gap-2 text-[0.74rem] font-bold uppercase tracking-[0.18em] text-gold-300 hover:text-gold-200"
            >
              Ver galeria
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {videos.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <Link key={v.id} href="/galeria" className="group block">
                  <div className="relative overflow-hidden bg-ink-850">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.poster ?? v.src}
                      alt=""
                      className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-ink-950/40 text-white transition group-hover:border-gold-400 group-hover:text-gold-300">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-gold-400">
                    {v.event}
                    <span className="text-white/25">·</span>
                    <span className="text-white/35">{formatDate(v.createdAt, { day: "2-digit", month: "short" })}</span>
                  </p>
                  <p className="mt-1.5 font-display text-[0.95rem] font-bold uppercase leading-snug text-white">
                    {v.title}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock
              title="Ainda sem vídeos publicados"
              text="As galas e os bastidores são publicados pela produção na secção multimédia."
              href="/galeria"
              hrefLabel="Abrir galeria"
            />
          )}
        </div>
      </section>

      {/* ================= PATROCINADORES ================= */}
      {sponsors.length > 0 && (
        <section className="py-14 md:py-16">
          <div className="container-page">
            <p className="text-center text-[0.62rem] font-bold uppercase tracking-[0.24em] text-white/30">
              Patrocinadores oficiais
            </p>
            <ul className="mt-7 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {sponsors.map((s, i) => (
                <li
                  key={`${s.name}-${i}`}
                  className="grid h-14 place-items-center border border-white/8 px-3 text-center"
                >
                  <span className="text-[0.68rem] font-bold uppercase leading-tight tracking-[0.12em] text-white/45">
                    {s.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ================= FAIXA FINAL ================= */}
      <section className="border-t border-white/10 py-16 md:py-20">
        <div className="container-page flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Casa das Estrelas</p>
            <h2 className="mt-2 display-3 text-white">Acompanhe cada gala</h2>
            <p className="mt-2 max-w-md text-[0.88rem] leading-relaxed text-white/45">
              Resultados, nomeações e novidades oficiais. Sem notificações inventadas: só recebe o
              que a produção publicar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/classificacao" className="btn btn-ghost">
              <Clock className="h-4 w-4 text-gold-300" /> Classificação
            </Link>
            <Link href="/registo" className="btn btn-gold">
              Criar conta
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** Estado vazio editorial — nunca substituído por conteúdo fictício. */
function EmptyBlock({
  title,
  text,
  href,
  hrefLabel,
}: {
  title: string;
  text: string;
  href: string;
  hrefLabel: string;
}) {
  return (
    <div className="mt-10 flex flex-col items-start justify-between gap-5 border border-dashed border-white/12 px-6 py-10 sm:flex-row sm:items-center">
      <div>
        <p className="font-display text-[1.05rem] font-bold uppercase text-white/80">{title}</p>
        <p className="mt-2 max-w-xl text-[0.84rem] leading-relaxed text-white/40">{text}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-gold-300 hover:text-gold-200"
      >
        {hrefLabel}
      </Link>
    </div>
  );
}
