import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Login com Google (OAuth via Supabase Auth).
 * Só funciona quando o fornecedor Google está configurado no projecto Supabase.
 * Sem configuração, devolve o utilizador à página de login com aviso — nunca
 * apresentamos o botão como funcional por engano.
 */
export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const origin = new URL(request.url).origin;

  if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.redirect(`${origin}/entrar?motivo=google-indisponivel`);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback`, skipBrowserRedirect: true },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(`${origin}/entrar?motivo=google-indisponivel`);
  }

  return NextResponse.redirect(data.url);
}
