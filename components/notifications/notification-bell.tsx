"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useNotifications } from "@/components/notifications/notification-provider";

export function NotificationBell() {
  const { notifications, unread, markRead, markAllRead, connected } = useNotifications();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const lastCount = useRef(unread);

  // Aviso discreto quando chega uma notificação nova (sem interromper a navegação).
  useEffect(() => {
    if (unread > lastCount.current && notifications[0]) {
      setToast(notifications[0].title);
      const t = setTimeout(() => setToast(null), 5200);
      lastCount.current = unread;
      return () => clearTimeout(t);
    }
    lastCount.current = unread;
  }, [unread, notifications]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const recent = notifications.slice(0, 6);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ""}`}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:border-gold-400/40 hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-star-rose px-1 text-[10px] font-bold text-white ring-2 ring-ink-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {toast && !open && (
        <div className="absolute right-0 top-12 z-50 w-72 animate-[fade-up_0.3s_ease] rounded-xl border border-gold-400/30 bg-ink-900/95 p-3 shadow-2xl backdrop-blur">
          <p className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-gold-400">
            <span className="live-dot" /> Nova notificação
          </p>
          <p className="mt-1 line-clamp-2 text-[0.8rem] font-semibold text-white">{toast}</p>
        </div>
      )}

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-white/10 bg-ink-900/98 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Notificações</h3>
              {connected && (
                <span className="badge badge-green !px-1.5 !py-0.5 !text-[0.55rem]">tempo real</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="rounded-md px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-gold-300 hover:bg-white/5"
                >
                  Marcar lidas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="grid h-6 w-6 place-items-center rounded-md text-white/50 hover:bg-white/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <ul className="max-h-[22rem] divide-y divide-white/5 overflow-y-auto">
            {recent.length === 0 && (
              <li className="px-4 py-8 text-center text-xs text-white/45">
                Não tem notificações.
              </li>
            )}
            {recent.map((n) => (
              <li key={n.id} className={cn(!n.read && "bg-gold-400/[0.045]")}>
                <div className="flex gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      n.read ? "bg-white/20" : "bg-gold-400",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8rem] font-semibold text-white">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[0.72rem] leading-snug text-white/50">
                      {n.body}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[0.62rem] uppercase tracking-wider text-white/30">
                        {timeAgo(n.createdAt)}
                      </span>
                      {n.href && (
                        <Link
                          href={n.href}
                          onClick={() => {
                            if (!n.read) markRead(n.id);
                            setOpen(false);
                          }}
                          className="text-[0.62rem] font-bold uppercase tracking-wider text-gold-400 hover:text-gold-200"
                        >
                          Abrir
                        </Link>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="ml-auto flex items-center gap-1 text-[0.62rem] text-white/35 hover:text-white/70"
                        >
                          <Check className="h-3 w-3" /> lida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-white/8 p-2">
            <Link
              href="/painel/notificacoes"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-[0.72rem] font-bold uppercase tracking-widest text-gold-300 hover:bg-white/5"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Ver todas as notificações
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
