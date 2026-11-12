import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/lib/types";

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();

export const demoNotifications: AppNotification[] = [
  {
    id: "ntf-01", category: "votacao", title: "5 votos gratuitos disponíveis hoje",
    body: "A campanha «1.ª Gala — Votação do público» está activa. Já pode usar os seus votos gratuitos.",
    href: "/votar", createdAt: ago(12), read: false, channel: ["in_app", "email"], priority: "normal",
  },
  {
    id: "ntf-02", category: "programa", title: "Nova notícia publicada",
    body: "«Casa das Estrelas abre portas ao público» — comunicado oficial da produção.",
    href: "/noticias/casa-das-estrelas-abre-portas-ao-publico", createdAt: ago(180), read: false,
    channel: ["in_app"], priority: "normal",
  },
  {
    id: "ntf-03", category: "pagamento", title: "Pagamento confirmado",
    body: "O seu pacote de 30 votos foi creditado após confirmação do fornecedor.",
    href: "/painel/pagamentos", createdAt: ago(1_460), read: false, channel: ["in_app", "email"],
    priority: "alta",
  },
  {
    id: "ntf-04", category: "votacao", title: "Votos pagos adicionados à conta",
    body: "Foram adicionados 30 votos ao seu saldo. Obrigado por apoiar o seu concorrente.",
    href: "/painel/votos", createdAt: ago(1_465), read: true, channel: ["in_app"], priority: "normal",
  },
  {
    id: "ntf-05", category: "conta", title: "Novo acesso à sua conta",
    body: "Registámos um novo início de sessão a partir de Maputo, Moçambique. Se não foi você, altere a palavra-passe.",
    href: "/painel/seguranca", createdAt: ago(2_880), read: true, channel: ["in_app", "email"],
    priority: "alta",
  },
  {
    id: "ntf-06", category: "sistema", title: "Actualização dos termos e condições",
    body: "Revimos os termos e condições da plataforma. As alterações entram em vigor em 30 dias.",
    href: "/termos", createdAt: ago(4_320), read: true, channel: ["in_app", "email"], priority: "normal",
  },
  {
    id: "ntf-07", category: "votacao", title: "Campanha próxima do encerramento",
    body: "A votação da 1.ª Gala encerra em menos de 5 dias. Apoie o seu concorrente.",
    href: "/votar", createdAt: ago(5_760), read: true, channel: ["in_app"], priority: "normal",
  },
];

export async function listNotifications(limit = 50): Promise<AppNotification[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return demoNotifications.slice(0, limit);

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
  if (!supabase) return demoNotifications.filter((n) => !n.read).length;
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
