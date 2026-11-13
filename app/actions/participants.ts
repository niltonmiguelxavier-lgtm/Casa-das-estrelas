"use server";

import { revalidatePath } from "next/cache";
import { can, requireAdmin } from "@/lib/services/session";
import { getServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/services/audit";
import type { AdminActionResult } from "@/app/actions/admin";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const STATUSES = ["activo", "nomeado", "eliminado", "vencedor"] as const;
const COUNTRIES = ["Moçambique", "Angola"] as const;

type ParticipantPayload = Record<string, unknown> & {
  number: number;
  name: string;
  country: string;
  age: number | null;
  city: string | null;
  occupation: string | null;
  tagline: string | null;
  bio: string | null;
  photo_url: string | null;
  status: string;
  is_published: boolean;
  talents: string[];
}

function parse(formData: FormData): {
  errors: Record<string, string>;
  payload: ParticipantPayload | null;
} {
  const errors: Record<string, string> = {};

  const number = num(formData, "number");
  const name = text(formData, "name");
  const country = text(formData, "country");
  const status = text(formData, "status") || "activo";

  if (number === null || number < 1 || number > 99)
    errors.number = "O número deve estar entre 1 e 99.";
  if (name.length < 2) errors.name = "Indique o nome do concorrente.";
  if (name.length > 80) errors.name = "O nome não pode exceder 80 caracteres.";
  if (!COUNTRIES.includes(country as (typeof COUNTRIES)[number]))
    errors.country = "Seleccione o país.";
  if (!STATUSES.includes(status as (typeof STATUSES)[number]))
    errors.status = "Estado inválido.";

  const age = num(formData, "age");
  if (age !== null && (age < 16 || age > 99))
    errors.age = "A idade deve estar entre 16 e 99.";

  const photo = text(formData, "photo");
  if (photo && !/^https?:\/\//.test(photo) && !photo.startsWith("/"))
    errors.photo = "A fotografia deve ser um URL (https://…) ou um caminho interno (/media/…).";

  const bio = text(formData, "bio");
  if (bio.length > 4000) errors.bio = "A biografia não pode exceder 4000 caracteres.";

  if (Object.keys(errors).length) return { errors, payload: null };

  return {
    errors,
    payload: {
      number: number as number,
      name,
      country,
      age,
      city: text(formData, "city") || null,
      occupation: text(formData, "occupation") || null,
      tagline: text(formData, "tagline") || null,
      bio: bio || null,
      photo_url: photo || null,
      status,
      is_published: formData.get("isPublished") === "on",
      talents: text(formData, "talents")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10),
    },
  };
}

/**
 * Cria ou actualiza um concorrente.
 * ---------------------------------------------------------------------------
 * - Autorização verificada no servidor (`concorrentes.gerir` + conta activa).
 * - Validação completa; números únicos; país restrito a Angola/Moçambique.
 * - Auditoria com os valores anteriores em caso de edição.
 * - Revalidação do site público para que a alteração apareça imediatamente.
 */
export async function saveParticipantAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const staff = await requireAdmin();
  if (!can(staff.role, "concorrentes.gerir"))
    return { ok: false, message: "Sem permissão para gerir concorrentes." };

  const id = text(formData, "id");
  const { errors, payload } = parse(formData);
  if (!payload) return { ok: false, message: "Verifique os campos assinalados.", fieldErrors: errors };

  const db = getServiceClient();
  if (!db)
    return { ok: false, message: "Ligação privilegiada indisponível. Nada foi guardado." };

  // Número único (a base de dados também tem a restrição, mas a mensagem é melhor aqui).
  const { data: existing } = await db
    .from("participants")
    .select("id,number")
    .eq("number", payload.number);
  const clash = (existing ?? []).find((r) => String(r.id) !== id);
  if (clash)
    return {
      ok: false,
      message: `Já existe um concorrente com o número ${payload.number}.`,
      fieldErrors: { number: "Número já utilizado." },
    };

  if (id) {
    const { data: before } = await db.from("participants").select("*").eq("id", id);
    const previous = (before ?? [])[0];

    const { error } = await db.from("participants").update(payload).eq("id", id);
    if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}.` };

    await recordAudit({
      action: "admin.participant.updated",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "participants",
      entityId: id,
      metadata: {
        antes: previous ? { name: previous.name, status: previous.status, publicado: previous.is_published } : null,
        depois: { name: payload.name, status: payload.status, publicado: payload.is_published },
      },
    });
  } else {
    const { data, error } = await db
      .from("participants")
      .insert({ ...payload, deleted_at: null });
    if (error) return { ok: false, message: `Não foi possível criar: ${error.message}.` };

    await recordAudit({
      action: "admin.participant.created",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "participants",
      entityId: String((data ?? [])[0]?.id ?? ""),
      metadata: { name: payload.name, number: payload.number, country: payload.country },
    });
  }

  revalidatePath("/admin/concorrentes");
  revalidatePath("/concorrentes");
  revalidatePath("/");
  if (id) revalidatePath(`/concorrentes/${id}`);

  return { ok: true, message: id ? "Concorrente actualizado." : "Concorrente criado." };
}

/**
 * Remove (soft delete) um concorrente.
 * A linha histórica é preservada — votos e ordens continuam íntegros — mas o
 * perfil deixa de ser público. Bloqueado se existirem votos registados.
 */
export async function deleteParticipantAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const staff = await requireAdmin();
  if (!can(staff.role, "concorrentes.gerir"))
    return { ok: false, message: "Sem permissão." };

  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Identificador inválido." };

  const db = getServiceClient();
  if (!db) return { ok: false, message: "Ligação privilegiada indisponível." };

  const { data: votes } = await db.from("votes").select("id").eq("participant_id", id).limit(1);
  if ((votes ?? []).length) {
    // Não apagamos nada que tenha votos: despublicamos e marcamos eliminado.
    const { error } = await db
      .from("participants")
      .update({ is_published: false, status: "eliminado" })
      .eq("id", id);
    if (error) return { ok: false, message: `Não foi possível despublicar: ${error.message}.` };
    await recordAudit({
      action: "admin.participant.updated",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "participants",
      entityId: id,
      metadata: { motivo: "remoção solicitada com votos registados — despublicado em vez de apagado" },
      severity: "aviso",
    });
    revalidatePath("/admin/concorrentes");
    revalidatePath("/concorrentes");
    revalidatePath("/");
    return {
      ok: true,
      message: "Este concorrente já tem votos registados: foi despublicado e marcado como eliminado.",
    };
  }

  const { error } = await db
    .from("participants")
    .update({ deleted_at: new Date().toISOString(), is_published: false })
    .eq("id", id);
  if (error) return { ok: false, message: `Não foi possível remover: ${error.message}.` };

  await recordAudit({
    action: "admin.participant.deleted",
    actorId: staff.id,
    actorEmail: staff.email,
    entity: "participants",
    entityId: id,
    severity: "aviso",
  });

  revalidatePath("/admin/concorrentes");
  revalidatePath("/concorrentes");
  revalidatePath("/");
  return { ok: true, message: "Concorrente removido." };
}
