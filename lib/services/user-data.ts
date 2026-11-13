import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppNotification, OrderRecord, VoteRecord } from "@/lib/types";

/** Dados do próprio utilizador. Todas as consultas dependem de RLS. */


export async function getUserVotes(limit = 50): Promise<VoteRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("votes")
    .select("id, participant_id, vote_type, quantity, created_at, voting_campaigns(name), participants(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((v) => {
    const campaign = Array.isArray(v.voting_campaigns) ? v.voting_campaigns[0] : v.voting_campaigns;
    const participant = Array.isArray(v.participants) ? v.participants[0] : v.participants;
    return {
      id: v.id,
      participantId: v.participant_id,
      participantName: participant?.name ?? "—",
      type: v.vote_type,
      quantity: v.quantity,
      createdAt: v.created_at,
      campaign: campaign?.name ?? "—",
    } as VoteRecord;
  });
}

export async function getUserOrders(limit = 50): Promise<OrderRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("payment_orders")
    .select("id, reference, votes, amount, currency, provider, status, created_at, paid_at, vote_packages(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((o) => {
    const pkg = Array.isArray(o.vote_packages) ? o.vote_packages[0] : o.vote_packages;
    return {
      id: o.id,
      reference: o.reference,
      packageName: pkg?.name ?? "Pacote",
      votes: o.votes,
      amount: Number(o.amount),
      currency: o.currency,
      method: o.provider,
      status: o.status,
      createdAt: o.created_at,
      paidAt: o.paid_at ?? undefined,
    } as OrderRecord;
  });
}

/** Saldo de votos disponíveis (gratuitos do período + pagos não utilizados). */
export async function getVoteBalance(): Promise<{ free: number; paid: number; freeLimit: number }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { free: 2, paid: 110, freeLimit: 5 };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { free: 0, paid: 0, freeLimit: 0 };

  const { data } = await supabase.rpc("fn_user_vote_balance", { p_user_id: user.id });
  const row = Array.isArray(data) ? data[0] : data;
  return {
    free: Number(row?.free_remaining ?? 0),
    paid: Number(row?.paid_remaining ?? 0),
    freeLimit: Number(row?.free_limit ?? 0),
  };
}

export async function getSecurityActivity(limit = 10) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("login_activity")
    .select("id, event, device, location, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id,
    event: r.event,
    device: r.device ?? "—",
    location: r.location ?? "—",
    at: r.created_at,
  }));
}

export type { AppNotification };
