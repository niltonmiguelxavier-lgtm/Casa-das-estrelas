import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Heart,
  Play,
  Shield,
  Sparkles,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { Hero } from "@/components/home/hero";
import { SponsorMarquee } from "@/components/home/marquee";
import { RankingTable } from "@/components/home/ranking-preview";
import { ParticipantCard } from "@/components/participants/participant-card";
import { NewsCard } from "@/components/news/news-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section";
import {
  getActiveCampaign,
  getRanking,
  listGallery,
  listNews,
  listPackages,
  listParticipants,
  listSponsors,
} from "@/lib/services/data";
import { getCurrentUser } from "@/lib/services/session";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { site } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const [participants, ranking, news, gallery, packages, campaign, sponsors, user] =
    await Promise.all([
      listParticipants(),
      getRanking(),
      listNews(4),
      listGallery(),
      listPackages(),
      getActiveCampaign(),
      listSponsors(),
      getCurrentUser(),
    ]);

  const featured = participants.slice(0, 8);
  const [lead, ...rest] = news;
  const videos = gallery.filter((g) => g.type === "video");
  const photos = gallery.filter((g) => g.type === "foto").slice(0, 5);
  const totalVotes = ranking.reduce((a, r) => a + r.votes, 0);

  return (
    <>
      <Hero
        campaignEndsAt={campaign?.endsAt ?? new Date(Date.now() + 5 * 86_400_000).toISOString()}
        participantsCount={participants.length}
      />

      <SponsorMarquee items={sponsors} />

      {/* ---------- Conceito ---------- */}
      <section className="container-page py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Reveal>
            <p className="title-eyebrow flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-gold-400/70" /> O programa
            </p>
            <h2 className="mt-3 font-display text-[2.1rem] font-extrabold leading-[1.02] text-white sm:text-[2.8rem]">
              Uma casa. Vinte talentos.
              <br />
              <span className="gold-text">O país decide.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-white/55">
              A Casa das Estrelas reúne dez concorrentes de Angola e dez de Moçambique numa
              competição de talento, convivência e resistência emocional. Cada semana há provas,
              actuações e nomeações — e o público tem a palavra final através da votação oficial.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat icon={<Users className="h-4 w-4" />} value="20" label="Concorrentes" />
              <MiniStat icon={<Heart className="h-4 w-4" />} value={formatNumber(totalVotes)} label="Votos contabilizados" />
              <MiniStat icon={<Sparkles className="h-4 w-4" />} value="2" label="Países" />
              <MiniStat icon={<Ticket className="h-4 w-4" />} value="10" label="Galas" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/programa" className="btn btn-ghost">
                Sobre o programa <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/regulamento" className="btn btn-outline-gold">
                Ler o regulamento
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120} className="relative">
            <div className="relative overflow-hidden rounded-xl2 border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/house.jpg"
                alt="Interior da casa do reality show"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-gold-400">
                  A casa
                </p>
                <p className="mt-1 text-sm text-white/75">
                  Um espaço desenhado para revelar talento — e carácter.
                </p>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 hidden rounded-xl border border-gold-400/30 bg-ink-950/90 px-3.5 py-2 backdrop-blur md:block">
              <p className="text-[0.55rem] uppercase tracking-[0.18em] text-white/40">Edição</p>
              <p className="font-display text-sm font-extrabold text-gold-200">{site.edition}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Concorrentes em destaque ---------- */}
      <section className="relative border-y border-white/8 bg-ink-900/40 py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="Os protagonistas"
            title="Concorrentes"
            description="Dez talentos de Angola, dez de Moçambique. Conheça quem está na casa e escolha o seu favorito."
            href="/concorrentes"
            hrefLabel="Ver os 20 concorrentes"
          />

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ParticipantCard
                  participant={p}
                  index={i}
                  campaignId={campaign?.id}
                  authenticated={Boolean(user)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Votar ---------- */}
      <section className="container-page py-20 md:py-28">
        <div className="relative overflow-hidden rounded-xl2 border border-white/10 bg-[radial-gradient(110%_120%_at_0%_0%,rgba(242,182,43,0.13),transparent_55%),linear-gradient(180deg,#0d0f18,#080910)] p-6 md:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <p className="title-eyebrow">Participar</p>
              <h2 className="mt-3 font-display text-[2rem] font-extrabold leading-[1.05] text-white sm:text-[2.6rem]">
                O seu voto decide quem fica.
              </h2>
              <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-white/55">
                Todos os dias tem votos gratuitos. Se quiser apoiar ainda mais o seu concorrente,
                pode adquirir pacotes de votos através de métodos de pagamento locais.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: <Heart className="h-4 w-4" />, t: "Voto gratuito", d: `${campaign?.freeVotesPerUser ?? 5} votos por dia` },
                  { icon: <Wallet className="h-4 w-4" />, t: "Pacotes de votos", d: `desde ${formatCurrency(packages[0]?.price ?? 50)}` },
                  { icon: <Shield className="h-4 w-4" />, t: "Registo seguro", d: "validado no servidor" },
                ].map((i) => (
                  <div
                    key={i.t}
                    className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5"
                  >
                    <span className="text-gold-300">{i.icon}</span>
                    <p className="mt-2 text-[0.82rem] font-semibold text-white">{i.t}</p>
                    <p className="text-[0.7rem] text-white/40">{i.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/votar" className="btn btn-gold px-6 py-3">
                  <Heart className="h-4 w-4" /> Votar gratuitamente
                </Link>
                <Link href="/votar/pacotes" className="btn btn-ghost px-6 py-3">
                  <Wallet className="h-4 w-4" /> Comprar votos
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gold-400/5 blur-2xl" />
              <RankingTable rows={ranking} limit={6} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Notícias ---------- */}
      <section className="container-page pb-20 md:pb-24">
        <SectionHeading
          eyebrow="Sala de imprensa"
          title="Últimas notícias"
          description="Comunicados oficiais, actualizações do programa e informações importantes."
          href="/noticias"
          hrefLabel="Todas as notícias"
        />
        <div className="mt-9 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {lead && <NewsCard post={lead} variant="feature" />}
          <div className="grid gap-5 sm:grid-cols-2">
            {rest.slice(0, 4).map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Vídeos + Galeria ---------- */}
      <section className="border-y border-white/8 bg-ink-900/40 py-20 md:py-24">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <p className="title-eyebrow">Multimédia</p>
              <h2 className="mt-3 font-display text-[2rem] font-extrabold leading-[1.05] text-white sm:text-[2.5rem]">
                Momentos que ficam
              </h2>
              <p className="mt-4 max-w-md text-[0.92rem] leading-relaxed text-white/55">
                Actuações, bastidores, ensaios e os instantes decisivos de cada gala — em vídeo e
                fotografia.
              </p>
              {videos[0] && (
                <Link
                  href="/galeria"
                  className="group relative mt-7 block overflow-hidden rounded-xl2 border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videos[0].poster ?? videos[0].src}
                    alt={videos[0].title}
                    className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-ink-950/50 text-white backdrop-blur transition group-hover:border-gold-400 group-hover:text-gold-300">
                      <Play className="h-6 w-6 fill-current" />
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <div>
                      <span className="badge badge-live">vídeo</span>
                      <p className="mt-2 font-display text-lg font-bold text-white">
                        {videos[0].title}
                      </p>
                    </div>
                    <span className="text-[0.6rem] uppercase tracking-widest text-white/40">
                      {videos[0].event}
                    </span>
                  </div>
                </Link>
              )}
            </Reveal>

            <Reveal delay={100}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((item, i) => (
                  <Link
                    key={item.id}
                    href="/galeria"
                    className={`group relative overflow-hidden rounded-lg border border-white/8 ${
                      i === 0 ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.src}
                      alt={item.title}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                        i === 0 ? "aspect-square" : "aspect-square"
                      }`}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <span className="absolute bottom-2 left-2.5 line-clamp-1 text-[0.62rem] font-semibold text-white/0 transition group-hover:text-white">
                      {item.title}
                    </span>
                  </Link>
                ))}
                <Link
                  href="/galeria"
                  className="grid aspect-square place-items-center rounded-lg border border-dashed border-white/12 text-center transition hover:border-gold-400/40 hover:bg-white/[0.03]"
                >
                  <span>
                    <Camera className="mx-auto h-5 w-5 text-gold-400/70" />
                    <span className="mt-1.5 block text-[0.62rem] font-bold uppercase tracking-widest text-white/45">
                      Ver galeria
                    </span>
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Patrocinadores ---------- */}
      <section className="container-page py-20 md:py-24">
        <SectionHeading
          eyebrow="Parceiros"
          title="Patrocinadores oficiais"
          description="Marcas que tornam a Casa das Estrelas possível."
          href="/patrocinadores"
          align="center"
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sponsors.map((s, i) => (
            <Reveal key={`${s.name}-${i}`} delay={i * 50}>
              <div className="group grid h-24 place-items-center rounded-xl border border-white/8 bg-white/[0.02] px-3 text-center transition hover:border-gold-400/30 hover:bg-white/[0.04]">
                <div>
                  <span className="mx-auto grid h-7 w-7 place-items-center rounded-md border border-white/10 text-[0.6rem] text-gold-400/70">
                    ✦
                  </span>
                  <p className="mt-2 text-[0.66rem] font-bold uppercase leading-tight tracking-[0.1em] text-white/40 group-hover:text-white/70">
                    {s.name}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3.5">
      <span className="text-gold-400/80">{icon}</span>
      <p className="mt-2 font-display text-xl font-extrabold tabular-nums text-white">{value}</p>
      <p className="text-[0.62rem] uppercase tracking-[0.1em] text-white/35">{label}</p>
    </div>
  );
}
