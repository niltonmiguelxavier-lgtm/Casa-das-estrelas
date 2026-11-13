"use client";

import { useActionState, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { deleteGalleryAction, saveGalleryAction } from "@/app/actions/content";
import type { AdminActionResult } from "@/app/actions/admin";
import type { AdminGalleryRow } from "@/lib/services/admin-data";
import { cn, formatDate } from "@/lib/utils";

export function GalleryEditor({ items }: { items: AdminGalleryRow[] }) {
  const [editing, setEditing] = useState<AdminGalleryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<"foto" | "video">("foto");
  const [state, formAction, pending] = useActionState<AdminActionResult | undefined, FormData>(
    saveGalleryAction,
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

  const activeType = editing?.type ?? type;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8rem] text-white/45">
          {items.length} item(ns) · {items.filter((i) => i.type === "video").length} vídeo(s)
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setType("foto");
            setCreating(true);
          }}
          className="btn btn-gold !py-2 !text-[0.76rem]"
        >
          <Plus className="h-3.5 w-3.5" /> Novo item
        </button>
      </div>

      {open && (
        <form action={formAction} className="border border-gold-400/25 bg-gold-400/[0.03] p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              {editing ? "Editar item" : "Novo item da galeria"}
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

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="type">
                Tipo
              </label>
              <select
                id="type"
                name="type"
                className="field"
                value={activeType}
                onChange={(e) => setType(e.target.value as "foto" | "video")}
                disabled={Boolean(editing)}
              >
                <option value="foto">Fotografia</option>
                <option value="video">Vídeo</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="event">
                Evento / gala
              </label>
              <input id="event" name="event" defaultValue={editing?.event ?? ""} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="title">
                Título
              </label>
              <input id="title" name="title" required defaultValue={editing?.title ?? ""} className="field" />
              {state?.fieldErrors?.title && <Err>{state.fieldErrors.title}</Err>}
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="url">
                {activeType === "video" ? "Endereço do vídeo (MP4) ou página" : "Endereço da fotografia"}
              </label>
              <input
                id="url"
                name="url"
                required
                defaultValue={editing?.url ?? ""}
                placeholder="https://… ou /media/…"
                className="field"
              />
              {state?.fieldErrors?.url && <Err>{state.fieldErrors.url}</Err>}
            </div>
            {activeType === "video" && (
              <div className="sm:col-span-2">
                <label className="label" htmlFor="poster">
                  Miniatura do vídeo
                </label>
                <input
                  id="poster"
                  name="poster"
                  defaultValue={editing?.poster ?? ""}
                  placeholder="https://…"
                  className="field"
                />
                {state?.fieldErrors?.poster && <Err>{state.fieldErrors.poster}</Err>}
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="caption">
                Legenda
              </label>
              <input id="caption" name="caption" defaultValue={editing?.caption ?? ""} className="field" />
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 border border-white/10 bg-white/[0.02] p-3">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={editing?.isPublished ?? true}
              className="h-4 w-4 accent-gold-400"
            />
            <span className="text-[0.78rem] text-white/70">Visível na galeria pública</span>
          </label>

          <button type="submit" disabled={pending} className="btn btn-gold mt-4 !py-2 !text-[0.78rem]">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
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

      {items.length === 0 ? (
        <p className="border border-dashed border-white/12 px-4 py-10 text-center text-[0.84rem] text-white/40">
          Ainda não existem fotografias nem vídeos. A galeria pública fica vazia até adicionar
          conteúdo real.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.id} className="border border-white/10">
              <div className="relative aspect-video overflow-hidden bg-ink-850">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={i.type === "video" ? (i.poster ?? "/media/spotlights.jpg") : i.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute left-0 top-0 bg-ink-950/85 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-white/60">
                  {i.type}
                </span>
                {!i.isPublished && (
                  <span className="absolute right-0 top-0 bg-ink-950/85 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-rose-300">
                    oculto
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-[0.8rem] font-semibold text-white">{i.title}</p>
                <p className="mt-0.5 text-[0.62rem] text-white/30">
                  {i.event ?? "—"} · {formatDate(i.createdAt, { day: "2-digit", month: "short" })}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setEditing(i);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="border border-white/12 px-2 py-1 text-[0.64rem] text-white/60 hover:border-gold-400/50 hover:text-white"
                  >
                    Editar
                  </button>
                  <form
                    action={async (fd: FormData) => {
                      await deleteGalleryAction(undefined, fd);
                    }}
                  >
                    <input type="hidden" name="id" value={i.id} />
                    <button
                      type="submit"
                      aria-label={`Remover ${i.title}`}
                      className="border border-white/12 px-2 py-1 text-[0.64rem] text-white/40 hover:border-star-rose/50 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[0.7rem] text-rose-300">{children}</p>;
}
