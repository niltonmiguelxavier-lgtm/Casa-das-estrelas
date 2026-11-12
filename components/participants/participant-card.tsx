"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Star, Heart } from "lucide-react";
import type { Participant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VoteDialog } from "@/components/voting/vote-dialog";
import { CountryCode } from "@/components/ui/country-tag";

/** Retrato provisório elegante enquanto a fotografia oficial não é carregada. */
export function PortraitPlaceholder({
  name,
  number,
  country,
}: {
  name: string;
  number: number;
  country: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const hue = (number * 37) % 360;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-ink-850">
      <div
        className="absolute inset-0 opacity-70 transition-transform duration-700 group-hover:scale-105"
        style={{
          background: `radial-gradient(120% 90% at 50% -10%, hsla(${hue}, 45%, 34%, 0.85), #0a0c14 65%)`,
        }}
      />
      <div className="absolute inset-0 grid-lines opacity-25" />
      <span className="relative font-display text-[3.2rem] font-black leading-none tracking-tight text-white/12">
        {initials}
      </span>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950 to-transparent" />
      <div className="absolute inset-x-0 top-0 flex justify-center pt-6">
        <span className="h-14 w-px bg-gradient-to-b from-white/25 to-transparent" />
      </div>
      <span className="absolute right-3 top-12 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[0.56rem] uppercase tracking-[0.16em] text-white/35 backdrop-blur">
        retrato oficial em breve
      </span>
      <span className="sr-only">
        Fotografia oficial de {name} ({country}) ainda não publicada.
      </span>
    </div>
  );
}

export function ParticipantCard({
  participant,
  index = 0,
  campaignId,
  authenticated,
}: {
  participant: Participant;
  index?: number;
  campaignId?: string;
  authenticated: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const p = participant;

  return (
    <>
      <article className="card group hover-lift">
        <Link
          href={`/concorrentes/${p.id}`}
          className="relative block aspect-[3/4] overflow-hidden"
          aria-label={`Ver perfil de ${p.name}`}
        >
          {p.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photo}
              alt={p.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              loading={index < 4 ? "eager" : "lazy"}
            />
          ) : (
            <PortraitPlaceholder name={p.name} number={p.number} country={p.country} />
          )}

          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent" />

          <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-gold-400/40 bg-ink-950/70 font-display text-[0.72rem] font-extrabold text-gold-300 backdrop-blur">
            {String(p.number).padStart(2, "0")}
          </span>

          <span
            className={cn(
              "badge absolute right-3 top-3 backdrop-blur",
              p.status === "eliminado"
                ? "badge-muted"
                : p.status === "vencedor"
                  ? "badge-green"
                  : p.status === "nomeado"
                    ? "badge-live"
                    : "badge-gold",
            )}
          >
            {p.status === "activo" ? "na casa" : p.status}
          </span>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/55">
              <CountryCode country={p.country} /> {p.country}
              {p.age ? <span className="text-white/30">· {p.age} anos</span> : null}
            </p>
            <h3 className="mt-1 font-display text-xl font-extrabold leading-tight text-white">
              {p.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[0.76rem] text-white/50">{p.tagline}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 border-t border-white/8 p-3">
          <Link
            href={`/concorrentes/${p.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-2 text-[0.72rem] font-bold uppercase tracking-wider text-white/80 transition hover:border-gold-400/40 hover:text-white"
          >
            Perfil <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            disabled={p.status === "eliminado"}
            className="btn btn-gold flex-1 !px-3 !py-2 !text-[0.72rem] uppercase tracking-wider disabled:opacity-40"
          >
            <Heart className="h-3.5 w-3.5" /> Votar
          </button>
        </div>
      </article>

      <VoteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        participant={{ id: p.id, name: p.name, number: p.number, country: p.country, photo: p.photo }}
        campaignId={campaignId}
        authenticated={authenticated}
        freeVotesPerUser={5}
      />
    </>
  );
}

export function ParticipantChip({ participant }: { participant: Participant }) {
  return (
    <Link
      href={`/concorrentes/${participant.id}`}
      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-2.5 transition hover:border-gold-400/35 hover:bg-white/[0.06]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-400/12 font-display text-xs font-extrabold text-gold-300">
        {String(participant.number).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.82rem] font-semibold text-white">
          {participant.name}
        </span>
        <span className="block text-[0.66rem] text-white/40">{participant.country}</span>
      </span>
      <Star className="ml-auto h-3.5 w-3.5 shrink-0 text-gold-500/60" />
    </Link>
  );
}
