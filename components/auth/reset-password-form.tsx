"use client";

import { useActionState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { resetPasswordAction, type ActionState } from "@/app/actions/auth";
import { FormError, FormSuccess } from "@/components/auth/auth-shell";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    resetPasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password" className="label">
          Nova palavra-passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="field"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirmar nova palavra-passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="field"
          placeholder="Repita a palavra-passe"
        />
      </div>

      <FormError message={state?.message && !state.ok ? state.message : undefined} />
      <FormSuccess message={state?.ok ? state.message : undefined} />

      <button type="submit" disabled={pending} className="btn btn-gold w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> A guardar…
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" /> Definir nova palavra-passe
          </>
        )}
      </button>

      <p className="text-center text-[0.68rem] leading-relaxed text-white/30">
        A ligação de recuperação é de uso único e expira automaticamente. Depois de guardar, todas as
        sessões antigas deixam de ser válidas.
      </p>
    </form>
  );
}
