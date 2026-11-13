"use server";

import { revalidatePath } from "next/cache";
import { can, requireAdmin } from "@/lib/services/session";
import { getServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/services/audit";
import { slugify } from "@/lib/utils";
import type { AdminActionResult } from "@/app/actions/admin";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const CATEGORIES = ["Comunicado", "Programa", "Eliminação", "Anúncio", "Imprensa"];
const NEWS_STATUS = ["rascunho", "agendado", "publicado", "arquivado"] as const;

/** Cria ou actualiza uma notícia. Publicar exige conteúdo mínimo válido. */
export async function saveNewsAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const staff = await requireAdmin();
  if (!can(staff.role, "conteudos.noticias"))
    return { ok: false, message: "Sem permissão para gerir conteúdos." };

  const id = text(formData, "id");
  const title = text(formData, "title");
  const excerpt = text(formData, "excerpt");
  const body = text(formData, "body");
  const category = text(formData, "category") || "Programa";
  const cover = text(formData, "cover");
  const status = (text(formData, "status") || "rascunho") as (typeof NEWS_STATUS)[number];
  const slugInput = text(formData, "slug");

  const fieldErrors: Record<string, string> = {};
  if (title.length < 5) fieldErrors.title = "O título deve ter pelo menos 5 caracteres.";
  if (title.length > 160) fieldErrors.title = "O título não pode exceder 160 caracteres.";
  if (!CATEGORIES.includes(category)) fieldErrors.category = "Categoria inválida.";
  if (!NEWS_STATUS.includes(status)) fieldErrors.status = "Estado inválido.";
  if (status === "publicado") {
    if (excerpt.length < 20)
      fieldErrors.excerpt = "Para publicar, o resumo deve ter pelo menos 20 caracteres.";
    if (body.length < 50)
      fieldErrors.body = "Para publicar, o corpo da notícia deve ter pelo menos 50 caracteres.";
  }
  if (cover && !/^https?:\/\//.test(cover) && !cover.startsWith("/"))
    fieldErrors.cover = "A imagem deve ser um URL (https://…) ou um caminho interno (/media/…).";

  if (Object.keys(fieldErrors).length)
    return { ok: false, message: "Verifique os campos assinalados.", fieldErrors };

  const db = getServiceClient();
  if (!db) return { ok: false, message: "Ligação privilegiada indisponível. Nada foi guardado." };

  const slug = slugify(slugInput || title);
  if (!slug) return { ok: false, message: "Não foi possível gerar um endereço válido." };

  // Slug único
  const { data: clash } = await db.from("news").select("id").eq("slug", slug);
  if ((clash ?? []).some((r) => String(r.id) !== id))
    return {
      ok: false,
      message: `Já existe uma publicação com o endereço /noticias/${slug}.`,
      fieldErrors: { slug: "Endereço já utilizado." },
    };

  const payload = {
    slug,
    title,
    excerpt: excerpt || null,
    body: body || null,
    category,
    cover_url: cover || null,
    status,
    author: staff.fullName,
    published_at:
      status === "publicado" ? new Date().toISOString() : null,
  };

  if (id) {
    const { error } = await db.from("news").update(payload).eq("id", id);
    if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}.` };
    await recordAudit({
      action: "admin.news.saved",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "news",
      entityId: id,
      metadata: { title, status, slug },
    });
  } else {
    const { data, error } = await db.from("news").insert(payload);
    if (error) return { ok: false, message: `Não foi possível criar: ${error.message}.` };
    await recordAudit({
      action: "admin.news.saved",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "news",
      entityId: String((data ?? [])[0]?.id ?? ""),
      metadata: { title, status, slug, novo: true },
    });
  }

  revalidatePath("/admin/conteudos");
  revalidatePath("/noticias");
  revalidatePath(`/noticias/${slug}`);
  revalidatePath("/");

  return {
    ok: true,
    message:
      status === "publicado"
        ? "Notícia publicada e já visível no site."
        : `Publicação guardada como ${status}.`,
  };
}

/** Remove (soft delete) uma notícia. */
export async function deleteNewsAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const staff = await requireAdmin();
  if (!can(staff.role, "conteudos.noticias")) return { ok: false, message: "Sem permissão." };

  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Identificador inválido." };

  const db = getServiceClient();
  if (!db) return { ok: false, message: "Ligação privilegiada indisponível." };

  const { error } = await db
    .from("news")
    .update({ deleted_at: new Date().toISOString(), status: "arquivado" })
    .eq("id", id);
  if (error) return { ok: false, message: `Não foi possível remover: ${error.message}.` };

  await recordAudit({
    action: "admin.news.deleted",
    actorId: staff.id,
    actorEmail: staff.email,
    entity: "news",
    entityId: id,
    severity: "aviso",
  });

  revalidatePath("/admin/conteudos");
  revalidatePath("/noticias");
  revalidatePath("/");
  return { ok: true, message: "Publicação removida do site." };
}

/** Cria ou actualiza um item de galeria (fotografia ou vídeo). */
export async function saveGalleryAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const staff = await requireAdmin();
  if (!can(staff.role, "conteudos.galeria"))
    return { ok: false, message: "Sem permissão para gerir a galeria." };

  const id = text(formData, "id");
  const type = text(formData, "type") === "video" ? "video" : "foto";
  const title = text(formData, "title");
  const url = text(formData, "url");
  const poster = text(formData, "poster");
  const event = text(formData, "event");
  const caption = text(formData, "caption");
  const isPublished = formData.get("isPublished") === "on";

  const fieldErrors: Record<string, string> = {};
  if (title.length < 3) fieldErrors.title = "Indique um título.";
  if (!url) fieldErrors.url = "Indique o endereço do ficheiro.";
  if (url && !/^https?:\/\//.test(url) && !url.startsWith("/"))
    fieldErrors.url = "O endereço deve ser https://… ou /media/…";
  if (type === "video" && poster && !/^https?:\/\//.test(poster) && !poster.startsWith("/"))
    fieldErrors.poster = "Endereço da miniatura inválido.";

  if (Object.keys(fieldErrors).length)
    return { ok: false, message: "Verifique os campos assinalados.", fieldErrors };

  const db = getServiceClient();
  if (!db) return { ok: false, message: "Ligação privilegiada indisponível. Nada foi guardado." };

  const payload = {
    type,
    title,
    url,
    poster_url: type === "video" ? poster || null : null,
    event: event || null,
    caption: caption || null,
    is_published: isPublished,
  };

  if (id) {
    const { error } = await db.from("gallery").update(payload).eq("id", id);
    if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}.` };
  } else {
    const { error } = await db.from("gallery").insert(payload);
    if (error) return { ok: false, message: `Não foi possível criar: ${error.message}.` };
  }

  await recordAudit({
    action: "admin.gallery.saved",
    actorId: staff.id,
    actorEmail: staff.email,
    entity: "gallery",
    entityId: id || null,
    metadata: { type, title, publicado: isPublished },
  });

  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
  revalidatePath("/");

  return {
    ok: true,
    message: isPublished
      ? `${type === "video" ? "Vídeo" : "Fotografia"} guardado e publicado.`
      : `${type === "video" ? "Vídeo" : "Fotografia"} guardado (não publicado).`,
  };
}

/** Remove um item da galeria. */
export async function deleteGalleryAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const staff = await requireAdmin();
  if (!can(staff.role, "conteudos.galeria")) return { ok: false, message: "Sem permissão." };

  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Identificador inválido." };

  const db = getServiceClient();
  if (!db) return { ok: false, message: "Ligação privilegiada indisponível." };

  const { error } = await db.from("gallery").update({ is_published: false }).eq("id", id);
  if (error) return { ok: false, message: `Não foi possível remover: ${error.message}.` };

  await recordAudit({
    action: "admin.gallery.deleted",
    actorId: staff.id,
    actorEmail: staff.email,
    entity: "gallery",
    entityId: id,
    severity: "aviso",
  });

  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
  revalidatePath("/");
  return { ok: true, message: "Item retirado da galeria pública." };
}
