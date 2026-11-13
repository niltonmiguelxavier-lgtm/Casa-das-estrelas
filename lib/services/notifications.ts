import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/lib/types";

export async function listNotifications(limit = 50): Promise<AppNotification[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notification_recipients")
    .select("id, read_at, notifications!inner(id, title, body, category, link, priority, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { referencedTable: "notifications", ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => {
    const n = Array.isArray(r.notifications) ? r.notifications[0] : r.notifications;
    return {
      id: r.id,
      category: n.category,
      title: n.title,
      body: n.body,
      href: n.link ?? undefined,
      createdAt: n.created_at,
      read: Boolean(r.read_at),
      channel: ["in_app"],
      priority: n.priority ?? "normal",
    } as AppNotification;
  });
}

export async function countUnread(): Promise<number> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return 0;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notification_recipients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  return count ?? 0;
}

export const NOTIFICATION_CATEGORY_META: Record<
  AppNotification["category"],
  { label: string; tone: string; icon: string }
> = {
  conta: { label: "Conta", tone: "badge-muted", icon: "user" },
  votacao: { label: "Votação", tone: "badge-gold", icon: "star" },
  pagamento: { label: "Pagamento", tone: "badge-green", icon: "wallet" },
  programa: { label: "Programa", tone: "badge-live", icon: "tv" },
  sistema: { label: "Sistema", tone: "badge-muted", icon: "shield" },
};
