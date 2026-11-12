"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Play, Star } from "lucide-react";

function Countdown({ target }: { target: string }) {
  // `null` no servidor: o valor real só é calculado no cliente, evitando
  // divergências de hidratação entre relógios.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const value = left ?? 0;
  const d = Math.floor(value / 86_400_000);
  const h = Math.floor((value % 86_400_000) / 3_600_000);
  const m = Math.floor((value % 3_600_000) / 60_000);
  const s = Math.floor((value % 60_000) / 1000);

  const cells = [
    { v: d, l: "dias" },
    { v: h, l: "horas" },
    { v: m, l: "min" },
    { v: s, l: "seg" },
  ];

  return (
    <div className="flex gap-2">
      {cells.map((c) => (
        <div
          key={c.l}
          className="min-w-[46px] rounded-lg border border-white/12 bg-white/[0.04] px-2 py-1.5 text-center backdrop-blur sm:min-w-[52px] sm:px-2.5"
        >
          <div
            className="font-display text-lg font-extrabold tabular-nums leading-none text-white"
            suppressHydrationWarning
          >
            {left === null ? "--" : String(c.v).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[0.5rem] uppercase leading-none tracking-[0.1em] text-white/40 sm:text-[0.55rem] sm:tracking-[0.14em]">
            {c.l}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Hero({
  campaignEndsAt,
  participantsCount,
}: {
  campaignEndsAt: string;
  participantsCount: number;
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(Math.min(window.scrollY, 600));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative -mt-16 flex min-h-[92vh] items-end overflow-hidden pt-16 md:-mt-[74px] md:min-h-[100vh] md:pt-[74px]">
      {/* Imagem de fundo com parallax subtil */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/hero.jpg"
          alt=""
          aria-hidden
          className="h-[112%] w-full object-cover object-center"
          style={{ transform: `translate3d(0,${offset * 0.16}px,0)` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#05060a_2%,rgba(5,6,10,0.86)_28%,rgba(5,6,10,0.35)_62%,rgba(5,6,10,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_20%,transparent,rgba(5,6,10,0.55))]" />
        <div className="absolute inset-0 noise" />
      </div>

      {/* Feixes de luz decorativos */}
      <div className="pointer-events-none absolute -left-32 top-0 h-full w-1/2 bg-[conic-gradient(from_150deg_at_0%_0%,rgba(242,182,43,0.13),transparent_35%)] blur-2xl" />

      <div className="container-page relative z-10 w-full pb-16 md:pb-24">
        <div className="max-w-3xl">
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <span className="badge badge-live backdrop-blur">
              <span className="live-dot" /> 1.ª Edição · Em emissão
            </span>
            <span className="badge badge-muted backdrop-blur">
              <Star className="h-3 w-3 text-gold-400" /> {participantsCount} concorrentes
            </span>
            <span className="badge badge-muted backdrop-blur">Angola · Moçambique</span>
          </div>

          <h1 className="font-display text-[2.55rem] font-black leading-[0.92] tracking-tight text-white text-shadow-hero sm:text-[3.6rem] md:text-[4.2rem] lg:text-[5.2rem]">
            <span className="block text-white/85">Casa das</span>
            <span className="block gold-text">Estrelas</span>
          </h1>

          <p className="mt-4 max-w-xl text-[0.9rem] leading-relaxed text-white/65 text-balance sm:mt-5 sm:text-[0.98rem] md:text-lg">
            Vinte talentos. Dois países. Uma casa. Acompanhe cada actuação, cada nomeação e cada
            decisão do público — e vote no seu favorito.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5 sm:mt-8 sm:gap-3">
            <Link href="/concorrentes" className="btn btn-gold px-6 py-3">
              Conhecer os concorrentes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/votar" className="btn btn-ghost px-6 py-3 backdrop-blur">
              <Star className="h-4 w-4 text-gold-300" /> Votar agora
            </Link>
            <Link
              href="/galeria"
              className="group inline-flex items-center gap-2 px-2 py-3 text-[0.8rem] font-semibold uppercase tracking-widest text-white/60 transition hover:text-white"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 transition group-hover:border-gold-400 group-hover:text-gold-300">
                <Play className="h-3.5 w-3.5 fill-current" />
              </span>
              Ver vídeos
            </Link>
          </div>

          <div className="mt-8 inline-flex flex-col gap-2 rounded-2xl border border-white/10 bg-ink-950/50 p-3 backdrop-blur-md sm:mt-10 sm:gap-2.5 sm:p-3.5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-gold-400">
              Votação encerra em
            </p>
            <Countdown target={campaignEndsAt} />
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="text-[0.55rem] uppercase tracking-[0.3em] text-white/30">descer</span>
        <span className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
}
