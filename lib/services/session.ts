import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

/**
 * Modo de demonstração (sem Supabase): a conta de exemplo assume o papel de
 * superadministrador para que o painel possa ser avaliado. A interface marca
 * sempre esta origem — não é um utilizador real nem representa permissões reais.
 */
const DEMO_ROLE: UserProfile["role"] =
  (process.env.DEMO_ROLE as UserProfile["role"]) ?? "superadministrador";

export const DEMO_USER: UserProfile = {
  id: "demo-user-0001",
  fullName: "Utilizador de Demonstração",
  email: "utilizador@exemplo.mz",
  phone: "+258 84 123 4567",
  country: "Moçambique",
  role: "utilizador", // substituído por DEMO_ROLE em getCurrentUser
  emailVerified: true,
  phoneVerified: false,
  status: "activa",
  createdAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
  avatarColor: "#f2b62b",
};

export const isDemoSession = () => !process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Sessão actual. Em modo demonstração devolve uma conta de exemplo marcada como tal. */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ...DEMO_USER, role: DEMO_ROLE };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*, user_profiles(*)")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    fullName: profile?.user_profiles?.[0]?.full_name ?? profile?.full_name ?? user.email ?? "Utilizador",
    email: user.email ?? "",
    phone: profile?.user_profiles?.[0]?.phone ?? "",
    country: profile?.user_profiles?.[0]?.country ?? "Moçambique",
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
  return user;
}

const ADMIN_ROLES: UserProfile["role"][] = [
  "superadministrador",
  "administrador",
  "gestor_conteudos",
  "operador_financeiro",
];

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireUser("/admin");
  if (!ADMIN_ROLES.includes(user.role)) redirect("/entrar?motivo=acesso-restrito");
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
