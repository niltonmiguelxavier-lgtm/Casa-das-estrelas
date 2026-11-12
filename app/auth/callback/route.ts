import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Troca o código de autenticação (email/Google) por uma sessão. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/painel";

  if (!code) return NextResponse.redirect(`${origin}/entrar?motivo=link-invalido`);

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(`${origin}/painel`);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/entrar?motivo=link-expirado`);

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/painel"}`);
}
