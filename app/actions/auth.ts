"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  forgotPasswordSchema,
  loginSchema,
  passwordResetSchema,
  registerSchema,
} from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/services/rate-limit";
import { recordAudit } from "@/lib/services/audit";

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** true quando a operação foi simulada por não existir base de dados configurada. */
  demo?: boolean;
}

function flatten(error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export async function registerAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const h = await headers();
  const limit = rateLimit(clientKey(h, "register"), { limit: 5, windowMs: 600_000, blockMs: 900_000 });
  if (!limit.success)
    return {
      ok: false,
      message: `Demasiadas tentativas. Tente novamente em ${limit.retryAfterSeconds}s.`,
    };

  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    country: String(formData.get("country") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    acceptTerms: formData.get("acceptTerms") === "on",
    acceptPrivacy: formData.get("acceptPrivacy") === "on",
    acceptMarketing: formData.get("acceptMarketing") === "on",
    website: String(formData.get("website") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Verifique os dados introduzidos.", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    await recordAudit({
      action: "auth.register",
      actorEmail: parsed.data.email,
      ip: h.get("x-forwarded-for"),
      metadata: { demo: true, country: parsed.data.country },
    });
    return {
      ok: false,
      message: "O registo está temporariamente indisponível. Tente novamente mais tarde.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone, country: parsed.data.country },
    },
  });

  if (error) {
    await recordAudit({
      action: "auth.register",
      actorEmail: parsed.data.email,
      severity: "aviso",
      metadata: { error: error.message },
    });
    if (error.message.toLowerCase().includes("already"))
      return { ok: false, message: "Já existe uma conta com este email. Experimente iniciar sessão." };
    return { ok: false, message: "Não foi possível criar a conta. Tente novamente." };
  }

  // Perfil complementar (RLS: apenas o próprio utilizador)
  if (data.user) {
    await supabase.from("user_profiles").upsert({
      user_id: data.user.id,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      country: parsed.data.country,
      accepted_terms_at: new Date().toISOString(),
      accepted_privacy_at: new Date().toISOString(),
      marketing_opt_in: parsed.data.acceptMarketing ?? false,
    });
  }

  await recordAudit({
    action: "auth.register",
    actorId: data.user?.id,
    actorEmail: parsed.data.email,
    metadata: { country: parsed.data.country },
  });

  return {
    ok: true,
    message:
      "Conta criada. Verifique o seu email para confirmar o endereço antes de votar.",
  };
}

export async function loginAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const h = await headers();
  const limit = rateLimit(clientKey(h, "login"), { limit: 8, windowMs: 300_000, blockMs: 900_000 });
  if (!limit.success)
    return {
      ok: false,
      message: `Demasiadas tentativas de início de sessão. Tente novamente em ${limit.retryAfterSeconds}s.`,
    };

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Dados inválidos.", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    // Sem base de dados não existe autenticação possível. Falha explícita,
    // nunca uma sessão fictícia.
    return {
      ok: false,
      message: "Serviço de autenticação indisponível neste momento. Tente mais tarde.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await recordAudit({
      action: "auth.login.failed",
      actorEmail: parsed.data.email,
      severity: "aviso",
      ip: h.get("x-forwarded-for"),
      metadata: { reason: error.message },
    });
    return { ok: false, message: "Email ou palavra-passe incorrectos." };
  }

  // Conta suspensa ou eliminada: a sessão é encerrada imediatamente.
  // A validação é feita no servidor (nunca apenas na interface).
  if (data.user) {
    const { data: profile } = await supabase
      .from("users")
      .select("status,role")
      .eq("id", data.user.id)
      .maybeSingle();

    const status = (profile?.status as string | undefined) ?? "activa";
    if (status === "suspensa" || status === "eliminada") {
      await supabase.auth.signOut();
      await recordAudit({
        action: "auth.login.failed",
        actorId: data.user.id,
        actorEmail: parsed.data.email,
        severity: "aviso",
        ip: h.get("x-forwarded-for"),
        metadata: { reason: `conta ${status}` },
      });
      return {
        ok: false,
        message:
          status === "suspensa"
            ? "Esta conta está suspensa. Contacte o apoio ao participante para mais informações."
            : "Esta conta foi eliminada.",
      };
    }
  }

  await recordAudit({
    action: "auth.login",
    actorId: data.user?.id,
    actorEmail: parsed.data.email,
    ip: h.get("x-forwarded-for"),
    userAgent: h.get("user-agent"),
  });

  const next = parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : "/painel";
  redirect(next);
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await recordAudit({ action: "auth.logout", actorId: user?.id, actorEmail: user?.email });
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const h = await headers();
  const limit = rateLimit(clientKey(h, "forgot"), { limit: 4, windowMs: 900_000 });
  if (!limit.success)
    return { ok: false, message: "Demasiados pedidos. Tente novamente mais tarde." };

  const parsed = forgotPasswordSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) return { ok: false, message: "Indique um email válido." };

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=/redefinir-palavra-passe`,
    });
  }

  await recordAudit({
    action: "auth.password_reset.requested",
    actorEmail: parsed.data.email,
    ip: h.get("x-forwarded-for"),
  });

  // Resposta idêntica em todos os casos para não revelar existência de contas.
  return {
    ok: true,
    message:
      "Se existir uma conta associada a este email, enviámos instruções para redefinir a palavra-passe.",
  };
}

/**
 * Definição de nova palavra-passe.
 * A sessão de recuperação é criada pelo Supabase quando o utilizador abre a
 * ligação enviada por email (`/auth/callback?next=/redefinir-palavra-passe`).
 * Nunca recebemos nem guardamos a palavra-passe em texto simples.
 */
export async function resetPasswordAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const h = await headers();
  const limit = rateLimit(clientKey(h, "password-reset"), { limit: 6, windowMs: 900_000 });
  if (!limit.success)
    return { ok: false, message: "Demasiadas tentativas. Tente novamente mais tarde." };

  const parsed = passwordResetSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Verifique os dados introduzidos.", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "A recuperação de palavra-passe exige a ligação ao serviço de autenticação.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      message:
        "A ligação de recuperação expirou ou já foi utilizada. Peça uma nova ligação em «Recuperar palavra-passe».",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, message: "Não foi possível definir a nova palavra-passe. Tente novamente." };
  }

  await recordAudit({
    action: "auth.password_reset.completed",
    actorId: user.id,
    actorEmail: user.email,
    ip: h.get("x-forwarded-for"),
  });

  await supabase.auth.signOut();
  return { ok: true, message: "Palavra-passe actualizada. Já pode iniciar sessão com a nova." };
}
