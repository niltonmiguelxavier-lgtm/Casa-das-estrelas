"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { loginAction, type ActionState } from "@/app/actions/auth";
import { FormError, FormSuccess } from "@/components/auth/auth-shell";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    loginAction,
    undefined,
  );
  const [show, setShow] = useState(false);
  const router = useRouter();

  // Em modo de demonstração (sem Supabase), encaminha para o painel.
  useEffect(() => {
    if (state?.ok && state.demo) {
      const t = setTimeout(() => router.push(next.startsWith("/") ? next : "/painel"), 1200);
      return () => clearTimeout(t);
    }
  }, [state, router, next]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
          placeholder="nome@exemplo.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="label">
            Palavra-passe
          </label>
          <Link
            href="/recuperar-palavra-passe"
            className="mb-1 text-[0.7rem] font-semibold text-gold-300 hover:text-gold-200"
          >
            Esqueceu-se?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="field pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <FormError message={state?.message && !state.ok ? state.message : undefined} />
      <FormSuccess message={state?.ok ? state.message : undefined} />

      <button type="submit" disabled={pending} className="btn btn-gold w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> A entrar…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" /> Entrar
          </>
        )}
      </button>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-white/8" />
        <span className="text-[0.62rem] uppercase tracking-widest text-white/25">ou</span>
        <span className="h-px flex-1 bg-white/8" />
      </div>

      <a
        href="/api/auth/google"
        className="btn btn-ghost w-full"
        aria-describedby="google-note"
      >
        <GoogleMark /> Continuar com Google
      </a>
      <p id="google-note" className="text-center text-[0.66rem] leading-relaxed text-white/30">
        O início de sessão com Google só fica disponível depois de configurado o fornecedor de
        identidade no Supabase Auth.
      </p>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.24 1.3-1.7 3.9-5.4 3.9a6 6 0 1 1 0-12c1.7 0 2.9.7 3.6 1.3l2.5-2.4C16.5 3.3 14.5 2.4 12 2.4a9.6 9.6 0 1 0 0 19.2c5.5 0 9.2-3.9 9.2-9.4 0-.6-.06-1.1-.15-1.5H12z" />
    </svg>
  );
}
