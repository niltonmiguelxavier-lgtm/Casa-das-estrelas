"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, Sparkles } from "lucide-react";
import { createOrderAction, type OrderState } from "@/app/actions/payments";
import { Avatar } from "@/components/ui/logo";
import { cn, formatCurrency } from "@/lib/utils";
import type { VotePackage } from "@/lib/types";

interface Option {
  id: string;
  name: string;
  number: number;
  country: string;
  photo: string | null;
}

export function PackageCheckout({
  packages,
  participants,
  methods,
  authenticated,
  preselected,
}: {
  packages: VotePackage[];
  participants: Option[];
  methods: { id: string; label: string; region: string }[];
  authenticated: boolean;
  preselected: string | null;
}) {
  const [state, formAction, pending] = useActionState<OrderState | undefined, FormData>(
    createOrderAction,
    undefined,
  );
  const [packageId, setPackageId] = useState(packages.find((p) => p.bestValue)?.id ?? packages[0]?.id ?? "");
  const [participantId, setParticipantId] = useState(
    participants.find((p) => p.id === preselected)?.id ?? participants[0]?.id ?? "",
  );
  const [method, setMethod] = useState(methods[0]?.id ?? "");

  const pkg = useMemo(() => packages.find((p) => p.id === packageId), [packages, packageId]);
  const target = useMemo(
    () => participants.find((p) => p.id === participantId),
    [participants, participantId],
  );
  const totalVotes = pkg ? pkg.votes : 0;

  return (
    <form action={formAction} className="min-w-0 space-y-6">
      <input type="hidden" name="packageId" value={packageId} />
      <input type="hidden" name="participantId" value={participantId} />
      <input type="hidden" name="method" value={method} />

      {/* 1. Concorrente */}
      <fieldset className="min-w-0">
        <legend className="mb-3 flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/45">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-400/12 text-[0.62rem] text-gold-300">1</span>
          Escolha o concorrente
        </legend>
        <div className="scrollbar-none flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
          {participants.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setParticipantId(p.id)}
              className={cn(
                "flex w-36 shrink-0 flex-col items-center gap-2 rounded-xl border p-3 transition",
                participantId === p.id
                  ? "border-gold-400/60 bg-gold-400/10"
                  : "border-white/8 bg-white/[0.02] hover:border-white/20",
              )}
            >
              <Avatar name={p.name} src={p.photo} size={44} />
              <span className="w-full truncate text-center text-[0.74rem] font-semibold text-white">
                {p.name}
              </span>
              <span className="text-[0.58rem] uppercase tracking-wide text-white/35">
                Nº {String(p.number).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* 2. Pacote */}
      <fieldset className="min-w-0">
        <legend className="mb-3 flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/45">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-400/12 text-[0.62rem] text-gold-300">2</span>
          Escolha o pacote
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {packages.length === 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-[0.8rem] leading-relaxed text-white/50 sm:col-span-2">
              <strong className="text-white/75">Nenhum pacote disponível neste momento.</strong>{" "}
              Os pacotes de votos são definidos pela produção (nome, quantidade, preço, moeda e
              validade) e só aparecem aqui depois de aprovados. Nenhum valor é apresentado por
              estimativa.
            </div>
          )}
          {packages.map((p) => {
            const active = packageId === p.id;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setPackageId(p.id)}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-4 text-left transition",
                  active
                    ? "border-gold-400/60 bg-gold-400/[0.09] shadow-[0_0_0_1px_rgba(242,182,43,0.15)]"
                    : "border-white/8 bg-white/[0.02] hover:border-white/20",
                )}
              >
                {p.bestValue && (
                  <span className="absolute right-0 top-0 rounded-bl-lg bg-gold-400 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-ink-950">
                    melhor valor
                  </span>
                )}
                <p className="font-display text-lg font-extrabold text-white">{p.name}</p>
                <p className="mt-0.5 text-[0.78rem] text-white/45">
                  {p.votes} votos {p.bonusLabel ? `· ${p.bonusLabel}` : ""}
                </p>
                <p className="mt-2 font-display text-xl font-extrabold text-gold-300">
                  {formatCurrency(p.price, p.currency)}
                </p>
                <p className="text-[0.62rem] uppercase tracking-wider text-white/25">
                  {formatCurrency(p.price / p.votes, p.currency)} por voto
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 3. Método */}
      <fieldset className="min-w-0">
        <legend className="mb-3 flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/45">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-400/12 text-[0.62rem] text-gold-300">3</span>
          Método de pagamento
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {methods.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition",
                method === m.id
                  ? "border-gold-400/60 bg-gold-400/10"
                  : "border-white/8 bg-white/[0.02] hover:border-white/20",
              )}
            >
              <span>
                <span className="block text-[0.8rem] font-semibold text-white">{m.label}</span>
                <span className="block text-[0.58rem] uppercase tracking-wider text-white/30">
                  {m.region}
                </span>
              </span>
              {method === m.id && <CheckCircle2 className="h-3.5 w-3.5 text-gold-400" />}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Resumo */}
      <div className="rounded-xl2 border border-white/10 bg-ink-900/80 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/35">
              Total a pagar
            </p>
            <p className="mt-1 font-display text-2xl font-black text-white">
              {pkg ? formatCurrency(pkg.price, pkg.currency) : "—"}
            </p>
            <p className="mt-1 text-[0.7rem] text-white/40">
              {totalVotes} votos para {target?.name ?? "—"}
            </p>
          </div>
          {authenticated ? (
            <button type="submit" disabled={pending || !pkg} className="btn btn-gold px-6 py-3">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> A criar ordem…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" /> Continuar para pagamento
                </>
              )}
            </button>
          ) : (
            <Link
              href={`/entrar?next=${encodeURIComponent(`/votar/pacotes?concorrente=${participantId}`)}&motivo=comprar`}
              className="btn btn-gold px-6 py-3"
            >
              <LockIcon /> Iniciar sessão para comprar
            </Link>
          )}
        </div>

        {state?.message && (
          <div
            role="status"
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-[0.79rem] leading-relaxed",
              state.ok
                ? "border-star-teal/25 bg-star-teal/8 text-teal-200"
                : "border-gold-400/25 bg-gold-400/8 text-gold-100",
            )}
          >
            {state.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <p>{state.message}</p>
              {state.reference && (
                <p className="mt-1 font-mono text-[0.75rem] text-white/60">
                  Referência: {state.reference}
                </p>
              )}
            </div>
          </div>
        )}

        <p className="mt-3 flex items-start gap-1.5 text-[0.66rem] leading-relaxed text-white/25">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-gold-500/60" />
          Os votos só são creditados após confirmação verificada por webhook do fornecedor. O
          regresso à página de sucesso não credita votos.
        </p>
      </div>
    </form>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
