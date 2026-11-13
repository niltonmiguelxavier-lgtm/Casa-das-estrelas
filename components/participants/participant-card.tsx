"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Heart } from "lucide-react";
import type { Participant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VoteDialog } from "@/components/voting/vote-dialog";
import { CountryCode } from "@/components/ui/country-tag";

const STATUS_LABEL: Record<string, string> = {
  activo: "Na casa",
  nomeado: "Nomeado",
  eliminado: "Eliminado",
  vencedor: "Vencedor",
};

/** Fotografia oficial ausente: moldura neutra com o número, nunca um rosto inventado. */
function PendingPortrait({ number, name }: { number: number; name: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-ink-850">
      <div className="text-center">
        <span className="font-display text-[2.6rem] font-black leading-none text-white/10">
          {String(number).padStart(2, "0")}
        </span>
        <span className="mt-2 block text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-white/25">
          fotografia oficial
          <br />
          em publicação
        </span>
      </div>
      <span className="sr-only">Retrato oficial de {name} ainda não publicado.</span>
    </div>
  );
}

/**
 * Cartão de concorrente — tratamento editorial.
 * Data de entrada, país, número e estado vêm da base de dados. O botão de voto
 * abre o diálogo de voto gratuito (validação no servidor).
 */
export function ParticipantCard({
  participant,
  index = 0,
  campaignId,
  authenticated,
  votingClosed = false,
}: {
  participant: Participant;
  index?: number;
  campaignId?: string;
  authenticated: boolean;
  votingClosed?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const p = participant;
  const eliminated = p.status === "eliminado";

  return (
    <>
      <article className="group relative flex flex-col">
        <Link
          href={`/concorrentes/${p.id}`}
          className="relative block overflow-hidden bg-ink-850"
          aria-label={`Ver perfil de ${p.name}`}
        >
          {p.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photo}
              alt={p.name}
              className="photo-cover aspect-[3/4] w-full transition-transform duration-500 group-hover:scale-[1.03]"
              loading={index < 4 ? "eager" : "lazy"}
            />
          ) : (
            <div className="aspect-[3/4]">
              <PendingPortrait number={p.number} name={p.name} />
            </div>
          )}

          <span
            className={cn(
              "absolute left-0 top-0 px-2 py-1 font-display text-[0.68rem] font-black tabular-nums",
              eliminated ? "bg-ink-950/85 text-white/45" : "bg-gold-400 text-ink-950",
            )}
          >
            {String(p.number).padStart(2, "0")}
          </span>

          <span
            className={cn(
              "absolute right-0 top-0 px-2 py-1 text-[0.55rem] font-bold uppercase tracking-[0.14em]",
              eliminated
                ? "bg-ink-950/85 text-white/40"
                : p.status === "nomeado"
                  ? "bg-star-rose text-white"
                  : "bg-ink-950/80 text-white/70",
            )}
          >
            {STATUS_LABEL[p.status] ?? p.status}
          </span>
        </Link>

        <div className="pt-3">
          <p className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/40">
            <CountryCode country={p.country} />
            {p.country}
            {p.occupation ? <span className="text-white/25">· {p.occupation}</span> : null}
          </p>
          <h3 className="mt-1.5 font-display text-[1.05rem] font-extrabold uppercase leading-tight text-white">
            <Link href={`/concorrentes/${p.id}`} className="hover:text-gold-200">
              {p.name}
            </Link>
          </h3>
          {p.tagline && (
            <p className="mt-1 line-clamp-2 text-[0.76rem] leading-relaxed text-white/45">
              {p.tagline}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/concorrentes/${p.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 border border-white/12 py-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:border-white/35 hover:text-white"
            >
              Perfil <ArrowUpRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              disabled={eliminated || votingClosed}
              className="flex flex-1 items-center justify-center gap-1.5 bg-gold-400 py-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink-950 transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-white/30"
            >
              <Heart className="h-3 w-3" /> Votar
            </button>
          </div>
        </div>
      </article>

      <VoteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        participant={{
          id: p.id,
          name: p.name,
          number: p.number,
          country: p.country,
          photo: p.photo,
        }}
        campaignId={campaignId}
        authenticated={authenticated}
      />
    </>
  );
}

/** Linha compacta de concorrente (listas, painéis, votação). */
export function ParticipantChip({ participant }: { participant: Participant }) {
  return (
    <Link
      href={`/concorrentes/${participant.id}`}
      className="flex items-center gap-3 border-b border-white/6 py-2.5 transition hover:bg-white/[0.02]"
    >
      <span className="w-7 shrink-0 font-display text-[0.72rem] font-black tabular-nums text-white/35">
        {String(participant.number).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.84rem] font-semibold text-white">
          {participant.name}
        </span>
        <span className="block text-[0.66rem] text-white/35">{participant.country}</span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
    </Link>
  );
}

/**
 * Moldura neutra para o retrato oficial ainda não publicado.
 * Usada no perfil público do concorrente — nunca apresenta um rosto inventado.
 */
export function PortraitPlaceholder({
  name,
  number,
  country,
}: {
  name: string;
  number: number;
  country: string;
}) {
  return (
    <div className="grid h-full w-full place-items-center bg-ink-850">
      <div className="text-center">
        <span className="font-display text-[4rem] font-black leading-none text-white/10">
          {String(number).padStart(2, "0")}
        </span>
        <span className="mt-3 block text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-white/28">
          Fotografia oficial
          <br />
          em publicação
        </span>
      </div>
      <span className="sr-only">
        Fotografia oficial de {name} ({country}) ainda não publicada.
      </span>
    </div>
  );
}
