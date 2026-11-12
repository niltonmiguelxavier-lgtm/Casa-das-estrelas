import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware: renovação de sessão + cabeçalhos de segurança + protecção de rotas.
 */
const PROTECTED_PREFIXES = ["/painel", "/votar/confirmar", "/checkout"];
const ADMIN_PREFIX = "/admin";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let isAuthenticated = false;
  let role: string | null = null;

  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = (profile?.role as string) ?? "utilizador";
    }
  }

  const { pathname, search } = request.nextUrl;

  // --- Protecção de rotas autenticadas ---
  if (url && anon) {
    const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (needsAuth && !isAuthenticated) {
      const loginUrl = new URL("/entrar", request.url);
      loginUrl.searchParams.set("next", pathname + search);
      loginUrl.searchParams.set("motivo", "autenticacao-necessaria");
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (pathname.startsWith(ADMIN_PREFIX)) {
      const allowed = ["superadministrador", "administrador", "gestor_conteudos", "operador_financeiro"];
      if (!isAuthenticated || !role || !allowed.includes(role)) {
        const loginUrl = new URL("/entrar", request.url);
        loginUrl.searchParams.set("next", pathname + search);
        loginUrl.searchParams.set("motivo", "acesso-restrito");
        return withSecurityHeaders(NextResponse.redirect(loginUrl));
      }
    }
  }

  return withSecurityHeaders(response);
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "on");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)",
  );
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|media|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)"],
};
