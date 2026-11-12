"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Heart, Loader2, LogIn, CheckCircle2, AlertTriangle, X, Plus } from "lucide-react";
import { castFreeVoteAction, type VoteState } from "@/app/actions/voting";
import { cn } from "@/lib/utils";

export interface VoteTarget {
  id: string;
  name: string;
  number: number;
  country: string;
  photo: string | null;
}

/**
 * Diálogo de voto gratuito.
 *
 * Regra de autenticação:
 *  - Se o visitante não tem sessão, guarda a intenção em localStorage
 *    (`cde_vote_intent`) e é encaminhado para /entrar?next=...&intent=...
 *  - Depois do login, `VoteIntentRestorer` (montado globalmente) reabre o
 *    concorrente selecionado, sem perder a escolha.
 */
export function VoteDialog({
  open,
  onClose,
  participant,
  campaignId,
  authenticated,
  freeVotesPerUser = 5,
}: {
  open: boolean;
  onClose: () => void;
  participant: VoteTarget;
  campaignId?: string;
  authenticated: boolean;
  freeVotesPerUser?: number;
}) {
  const pathname = usePathname();
  const [state, formAction, pending] = useActionState<VoteState | undefined, FormData>(
    castFreeVoteAction,
    undefined,
  );
  const [quantity, setQuantity] = useState(1);
  const [closedAfterSuccess, setClosedAfterSuccess] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (state?.ok && !closedAfterSuccess) setClosedAfterSuccess(true);
  }, [state, closedAfterSuccess]);

  const saveIntent = () => {
    try {
      localStorage.setItem(
        "cde_vote_intent",
        JSON.stringify({
          participantId: participant.id,
          campaignId,
          timestamp: Date.now(),
          returnTo: pathname,
        }),
      );
    } catch {
      /* localStorage indisponível — segue sem intenção guardada */
    }
  };

  if (!open) return null;

  const loginHref = `/entrar?next=${encodeURIComponent(pathname)}&motivo=votar&intent=${participant.id}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vote-dialog-title"
        className="relative w-full max-w-md animate-[fade-up_0.28s_ease] overflow-hidden rounded-t-3xl border border-white/10 bg-ink-900 shadow-2xl sm:rounded-3xl"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(242,182,43,0.18),transparent)]" />
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-6">
          <p className="title-eyebrow">Voto gratuito</p>
          <h2 id="vote-dialog-title" className="mt-2 font-display text-2xl font-extrabold text-white">
            Votar em {participant.name}
          </h2>
          <p className="mt-1 text-[0.8rem] text-white/50">
            Nº {String(participant.number).padStart(2, "0")} · {participant.country}
          </p>

          {!authenticated ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-gold-400/20 bg-gold-400/[0.06] p-3.5">
                <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                <div className="text-[0.8rem] leading-relaxed text-white/70">
                  Para votar é necessário ter sessão iniciada. A sua escolha fica guardada e
                  voltamos a esta página depois de entrar.
                </div>
              </div>
              <Link
                href={loginHref}
                onClick={saveIntent}
                className="btn btn-gold w-full"
              >
                Iniciar sessão e votar
              </Link>
              <Link href="/registo" onClick={saveIntent} className="btn btn-ghost w-full">
                Criar conta gratuita
              </Link>
              <p className="text-center text-[0.68rem] text-white/35">
                Não partilhamos os seus dados. Consulte a{" "}
                <Link href="/privacidade" className="underline hover:text-white/60">
                  política de privacidade
                </Link>
                .
              </p>
            </div>
          ) : (
            <form action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="participantId" value={participant.id} />
              <input type="hidden" name="campaignId" value={campaignId ?? ""} />

              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.72rem] font-bold uppercase tracking-widest text-white/45">
                    Votos a usar
                  </span>
                  <span className="text-[0.7rem] text-white/40">
                    limite: {freeVotesPerUser}/dia
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  {[1, 2, 3, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuantity(n)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 font-display text-sm font-extrabold transition",
                        quantity === n
                          ? "border-gold-400/60 bg-gold-400/15 text-gold-200"
                          : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="quantity" value={quantity} />
              </div>

              <button type="submit" disabled={pending} className="btn btn-gold w-full">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> A registar voto…
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" /> Confirmar {quantity} voto{quantity > 1 ? "s" : ""}
                  </>
                )}
              </button>

              <Link
                href={`/votar/pacotes?concorrente=${participant.id}`}
                className="flex items-center justify-center gap-1.5 text-[0.72rem] font-semibold text-gold-300 hover:text-gold-200"
              >
                <Plus className="h-3.5 w-3.5" /> Comprar votos adicionais
              </Link>

              {state?.message && (
                <div
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border p-3 text-[0.78rem] leading-relaxed",
                    state.ok
                      ? "border-star-teal/25 bg-star-teal/8 text-star-teal"
                      : "border-star-rose/25 bg-star-rose/8 text-rose-300",
                  )}
                  role="status"
                >
                  {state.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{state.message}</span>
                </div>
              )}

              <p className="text-center text-[0.66rem] leading-relaxed text-white/30">
                O voto é validado no servidor e registado com data, hora e campanha.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
