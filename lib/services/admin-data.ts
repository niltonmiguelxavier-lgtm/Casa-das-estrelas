import "server-only";
import { getServiceClient } from "@/lib/supabase/service";
import type { Participant } from "@/lib/types";

/**
 * Leituras administrativas.
 * ---------------------------------------------------------------------------
 * Só devem ser chamadas depois de `requireAdmin()` + verificação de permissão.
 * Usam o cliente privilegiado para ver registos não publicados (rascunhos,
 * perfis em preparação) que a RLS pública não expõe.
 */

export async function listAllParticipantsForAdmin(): Promise<Participant[]> {
  const db = getServiceClient();
  if (!db) return [];

  const { data } = await db
    .from("participants")
    .select(
      "id,number,name,age,country,city,tagline,bio,occupation,talents,photo_url,status,is_published",
    )
    .is("deleted_at", null)
    .order("number", { ascending: true });

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    number: Number(r.number),
    name: String(r.name),
    age: r.age === null ? null : Number(r.age),
    country: String(r.country) as Participant["country"],
    city: (r.city as string) ?? null,
    tagline: (r.tagline as string) ?? "",
    bio: (r.bio as string) ?? "",
    occupation: (r.occupation as string) ?? null,
    talents: ((r.talents as string[]) ?? []).filter(Boolean),
    photo: (r.photo_url as string) ?? null,
    gallery: [],
    status: r.status as Participant["status"],
    totalVotes: 0,
    freeVotes: 0,
    paidVotes: 0,
    previousPosition: null,
    isPublished: Boolean(r.is_published),
  }));
}

export interface AdminNewsRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover: string | null;
  status: "rascunho" | "agendado" | "publicado" | "arquivado";
  publishedAt: string | null;
  updatedAt: string;
}

export async function listAllNewsForAdmin(limit = 60): Promise<AdminNewsRow[]> {
  const db = getServiceClient();
  if (!db) return [];

  const { data } = await db
    .from("news")
    .select("id,slug,title,excerpt,category,cover_url,status,published_at,updated_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    excerpt: (r.excerpt as string) ?? "",
    category: String(r.category ?? "Programa"),
    cover: (r.cover_url as string) ?? null,
    status: (r.status as AdminNewsRow["status"]) ?? "rascunho",
    publishedAt: (r.published_at as string) ?? null,
    updatedAt: String(r.updated_at),
  }));
}

export interface AdminGalleryRow {
  id: string;
  type: "foto" | "video";
  title: string;
  url: string;
  poster: string | null;
  caption: string | null;
  event: string | null;
  isPublished: boolean;
  createdAt: string;
}

export async function listAllGalleryForAdmin(limit = 80): Promise<AdminGalleryRow[]> {
  const db = getServiceClient();
  if (!db) return [];

  const { data } = await db
    .from("gallery")
    .select("id,type,title,url,poster_url,caption,event,is_published,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    type: (r.type as "foto" | "video") ?? "foto",
    title: String(r.title),
    url: String(r.url),
    poster: (r.poster_url as string) ?? null,
    caption: (r.caption as string) ?? null,
    event: (r.event as string) ?? null,
    isPublished: Boolean(r.is_published),
    createdAt: String(r.created_at),
  }));
}
