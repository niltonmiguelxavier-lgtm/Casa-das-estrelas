import Link from "next/link";
import { ArrowRight, Heart, Play } from "lucide-react";
import { VoteCountdown } from "@/components/voting/vote-countdown";
import { site } from "@/lib/site";

export interface FeaturedParticipant {
  id: string;
  name: string;
  number: number;
  photo: string | null;
}

/**
 * Secção principal (hero) — composição editorial.
 *
 * - A fotografia oficial é a protagonista; o texto ocupa a coluna da esquerda.
 * - Sem camadas de brilho, ruído, feixes de luz ou parallax agressivo.
 * - Quando não existem fotografias oficiais de concorrentes, o lado direito
 *   fica com um retrato pendente claramente identificado — nunca uma pessoa
 *   inventada.
 */
export function HomeHero({
  edition,
  participantsCount,
  campaignEndsAt,
  campaignName,
  featured,
}: {
  edition: string;
  participantsCount: number;
  campaignEndsAt: string | null;
  campaignName: string | null;
  featured: FeaturedParticipant[];
}) {
  const [main, ...rest] = featured;

  return (
    <section className="relative border-b border-white/10">
      <div className="container-page grid items-center gap-8 py-8 sm:gap-10 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-14">
        {/* ---------- Coluna editorial ---------- */}
        <div className="order-1">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.66rem] font-bold uppercase tracking-[0.24em] text-white/40">
            <span className="text-gold-400">{edition}</span>
            <span aria-hidden>·</span>
            <span>Angola</span>
            <span aria-hidden>·</span>
            <span>Moçambique</span>
          </p>

          <h1 className="mt-5 display-1 text-white">
            Casa
            <br />
            das <span className="text-gold-400">Estrelas</span>
          </h1>

          <p className="mt-6 max-w-lg lead">
            Vinte concorrentes, dois países e uma casa. Cada gala revela talento, cada votação
            decide quem continua — e o público tem a palavra final.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/concorrentes" className="btn btn-gold px-6 py-3">
              Conhecer concorrentes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/votar" className="btn btn-ghost px-6 py-3">
              <Heart className="h-4 w-4 text-gold-300" /> Votar
            </Link>
            <Link
              href="/galeria"
              className="group inline-flex items-center gap-2.5 px-1 py-3 text-[0.78rem] font-bold uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20 transition group-hover:border-gold-400 group-hover:text-gold-300">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Ver vídeos
            </Link>
          </div>

          {/* Estado da votação — só com campanha real */}
          {campaignEndsAt && (
            <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                  {campaignName ? "Votação aberta" : "Votação"}
                </p>
                {campaignName && (
                  <p className="mt-1.5 text-[0.82rem] text-white/50">{campaignName}</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Encerra em
                </p>
                <VoteCountdown target={campaignEndsAt} />
              </div>
            </div>
          )}

          {!campaignEndsAt && (
            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/35">
                Votação
              </p>
              <p className="mt-1.5 max-w-md text-[0.82rem] leading-relaxed text-white/45">
                Não há campanha de votação aberta neste momento. As datas são anunciadas nesta
                página e nas notícias oficiais.
              </p>
            </div>
          )}
        </div>

        {/* ---------- Coluna visual ---------- */}
        <div className="order-2">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <figure className="relative col-span-2 overflow-hidden bg-ink-850 sm:col-span-2">
              {main?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={main.photo}
                  alt={main.name}
                  className="photo-cover aspect-[4/5] w-full sm:aspect-[16/11] lg:aspect-[4/5]"
                  fetchPriority="high"
                />
              ) : (
                <div className="relative grid aspect-[16/11] w-full place-items-center bg-ink-850 sm:aspect-[16/10] lg:aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/media/hero.jpg"
                    alt="Palco oficial do programa"
                    className="absolute inset-0 h-full w-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
                  <figcaption className="relative self-end p-5">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-gold-400">
                      Palco oficial
                    </p>
                    <p className="mt-1.5 max-w-[16rem] text-[0.82rem] leading-relaxed text-white/70">
                      {participantsCount === 0
                        ? "A galeria de concorrentes é publicada pela produção antes da estreia."
                        : "Os retratos oficiais dos concorrentes são publicados pela produção."}
                    </p>
                  </figcaption>
                </div>
              )}
              {main && (
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent p-4">
                  <div>
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-gold-400">
                      Em destaque
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold uppercase text-white">
                      {main.name}
                    </p>
                  </div>
                  <Link
                    href={`/concorrentes/${main.id}`}
                    aria-label={`Perfil de ${main.name}`}
                    className="tap grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 text-white transition hover:border-gold-400 hover:text-gold-300"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </figcaption>
              )}
            </figure>

            {rest.slice(0, 2).map((p) => (
              <Link
                key={p.id}
                href={`/concorrentes/${p.id}`}
                className="group relative overflow-hidden bg-ink-850"
              >
                {p.photo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="photo-cover aspect-square w-full transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 to-transparent p-3">
                      <span className="block font-display text-[0.8rem] font-bold uppercase text-white">
                        {p.name}
                      </span>
                    </span>
                  </>
                ) : (
                  <div className="grid aspect-square w-full place-items-center bg-ink-850">
                    <span className="font-display text-[0.62rem] uppercase tracking-[0.2em] text-white/25">
                      Nº {String(p.number).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </Link>
            ))}

            {featured.length === 0 && (
              <div className="col-span-2 flex items-center justify-between gap-4 border border-dashed border-white/12 px-5 py-4">
                <p className="text-[0.78rem] leading-relaxed text-white/40">
                  Os concorrentes desta edição são publicados pela produção. Acompanhe as notícias
                  oficiais.
                </p>
                <Link
                  href="/noticias"
                  className="shrink-0 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-gold-300 hover:text-gold-200"
                >
                  Notícias
                </Link>
              </div>
            )}
          </div>

          <p className="mt-3 text-[0.66rem] leading-relaxed text-white/25">
            {site.name} · {edition}. Fotografias oficiais publicadas pela produção.
          </p>
        </div>
      </div>
    </section>
  );
}
