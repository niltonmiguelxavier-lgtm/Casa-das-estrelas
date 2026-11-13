"use client";

import { useActionState, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, PenLine, Plus, Save, Trash2, X } from "lucide-react";
import { deleteNewsAction, saveNewsAction } from "@/app/actions/content";
import type { AdminActionResult } from "@/app/actions/admin";
import type { AdminNewsRow } from "@/lib/services/admin-data";
import { cn, formatDateTime } from "@/lib/utils";

export function NewsEditor({ news }: { news: AdminNewsRow[] }) {
  const [editing, setEditing] = useState<AdminNewsRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [state, formAction, pending] = useActionState<AdminActionResult | undefined, FormData>(
    saveNewsAction,
    undefined,
  );
  const okRef = useRef(false);

  const open = creating || editing !== null;

  if (state?.ok && !okRef.current) {
    okRef.current = true;
    queueMicrotask(() => {
      setCreating(false);
      setEditing(null);
    });
  } else if (!state?.ok) {
    okRef.current = false;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8rem] text-white/45">
          {news.length} publicação(ões) · apenas as publicadas aparecem no site
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="btn btn-gold !py-2 !text-[0.76rem]"
        >
          <Plus className="h-3.5 w-3.5" /> Nova publicação
        </button>
      </div>

      {open && (
        <form action={formAction} className="border border-gold-400/25 bg-gold-400/[0.03] p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              {editing ? "Editar publicação" : "Nova publicação"}
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

          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="title">
                Título
              </label>
              <input
                id="title"
                name="title"
                required
                maxLength={160}
                defaultValue={editing?.title ?? ""}
                className="field"
              />
              {state?.fieldErrors?.title && <Err>{state.fieldErrors.title}</Err>}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="category">
                  Categoria
                </label>
                <select
                  id="category"
                  name="category"
                  className="field"
                  defaultValue={editing?.category ?? "Programa"}
                >
                  {["Comunicado", "Programa", "Eliminação", "Anúncio", "Imprensa"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="status">
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  className="field"
                  defaultValue={editing?.status ?? "rascunho"}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="publicado">Publicado</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="slug">
                  Endereço (opcional)
                </label>
                <input
                  id="slug"
                  name="slug"
                  defaultValue={editing?.slug ?? ""}
                  placeholder="gerado a partir do título"
                  className="field"
                />
                {state?.fieldErrors?.slug && <Err>{state.fieldErrors.slug}</Err>}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="cover">
                Imagem de capa (URL)
              </label>
              <input
                id="cover"
                name="cover"
                defaultValue={editing?.cover ?? ""}
                placeholder="https://… ou /media/…"
                className="field"
              />
              {state?.fieldErrors?.cover && <Err>{state.fieldErrors.cover}</Err>}
            </div>

            <div>
              <label className="label" htmlFor="excerpt">
                Resumo
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows={2}
                defaultValue={editing?.excerpt ?? ""}
                className="field resize-y"
              />
              {state?.fieldErrors?.excerpt && <Err>{state.fieldErrors.excerpt}</Err>}
            </div>

            <div>
              <label className="label" htmlFor="body">
                Corpo da notícia
              </label>
              <textarea
                id="body"
                name="body"
                rows={8}
                className="field resize-y font-mono text-[0.8rem]"
                placeholder="Texto integral. Uma linha em branco separa parágrafos."
              />
              {state?.fieldErrors?.body && <Err>{state.fieldErrors.body}</Err>}
            </div>
          </div>

          <button type="submit" disabled={pending} className="btn btn-gold mt-4 !py-2 !text-[0.78rem]">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar publicação
          </button>

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
        {news.length === 0 ? (
          <p className="px-4 py-10 text-center text-[0.84rem] text-white/40">
            Ainda não existem publicações. Crie a primeira com o botão acima.
          </p>
        ) : (
          <ul className="divide-y divide-white/6">
            {news.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.84rem] font-semibold text-white">{n.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.64rem] text-white/30">
                    <span className="badge badge-muted !text-[0.52rem]">{n.category}</span>
                    <span
                      className={cn(
                        "badge !text-[0.52rem]",
                        n.status === "publicado" ? "badge-green" : "badge-muted",
                      )}
                    >
                      {n.status}
                    </span>
                    <span>/{n.slug}</span>
                    {n.publishedAt && <span>· {formatDateTime(n.publishedAt)}</span>}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setEditing(n);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1 border border-white/12 px-2 py-1 text-[0.66rem] text-white/60 hover:border-gold-400/50 hover:text-white"
                  >
                    <PenLine className="h-3 w-3" /> Editar
                  </button>
                  <form
                    action={async (fd: FormData) => {
                      await deleteNewsAction(undefined, fd);
                    }}
                  >
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      aria-label={`Remover ${n.title}`}
                      className="border border-white/12 px-2 py-1 text-[0.66rem] text-white/40 hover:border-star-rose/50 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[0.7rem] text-rose-300">{children}</p>;
}
