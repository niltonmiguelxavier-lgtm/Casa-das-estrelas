"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "@/components/notifications/notification-provider";
import { NOTIFICATION_CATEGORY_META } from "@/lib/services/notifications-meta";
import { cn, timeAgo } from "@/lib/utils";
import type { NotificationCategory } from "@/lib/types";

const CATEGORIES: (NotificationCategory | "todas")[] = [
  "todas",
  "votacao",
  "pagamento",
  "programa",
  "conta",
  "sistema",
];

export function NotificationsCenter() {
  const { notifications, unread, markRead, markAllRead, remove, connected } = useNotifications();
  const [category, setCategory] = useState<NotificationCategory | "todas">("todas");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const filtered = useMemo(
    () =>
      notifications.filter(
        (n) =>
          (category === "todas" || n.category === category) && (!onlyUnread || !n.read),
      ),
    [notifications, category, onlyUnread],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider transition",
                category === c
                  ? "border-gold-400/50 bg-gold-400/12 text-gold-200"
                  : "border-white/8 bg-white/[0.02] text-white/40 hover:text-white",
              )}
            >
              {c === "todas" ? "Todas" : NOTIFICATION_CATEGORY_META[c].label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[0.7rem] text-white/40">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
              className="accent-gold-400"
            />
            Não lidas
          </label>
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[0.68rem] font-semibold text-white/60 hover:border-gold-400/30 hover:text-white"
            >
              <CheckCheck className="h-3 w-3" /> Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {connected && (
        <p className="flex items-center gap-2 text-[0.7rem] text-star-teal">
          <span className="live-dot !bg-star-teal" /> Actualização em tempo real activa
        </p>
      )}

      <div className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
        <ul className="divide-y divide-white/5">
          {filtered.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-5 py-16 text-center">
              <Bell className="h-6 w-6 text-white/15" />
              <p className="text-[0.85rem] text-white/40">Sem notificações neste filtro.</p>
            </li>
          )}
          {filtered.map((n) => {
            const meta = NOTIFICATION_CATEGORY_META[n.category];
            return (
              <li
                key={n.id}
                className={cn(
                  "group relative px-5 py-4 transition",
                  !n.read && "bg-gold-400/[0.04]",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read ? "bg-white/15" : "bg-gold-400",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("badge", meta.tone)}>{meta.label}</span>
                      {n.priority === "alta" && <span className="badge badge-live">importante</span>}
                      <span className="text-[0.64rem] uppercase tracking-wider text-white/25">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[0.88rem] font-semibold text-white">{n.title}</p>
                    <p className="mt-0.5 text-[0.8rem] leading-relaxed text-white/50">{n.body}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {n.href && (
                        <Link
                          href={n.href}
                          onClick={() => !n.read && markRead(n.id)}
                          className="text-[0.68rem] font-bold uppercase tracking-wider text-gold-300 hover:text-gold-200"
                        >
                          Abrir
                        </Link>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="text-[0.68rem] uppercase tracking-wider text-white/35 hover:text-white/70"
                        >
                          Marcar como lida
                        </button>
                      )}
                      <button
                        onClick={() => remove(n.id)}
                        className="ml-auto flex items-center gap-1 text-[0.66rem] text-white/20 hover:text-star-rose"
                        aria-label="Eliminar notificação da minha vista"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-[0.7rem] leading-relaxed text-white/25">
        Avisos de segurança e de transacções são essenciais e não podem ser desactivados como
        marketing. Pode configurar os restantes canais em{" "}
        <Link href="/painel/preferencias" className="text-gold-300 underline">
          preferências
        </Link>
        .
      </p>
    </div>
  );
}
