import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

/**
 * Sessão do utilizador.
 * ---------------------------------------------------------------------------
 * Não existe sessão de demonstração. Sem Supabase Auth configurado, não há
 * utilizador autenticado: as áreas privadas redireccionam para o início de
 * sessão e o painel administrativo fica inacessível. Isto garante que nenhuma
 * conta fictícia alguma vez recebe permissões — nem em desenvolvimento.
 */

/** Sessão actual, ou `null` quando não há utilizador autenticado. */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*, user_profiles(*)")
    .eq("id", user.id)
    .maybeSingle();

  const meta = (user.user_metadata ?? {}) as { full_name?: string };
  const profileRow = Array.isArray(profile?.user_profiles)
    ? profile?.user_profiles[0]
    : profile?.user_profiles;

  return {
    id: user.id,
    fullName:
      profileRow?.full_name ?? meta.full_name ?? user.email?.split("@")[0] ?? "Utilizador",
    email: user.email ?? "",
    phone: profileRow?.phone ?? "",
    country: profileRow?.country ?? "Moçambique",
    role: (profile?.role as UserProfile["role"]) ?? "utilizador",
    emailVerified: Boolean(user.email_confirmed_at),
    phoneVerified: Boolean(user.phone_confirmed_at),
    status: profile?.status ?? "pendente",
    createdAt: user.created_at,
    avatarColor: "#f2b62b",
  };
}

export async function requireUser(next = "/painel"): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}&motivo=autenticacao-necessaria`);
  // Contas suspensas/eliminadas não acedem a nenhuma área privada, mesmo com
  // um cookie de sessão emitido antes da suspensão.
  if (user.status !== "activa") {
    redirect("/acesso-negado?motivo=conta-inactiva");
  }
  return user;
}

const ADMIN_ROLES: UserProfile["role"][] = [
  "superadministrador",
  "administrador",
  "gestor_conteudos",
  "operador_financeiro",
];

/**
 * Exige uma conta com papel administrativo. Verificado no servidor, a cada
 * pedido. `requireUser` já força autenticação; aqui valida-se o papel e o
 * estado da conta. Contas suspensas perdem o acesso imediatamente.
 */
export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireUser("/admin");
  if (!ADMIN_ROLES.includes(user.role) || user.status !== "activa") {
    redirect("/acesso-negado");
  }
  return user;
}

/** Matriz de permissões verificada no servidor (nunca só na interface). */
export const ROLE_PERMISSIONS: Record<UserProfile["role"], string[]> = {
  utilizador: ["perfil.proprio", "voto.gratuito", "voto.pago", "notificacoes.proprias"],
  gestor_conteudos: [
    "perfil.proprio",
    "conteudos.noticias",
    "conteudos.galeria",
    "conteudos.paginas",
    "notificacoes.proprias",
  ],
  operador_financeiro: [
    "perfil.proprio",
    "financeiro.consultar",
    "financeiro.reconciliar",
    "financeiro.reembolsos",
    "relatorios.exportar",
    "notificacoes.proprias",
  ],
  administrador: [
    "perfil.proprio",
    "conteudos.noticias",
    "conteudos.galeria",
    "conteudos.paginas",
    "concorrentes.gerir",
    "votacoes.gerir",
    "notificacoes.gerir",
    "utilizadores.consultar",
    "financeiro.consultar",
    "relatorios.exportar",
  ],
  superadministrador: ["*"],
};

export function can(role: UserProfile["role"], permission: string) {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}
