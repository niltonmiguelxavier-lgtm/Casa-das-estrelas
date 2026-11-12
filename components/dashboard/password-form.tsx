"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";

export function PasswordForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    if (data.password !== data.confirmPassword) {
      setStatus("error");
      setMessage("As palavras-passe não coincidem.");
      return;
    }

    setStatus("saving");
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => null);

    const json = res ? ((await res.json()) as { ok: boolean; message?: string }) : null;
    if (json?.ok) {
      setStatus("saved");
      setMessage(json.message ?? "Palavra-passe alterada.");
      form.reset();
    } else {
      setStatus("error");
      setMessage(json?.message ?? "Não foi possível alterar a palavra-passe.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel rounded-xl2 p-5">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
        <KeyRound className="h-4 w-4 text-gold-400" /> Alterar palavra-passe
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="currentPassword" className="label">
            Actual
          </label>
          <input id="currentPassword" name="currentPassword" type="password" required className="field" autoComplete="current-password" />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Nova
          </label>
          <input id="password" name="password" type="password" required minLength={8} className="field" autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmar
          </label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="field" autoComplete="new-password" />
        </div>
      </div>

      {message && (
        <p
          className={`mt-3 rounded-lg border p-2.5 text-[0.76rem] ${
            status === "saved"
              ? "border-star-teal/25 bg-star-teal/10 text-teal-200"
              : "border-star-rose/25 bg-star-rose/10 text-rose-200"
          }`}
        >
          {message}
        </p>
      )}

      <button type="submit" disabled={status === "saving"} className="btn btn-gold mt-4">
        {status === "saving" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> A alterar…
          </>
        ) : status === "saved" ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Alterada
          </>
        ) : (
          "Guardar nova palavra-passe"
        )}
      </button>
      <p className="mt-3 text-[0.68rem] text-white/25">
        Requisitos: mínimo 8 caracteres, com letra maiúscula, minúscula e número. A palavra-passe é
        guardada com hashing e nunca em texto simples.
      </p>
    </form>
  );
}
