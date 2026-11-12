import { NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/session";
import { clientKey, rateLimit } from "@/lib/services/rate-limit";
import { recordAudit } from "@/lib/services/audit";

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req.headers, "password-change"), {
    limit: 5,
    windowMs: 600_000,
  });
  if (!limit.success)
    return NextResponse.json(
      { ok: false, message: "Demasiadas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = changePasswordSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      },
      { status: 422 },
    );

  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return NextResponse.json({
      ok: true,
      demo: true,
      message: "Modo de demonstração: a alteração real exige Supabase Auth configurado.",
    });

  // Reautenticação antes da alteração (protecção contra sequestro de sessão).
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (authError)
    return NextResponse.json(
      { ok: false, message: "A palavra-passe actual não está correta." },
      { status: 403 },
    );

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error)
    return NextResponse.json(
      { ok: false, message: "Não foi possível alterar a palavra-passe." },
      { status: 400 },
    );

  await recordAudit({
    action: "auth.password_reset.requested",
    actorId: user.id,
    actorEmail: user.email,
    severity: "aviso",
    metadata: { event: "password.changed" },
  });

  return NextResponse.json({ ok: true, message: "Palavra-passe alterada com sucesso." });
}
