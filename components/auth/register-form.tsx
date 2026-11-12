"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { registerAction, type ActionState } from "@/app/actions/auth";
import { FieldError, FormError, FormSuccess } from "@/components/auth/auth-shell";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { value: "Moçambique", code: "+258", iso: "MZ" },
  { value: "Angola", code: "+244", iso: "AO" },
  { value: "Outros países", code: "+000", iso: "+" },
];

const RULES = [
  { test: (v: string) => v.length >= 8, label: "8 caracteres" },
  { test: (v: string) => /[a-z]/.test(v), label: "minúscula" },
  { test: (v: string) => /[A-Z]/.test(v), label: "maiúscula" },
  { test: (v: string) => /[0-9]/.test(v), label: "número" },
];

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    registerAction,
    undefined,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [country, setCountry] = useState("Moçambique");

  const score = useMemo(() => RULES.filter((r) => r.test(password)).length, [password]);
  const match = password.length > 0 && password === confirm;

  if (state?.ok)
    return (
      <div className="space-y-4">
        <FormSuccess message={state.message} />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[0.82rem] leading-relaxed text-white/55">
          {state.demo
            ? "Configure as variáveis do Supabase para activar o registo real com verificação de email e telefone."
            : "Enviámos um email de confirmação. Depois de confirmar o endereço, já poderá votar e acompanhar o seu histórico."}
        </div>
        <Link href="/entrar" className="btn btn-gold w-full">
          Ir para o início de sessão
        </Link>
        <Link href="/" className="btn btn-ghost w-full">
          Voltar ao início
        </Link>
      </div>
    );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="label">
          Nome completo
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          minLength={3}
          className="field"
          placeholder="Nome e apelido"
        />
        <FieldError errors={state?.fieldErrors?.fullName} />
      </div>

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
        <FieldError errors={state?.fieldErrors?.email} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="country" className="label">
            País
          </label>
          <select
            id="country"
            name="country"
            className="field"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Telefone
          </label>
          <div className="flex gap-1.5">
            <span className="grid shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-[0.78rem] text-white/50">
              {COUNTRIES.find((c) => c.value === country)?.code}
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              className="field"
              placeholder="84 000 0000"
            />
          </div>
          <FieldError errors={state?.fieldErrors?.phone} />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">
          Palavra-passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field pr-10"
            placeholder="Mínimo 8 caracteres"
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
        <div className="mt-2 flex gap-1.5">
          {RULES.map((r, i) => (
            <span
              key={r.label}
              className={cn(
                "flex-1 rounded-full py-0.5 text-center text-[0.58rem] uppercase tracking-wider transition",
                password && r.test(password)
                  ? "bg-star-teal/20 text-star-teal"
                  : i < score
                    ? "bg-star-teal/20 text-star-teal"
                    : "bg-white/6 text-white/25",
              )}
            >
              {r.label}
            </span>
          ))}
        </div>
        <FieldError errors={state?.fieldErrors?.password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirmar palavra-passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={cn("field", confirm && (match ? "!border-star-teal/50" : "!border-star-rose/50"))}
          placeholder="Repita a palavra-passe"
        />
        <FieldError errors={state?.fieldErrors?.confirmPassword} />
      </div>

      <div className="space-y-2.5 rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
        <label className="flex items-start gap-2 text-[0.74rem] leading-relaxed text-white/50">
          <input type="checkbox" name="acceptTerms" required className="mt-0.5 accent-gold-400" />
          <span>
            Aceito os{" "}
            <Link href="/termos" className="text-gold-300 underline" target="_blank">
              termos e condições
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2 text-[0.74rem] leading-relaxed text-white/50">
          <input type="checkbox" name="acceptPrivacy" required className="mt-0.5 accent-gold-400" />
          <span>
            Aceito a{" "}
            <Link href="/privacidade" className="text-gold-300 underline" target="_blank">
              política de privacidade
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2 text-[0.74rem] leading-relaxed text-white/40">
          <input type="checkbox" name="acceptMarketing" className="mt-0.5 accent-gold-400" />
          <span>Quero receber novidades do programa por email (opcional).</span>
        </label>
        <FieldError errors={state?.fieldErrors?.acceptTerms} />
        <FieldError errors={state?.fieldErrors?.acceptPrivacy} />
      </div>

      {/* honeypot anti-bot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <FormError message={state?.message && !state.ok ? state.message : undefined} />

      <button type="submit" disabled={pending} className="btn btn-gold w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> A criar conta…
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" /> Criar conta
          </>
        )}
      </button>

      <p className="text-center text-[0.66rem] leading-relaxed text-white/30">
        Enviaremos um email de confirmação. A verificação de telefone é solicitada apenas quando
        necessária (ex.: voto pago por operadora).
      </p>
    </form>
  );
}
