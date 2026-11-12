"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { forgotPasswordAction, type ActionState } from "@/app/actions/auth";
import { FormError, FormSuccess } from "@/components/auth/auth-shell";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    forgotPasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">
          Email da conta
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

      <FormError message={state?.message && !state.ok ? state.message : undefined} />
      <FormSuccess message={state?.ok ? state.message : undefined} />

      <button type="submit" disabled={pending} className="btn btn-gold w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> A enviar…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Enviar instruções
          </>
        )}
      </button>

      <p className="text-center text-[0.68rem] leading-relaxed text-white/30">
        Por segurança, a resposta é idêntica independentemente de existir uma conta associada ao
        email indicado.
      </p>
    </form>
  );
}
