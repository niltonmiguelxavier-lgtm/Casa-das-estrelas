"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { freeVoteSchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveCampaign, getParticipant } from "@/lib/services/data";
import { clientKey, rateLimit } from "@/lib/services/rate-limit";
import { recordAudit } from "@/lib/services/audit";
import { getCurrentUser } from "@/lib/services/session";

export interface VoteState {
  ok: boolean;
  message?: string;
  remaining?: number;
  demo?: boolean;
}

/**
 * VOTO GRATUITO — validado integralmente no servidor.
 *
 * Passos (ver supabase/migrations/0004_vote_functions.sql → fn_cast_free_vote):
 *  1. Utilizador autenticado (sessão Supabase).
 *  2. Campanha activa e dentro da janela temporal.
 *  3. Concorrente participante da campanha.
 *  4. Limite por utilizador/frequência (tabela vote_limits, com lock).
 *  5. Inserção do voto em transacção atómica + evento para a fila.
 * O frontend nunca envia nem altera o total de votos.
 */
export async function castFreeVoteAction(
  _prev: VoteState | undefined,
  formData: FormData,
): Promise<VoteState> {
  const h = await headers();
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "É necessário iniciar sessão para votar." };
  }

  const limit = rateLimit(clientKey(h, "vote-free"), { limit: 12, windowMs: 60_000, blockMs: 120_000 });
  if (!limit.success)
    return { ok: false, message: "Está a votar demasiado depressa. Aguarde alguns segundos." };

  const parsed = freeVoteSchema.safeParse({
    participantId: String(formData.get("participantId") ?? ""),
    campaignId: String(formData.get("campaignId") ?? ""),
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return { ok: false, message: "Pedido de voto inválido." };

  const campaign = await getActiveCampaign();
  if (!campaign || campaign.status !== "activa")
    return { ok: false, message: "Não existe campanha de votação activa neste momento." };

  const now = Date.now();
  if (now < new Date(campaign.startsAt).getTime() || now > new Date(campaign.endsAt).getTime())
    return { ok: false, message: "A campanha de votação não está aberta." };

  const participant = await getParticipant(parsed.data.participantId);
  if (!participant) return { ok: false, message: "Concorrente não encontrado." };
  if (campaign.participantsIds.length && !campaign.participantsIds.includes(participant.id))
    return { ok: false, message: "Este concorrente não participa na campanha activa." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Serviço de votação indisponível. Tente novamente mais tarde." };
  }

  // Transacção atómica: verifica limite, insere voto, actualiza agregados,
  // enfileira evento de notificação. Devolve o saldo restante.
  const { data, error } = await supabase.rpc("fn_cast_free_vote", {
    p_user_id: user.id,
    p_campaign_id: campaign.id,
    p_participant_id: participant.id,
    p_quantity: parsed.data.quantity,
  });

  if (error) {
    const message =
      error.message.includes("LIMIT_EXCEEDED")
        ? "Já utilizou todos os votos gratuitos deste período."
        : "Não foi possível registar o voto. Tente novamente.";
    return { ok: false, message };
  }

  await recordAudit({
    action: "vote.free",
    actorId: user.id,
    actorEmail: user.email,
    entity: "participants",
    entityId: participant.id,
    ip: h.get("x-forwarded-for"),
    metadata: { campaign: campaign.id, quantity: parsed.data.quantity },
  });

  revalidatePath("/classificacao");
  revalidatePath(`/concorrentes/${participant.id}`);

  const remaining = Number((data as { remaining?: number } | null)?.remaining ?? 0);
  return {
    ok: true,
    remaining,
    message: `Voto registado para ${participant.name}. ${
      remaining > 0 ? `Ainda tem ${remaining} voto(s) gratuitos hoje.` : "Já usou os votos gratuitos de hoje."
    }`,
  };
}
