"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import {
  deleteParticipantAction,
  saveParticipantAction,
} from "@/app/actions/participants";
import { useRef } from "react";
import type { AdminActionResult } from "@/app/actions/admin";
import type { Participant } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Editor de concorrentes do painel administrativo.
 * Um único formulário serve para criar e editar; a validação é repetida no
 * servidor e o resultado (sucesso ou erro) é apresentado ao utilizador.
 */
export function ParticipantEditor({ participants }: { participants: Participant[] }) {
  const [editing, setEditing] = useState<Participant | null>(null);
  const [creating, setCreating] = useState(false);
  const [state, formAction, pending] = useActionState<AdminActionResult | undefined, FormData>(
    saveParticipantAction,
    undefined,
  );

  const open = creating || editing !== null;
  const target = editing;
  const lastOk = useRef(false);

  // Fechar o painel uma única vez, depois de um guardado bem-sucedido.
  if (state?.ok && !lastOk.current) {
    lastOk.current = true;
    queueMicrotask(() => {
      setCreating(false);
      setEditing(null);
    });
  } else if (!state?.ok) {
    lastOk.current = false;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8rem] text-white/45">
          {participants.length} perfil(is) publicado(s) · alterações aparecem no site imediatamente
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="btn btn-gold !py-2 !text-[0.76rem]"
        >
          <Plus className="h-3.5 w-3.5" /> Novo concorrente
        </button>
      </div>

      {open && (
        <form action={formAction} className="border border-gold-400/25 bg-gold-400/[0.03] p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              {target ? `Editar: ${target.name}` : "Novo concorrente"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
              aria-label="Fechar"
              className="grid h-7 w-7 place-items-center rounded-full text-white/40 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {target && <input type="hidden" name="id" value={target.id} />}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Número" name="number" type="number" required defaultValue={target?.number ?? ""} error={state?.fieldErrors?.number} />
            <Field label="Nome" name="name" required defaultValue={target?.name ?? ""} error={state?.fieldErrors?.name} />
            <div>
              <label className="label" htmlFor="country">País</label>
              <select id="country" name="country" className="field" defaultValue={target?.country ?? "Moçambique"}>
                <option value="Moçambique">Moçambique</option>
                <option value="Angola">Angola</option>
              </select>
              {state?.fieldErrors?.country && <ErrMsg>{state.fieldErrors.country}</ErrMsg>}
            </div>
            <Field label="Idade" name="age" type="number" defaultValue={target?.age ?? ""} error={state?.fieldErrors?.age} />
            <Field label="Cidade" name="city" defaultValue={target?.city ?? ""} />
            <Field label="Profissão" name="occupation" defaultValue={target?.occupation ?? ""} />
            <div>
              <label className="label" htmlFor="status">Estado na competição</label>
              <select id="status" name="status" className="field" defaultValue={target?.status ?? "activo"}>
                <option value="activo">Na casa</option>
                <option value="nomeado">Nomeado</option>
                <option value="eliminado">Eliminado</option>
                <option value="vencedor">Vencedor</option>
              </select>
            </div>
            <Field
              label="Fotografia (URL)"
              name="photo"
              defaultValue={target?.photo ?? ""}
              placeholder="https://…"
              error={state?.fieldErrors?.photo}
              className="sm:col-span-2"
            />
            <Field
              label="Frase de apresentação"
              name="tagline"
              defaultValue={target?.tagline ?? ""}
              className="sm:col-span-2"
            />
            <Field
              label="Talentos (separados por vírgula)"
              name="talents"
              defaultValue={target?.talents.join(", ") ?? ""}
            />
          </div>

          <div className="mt-3">
            <label className="label" htmlFor="bio">Biografia</label>
            <textarea
              id="bio"
              name="bio"
              rows={5}
              maxLength={4000}
              defaultValue={target?.bio ?? ""}
              className="field resize-y"
              placeholder="Texto aprovado pelo concorrente. Não invente informação pessoal."
            />
            {state?.fieldErrors?.bio && <ErrMsg>{state.fieldErrors.bio}</ErrMsg>}
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 border border-white/10 bg-white/[0.02] p-3">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={target?.isPublished ?? false}
              className="h-4 w-4 accent-gold-400"
            />
            <span className="text-[0.78rem] text-white/70">
              Publicar no site (sem esta opção o perfil fica privado no painel)
            </span>
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={pending} className="btn btn-gold !py-2 !text-[0.78rem]">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {target ? "Guardar alterações" : "Criar concorrente"}
            </button>
          </div>

          {state && (
            <div
              role="status"
              className={cn(
                "mt-3 flex items-start gap-2.5 border p-3 text-[0.78rem]",
                state.ok
                  ? "border-star-teal/25 bg-star-teal/8 text-teal-200"
                  : "border-star-rose/30 bg-star-rose/8 text-rose-200",
              )}
            >
              {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
              <span>{state.message}</span>
            </div>
          )}
        </form>
      )}

      <div className="overflow-hidden border border-white/10">
        <div className="hidden grid-cols-[46px_1fr_110px_110px_90px] gap-3 border-b border-white/10 px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/30 md:grid">
          <span>Nº</span>
          <span>Nome</span>
          <span>País</span>
          <span>Estado</span>
          <span className="text-right">Acções</span>
        </div>
        {participants.length === 0 ? (
          <p className="px-4 py-10 text-center text-[0.84rem] text-white/40">
            Ainda não existem concorrentes. Crie o primeiro perfil com o botão acima.
          </p>
        ) : (
          <ul className="divide-y divide-white/6">
            {participants.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[46px_1fr_110px_110px_90px]"
              >
                <span className="font-display text-[0.76rem] font-bold tabular-nums text-white/40">
                  {String(p.number).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.84rem] font-semibold text-white">{p.name}</span>
                  <span className="block truncate text-[0.64rem] text-white/30 md:hidden">
                    {p.country} · {p.status}
                  </span>
                </span>
                <span className="hidden text-[0.74rem] text-white/50 md:block">{p.country}</span>
                <span className="hidden md:block">
                  <span className={cn("badge", p.status === "eliminado" ? "badge-muted" : "badge-gold")}>
                    {p.status}
                  </span>
                </span>
                <span className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setEditing(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="border border-white/12 px-2 py-1 text-[0.66rem] text-white/60 hover:border-gold-400/50 hover:text-white"
                  >
                    Editar
                  </button>
                  <form
                    action={async (fd: FormData) => {
                      await deleteParticipantAction(undefined, fd);
                    }}
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      aria-label={`Remover ${p.name}`}
                      className="border border-white/12 px-2 py-1 text-[0.66rem] text-white/40 hover:border-star-rose/50 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  error,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="field"
      />
      {error && <ErrMsg>{error}</ErrMsg>}
    </div>
  );
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[0.7rem] text-rose-300">{children}</p>;
}
