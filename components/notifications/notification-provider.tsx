"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppNotification } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Ctx {
  notifications: AppNotification[];
  unread: number;
  connected: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<Ctx | null>(null);

/**
 * Estado central de notificações do utilizador.
 * - Carrega a lista inicial a partir da API (server-side, com RLS).
 * - Assina o canal Supabase Realtime (`notification_recipients:user_id=eq.<id>`)
 *   para actualização em tempo real. Sem Supabase configurado, funciona em modo
 *   local com os dados fornecidos pelo servidor.
 * - Deduplica por id para nunca mostrar notificações repetidas.
 */
export function NotificationProvider({
  initial,
  userId,
  children,
}: {
  initial: AppNotification[];
  userId?: string | null;
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initial);
  const [connected, setConnected] = useState(false);

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: AppNotification[] };
      setNotifications((prev) => mergeUnique(data.notifications, prev));
    } catch {
      /* silencioso: a UI mantém o último estado conhecido */
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_recipients",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // O payload contém apenas a linha de destino; buscar o conteúdo completo.
          void refresh();
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  // Sincronização de reserva quando o separador volta a estar visível.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    void fetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ notifications, unread, connected, markRead, markAllRead, remove, refresh }),
    [notifications, unread, connected, markRead, markAllRead, remove, refresh],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications deve ser usado dentro de NotificationProvider");
  return ctx;
}

function mergeUnique(incoming: AppNotification[], current: AppNotification[]) {
  const map = new Map<string, AppNotification>();
  for (const n of [...incoming, ...current]) if (!map.has(n.id)) map.set(n.id, n);
  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
