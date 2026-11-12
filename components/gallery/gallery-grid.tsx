"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, X, ChevronLeft, ChevronRight, ImageIcon, Video } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GalleryGrid({ items, events }: { items: GalleryItem[]; events: string[] }) {
  const [filter, setFilter] = useState<string>("Todos");
  const [type, setType] = useState<"todos" | "foto" | "video">("todos");
  const [index, setIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) => (filter === "Todos" || i.event === filter) && (type === "todos" || i.type === type),
      ),
    [items, filter, type],
  );

  const open = index !== null ? filtered[index] : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % filtered.length));
      if (e.key === "ArrowLeft")
        setIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, filtered.length]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {(
            [
              { id: "todos", label: "Tudo", icon: null },
              { id: "foto", label: "Fotografias", icon: <ImageIcon className="h-3 w-3" /> },
              { id: "video", label: "Vídeos", icon: <Video className="h-3 w-3" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setType(t.id);
                setIndex(null);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider transition",
                type === t.id
                  ? "border-gold-400/60 bg-gold-400/15 text-gold-200"
                  : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {["Todos", ...events].map((e) => (
            <button
              key={e}
              onClick={() => {
                setFilter(e);
                setIndex(null);
              }}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-[0.7rem] transition",
                filter === e
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-white/8 bg-white/[0.015] text-white/40 hover:text-white/70",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {filtered.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setIndex(i)}
            className="group relative block w-full overflow-hidden rounded-lg border border-white/8 bg-ink-800"
            aria-label={`Abrir ${item.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.poster ?? item.src}
              alt={item.title}
              className={cn(
                "w-full object-cover transition-transform duration-700 group-hover:scale-105",
                i % 5 === 0 ? "aspect-[3/4]" : i % 3 === 0 ? "aspect-square" : "aspect-[4/3]",
              )}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent opacity-80" />
            {item.type === "video" && (
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-ink-950/50 text-white backdrop-blur transition group-hover:border-gold-400 group-hover:text-gold-300">
                  <Play className="h-4 w-4 fill-current" />
                </span>
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 p-2.5 text-left">
              <span className="block text-[0.58rem] font-bold uppercase tracking-widest text-gold-400">
                {item.event}
              </span>
              <span className="mt-0.5 block truncate text-[0.72rem] font-semibold text-white">
                {item.title}
              </span>
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-white/40">
          Sem conteúdos nesta colecção.
        </p>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/95 p-4 backdrop-blur">
          <button
            onClick={() => setIndex(null)}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length))}
            className="absolute left-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIndex((i) => (i === null ? i : (i + 1) % filtered.length))}
            className="absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white"
            aria-label="Seguinte"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <figure className="max-h-[86vh] max-w-4xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.type === "video" ? (open.poster ?? open.src) : open.src}
              alt={open.title}
              className="max-h-[76vh] w-auto rounded-xl border border-white/10 object-contain"
            />
            <figcaption className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gold-400">
                  {open.event} · {open.type}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">{open.title}</p>
                <p className="text-[0.76rem] text-white/45">{open.caption}</p>
              </div>
              {open.type === "video" && (
                <span className="shrink-0 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-[0.6rem] uppercase tracking-widest text-gold-200">
                  vídeo oficial
                </span>
              )}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
