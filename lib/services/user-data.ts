import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { demoParticipants } from "@/lib/demo-data";
import type { AppNotification, OrderRecord, VoteRecord } from "@/lib/types";

/** Dados do próprio utilizador. Todas as consultas dependem de RLS. */

const now = Date.now();
const iso = (h: number) => new Date(now - h * 3_600_000).toISOString();

const demoVotes: VoteRecord[] = [
  { id: "v-01", participantId: demoParticipants[10].id, participantName: demoParticipants[10].name, type: "gratuito", quantity: 3, createdAt: iso(2), campaign: "1.ª Gala" },
  { id: "v-02", participantId: demoParticipants[10].id, participantName: demoParticipants[10].name, type: "pago", quantity: 30, createdAt: iso(24), campaign: "1.ª Gala" },
  { id: "v-03", participantId: demoParticipants[0].id, participantName: demoParticipants[0].name, type: "gratuito", quantity: 2, createdAt: iso(27), campaign: "1.ª Gala" },
  { id: "v-04", participantId: demoParticipants[12].id, participantName: demoParticipants[12].name, type: "gratuito", quantity: 5, createdAt: iso(51), campaign: "1.ª Gala" },
  { id: "v-05", participantId: demoParticipants[10].id, participantName: demoParticipants[10].name, type: "pago", quantity: 80, createdAt: iso(96), campaign: "1.ª Gala" },
];

const demoOrders: OrderRecord[] = [
  { id: "o-01", reference: "CDE-2026-8F3K2A", packageName: "Pacote Constelação", votes: 30, amount: 130, currency: "MZN", method: "M-Pesa", status: "confirmado", createdAt: iso(24), paidAt: iso(24) },
  { id: "o-02", reference: "CDE-2026-P7M4QD", packageName: "Pacote Galáxia", votes: 80, amount: 300, currency: "MZN", method: "e-Mola", status: "confirmado", createdAt: iso(96), paidAt: iso(95) },
  { id: "o-03", reference: "CDE-2026-T2X9LB", packageName: "Pacote Estrela", votes: 10, amount: 50, currency: "MZN", method: "M-Pesa", status: "expirado", createdAt: iso(140) },
  { id: "o-04", reference: "CDE-2026-K5R8NC", packageName: "Pacote Supernova", votes: 200, amount: 700, currency: "MZN", method: "Visa", status: "pendente", createdAt: iso(1) },
];

export async function getUserVotes(limit = 50): Promise<VoteRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return demoVotes.slice(0, limit);

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
  if (!supabase) return demoOrders.slice(0, limit);

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
  if (!supabase)
    return [
      { id: "s1", event: "Início de sessão", device: "Chrome · macOS", location: "Maputo, MZ", at: iso(2) },
      { id: "s2", event: "Palavra-passe alterada", device: "Chrome · macOS", location: "Maputo, MZ", at: iso(240) },
      { id: "s3", event: "Conta criada", device: "Chrome · macOS", location: "Maputo, MZ", at: iso(960) },
    ];

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
