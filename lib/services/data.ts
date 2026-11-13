import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de leitura pública. Usa a sessão do utilizador quando existe (para que
 * views filtradas por RLS, como `ranking_current`, devolvam também a linha
 * própria) e recorre ao cliente anónimo quando não há sessão. Sem service role.
 */
async function getReader() {
  const supa = await getSupabaseServerClient();
  if (supa) return supa;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}
import type {
  GalleryItem,
  NewsPost,
  Participant,
  RankingRow,
  VotePackage,
  VotingCampaign,
} from "@/lib/types";

/**
 * Camada de acesso a dados.
 * ---------------------------------------------------------------
 * Fonte única de verdade: PostgreSQL (Supabase).
 *
 * REGRA: não existe conjunto de dados de demonstração no caminho público.
 * Sem base de dados configurada, as funções devolvem colecções vazias e a
 * interface apresenta um estado vazio honesto. Nunca são inventados
 * concorrentes, notícias, votos ou patrocinadores.
 * ---------------------------------------------------------------
 */

/** Ligação ao PostgreSQL configurada (leitura pública + RLS). */
export function isDatabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Chave secreta presente. Só operações administrativas que precisam de
 * contornar a RLS (painel admin, contadores globais) dependem dela.
 */
export function isAdminKeyConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Existe um caminho privilegiado de servidor: a chave secreta da Supabase ou a
 * ligação directa ao PostgreSQL (`DATABASE_URL`). Sem nenhum dos dois, as
 * operações administrativas ficam indisponíveis — nunca simuladas.
 */
export function isServiceConfigured() {
  return isAdminKeyConfigured() || Boolean(process.env.DATABASE_URL);
}

export async function listParticipants(opts?: { country?: string }): Promise<Participant[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  let q = supabase
    .from("participants")
    .select(
      "id,number,name,age,country,city,tagline,bio,occupation,talents,photo_url,status,is_published",
    )
    .eq("is_published", true)
    .order("number");
  if (opts?.country) q = q.eq("country", opts.country);
  const { data, error } = await q;
  if (error || !data) return [];

  const totals = await getVoteTotals();
  return data.map((r) => ({
    id: r.id,
    number: r.number,
    name: r.name,
    age: r.age,
    country: r.country,
    city: r.city,
    tagline: r.tagline ?? "",
    bio: r.bio ?? "",
    occupation: r.occupation,
    talents: r.talents ?? [],
    photo: r.photo_url,
    gallery: [],
    status: r.status,
    totalVotes: totals[r.id]?.total ?? 0,
    freeVotes: totals[r.id]?.free ?? 0,
    paidVotes: totals[r.id]?.paid ?? 0,
    previousPosition: null,
    isPublished: r.is_published,
  }));
}

export async function getParticipant(id: string): Promise<Participant | null> {
  const supabase = await getReader();
  if (!supabase) return null;
  const { data } = await supabase.from("participants").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const totals = await getVoteTotals();
  const { data: media } = await supabase
    .from("participant_media")
    .select("url")
    .eq("participant_id", id)
    .order("sort_order");
  return {
    id: data.id,
    number: data.number,
    name: data.name,
    age: data.age,
    country: data.country,
    city: data.city,
    tagline: data.tagline ?? "",
    bio: data.bio ?? "",
    occupation: data.occupation,
    talents: data.talents ?? [],
    photo: data.photo_url,
    gallery: (media ?? []).map((m) => m.url),
    status: data.status,
    totalVotes: totals[id]?.total ?? 0,
    freeVotes: totals[id]?.free ?? 0,
    paidVotes: totals[id]?.paid ?? 0,
    previousPosition: null,
    isPublished: data.is_published,
  };
}

/** Totais agregados — em produção lidos da vista materializada `participant_vote_totals`. */
async function getVoteTotals(): Promise<
  Record<string, { total: number; free: number; paid: number }>
> {
  const reader = await getReader();
  if (!reader) return {};
  const { data } = await reader.from("participant_vote_totals").select("*");
  const out: Record<string, { total: number; free: number; paid: number }> = {};
  for (const row of data ?? []) {
    out[row.participant_id] = {
      total: Number(row.total_votes ?? 0),
      free: Number(row.free_votes ?? 0),
      paid: Number(row.paid_votes ?? 0),
    };
  }
  return out;
}

export async function getRanking(): Promise<RankingRow[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data } = await supabase
    .from("ranking_current")
    .select("position,participant_id,name,number,country,photo_url,votes,variation")
    .order("position");
  return (data ?? []).map((r) => ({
    position: r.position,
    participantId: r.participant_id,
    name: r.name,
    number: r.number,
    country: r.country,
    photo: r.photo_url,
    votes: Number(r.votes ?? 0),
    variation: Number(r.variation ?? 0),
  }));
}

export async function listNews(limit = 24) {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data } = await supabase
    .from("news")
    .select("id,slug,title,excerpt,body,category,cover_url,published_at,author,featured,pinned")
    .eq("status", "publicado")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(
    (r): NewsPost => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt ?? "",
      body: r.body ?? "",
      category: r.category ?? "Programa",
      cover: r.cover_url ?? "/media/spotlights.jpg",
      publishedAt: r.published_at,
      author: r.author ?? "Produção",
      featured: Boolean(r.featured),
      pinned: Boolean(r.pinned),
    }),
  );
}

export async function getNewsPost(slug: string) {
  const all = await listNews(100);
  return all.find((n) => n.slug === slug) ?? null;
}

export async function listGallery(): Promise<GalleryItem[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data } = await supabase
    .from("gallery")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    src: r.url,
    poster: r.poster_url ?? undefined,
    caption: r.caption ?? "",
    event: r.event ?? "Programa",
    createdAt: r.created_at,
  }));
}

export async function listPackages(): Promise<VotePackage[]> {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data } = await supabase
    .from("vote_packages")
    .select("*")
    .eq("is_active", true)
    .order("price");
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    votes: r.votes,
    price: Number(r.price),
    currency: r.currency,
    bonusLabel: r.bonus_label ?? undefined,
    bestValue: Boolean(r.best_value),
    active: r.is_active,
    validUntil: r.valid_until ?? undefined,
  }));
}

export async function getActiveCampaign(): Promise<VotingCampaign | null> {
  const supabase = await getReader();
  if (!supabase) return null;
  const { data } = await supabase
    .from("voting_campaigns")
    .select("*, voting_rules(*)")
    .eq("status", "activa")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const rule = Array.isArray(data.voting_rules) ? data.voting_rules[0] : data.voting_rules;
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    freeVotesPerUser: rule?.free_votes_per_user ?? 1,
    frequency: rule?.frequency ?? "diaria",
    participantsIds: data.participant_ids ?? [],
    rules: rule?.rules_text ?? [],
    updatedAt: data.updated_at,
  };
}

export async function listSponsors() {
  const supabase = await getReader();
  if (!supabase) return [];
  const { data } = await supabase
    .from("sponsors")
    .select("name,tier,logo_url,website")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((s) => ({ name: s.name, tier: s.tier }));
}

export interface PlatformStats {
  registeredUsers: number;
  newUsers24h: number;
  activeUsers24h: number;
  activeAccounts: number;
  participants: number;
  publishedParticipants: number;
  freeVotes: number;
  paidVotes: number;
  totalVotes: number;
  revenue: number;
  confirmedPayments: number;
  pendingPayments: number;
  pendingAmount: number;
  expiredOrders: number;
}

const EMPTY_STATS: PlatformStats = {
  registeredUsers: 0,
  newUsers24h: 0,
  activeUsers24h: 0,
  activeAccounts: 0,
  participants: 0,
  publishedParticipants: 0,
  freeVotes: 0,
  paidVotes: 0,
  totalVotes: 0,
  revenue: 0,
  confirmedPayments: 0,
  pendingPayments: 0,
  pendingAmount: 0,
  expiredOrders: 0,
};

/**
 * KPIs do painel. Agregação feita na base de dados (`fn_admin_stats`), não em
 * memória, para escalar com milhões de votos. Sem dados devolve zeros — nunca
 * números de demonstração.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const admin = getServiceClient();
  if (!admin) return EMPTY_STATS;

  const { data, error } = await admin.rpc("fn_admin_stats", {});
  if (error || !data) return EMPTY_STATS;

  const raw = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  const num = (key: keyof PlatformStats) => Number(raw?.[key] ?? 0);
  return {
    registeredUsers: num("registeredUsers"),
    newUsers24h: num("newUsers24h"),
    activeUsers24h: num("activeUsers24h"),
    activeAccounts: num("activeAccounts"),
    participants: num("participants"),
    publishedParticipants: num("publishedParticipants"),
    freeVotes: num("freeVotes"),
    paidVotes: num("paidVotes"),
    totalVotes: num("totalVotes"),
    revenue: num("revenue"),
    confirmedPayments: num("confirmedPayments"),
    pendingPayments: num("pendingPayments"),
    pendingAmount: num("pendingAmount"),
    expiredOrders: num("expiredOrders"),
  };
}
