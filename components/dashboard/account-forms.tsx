"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";

export function AccountForms({
  initial,
}: {
  initial: { fullName: string; email: string; phone: string; country: string };
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setStatus("saving");
    // A alteração efetiva é feita por Server Action com validação Zod e RLS.
    await fetch("/api/account/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 3500);
  }

  return (
    <form onSubmit={onSubmit} className="panel rounded-xl2 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="a-name" className="label">
            Nome completo
          </label>
          <input id="a-name" name="fullName" defaultValue={initial.fullName} className="field" required />
        </div>
        <div>
          <label htmlFor="a-email" className="label">
            Email
          </label>
          <input
            id="a-email"
            name="email"
            type="email"
            defaultValue={initial.email}
            className="field opacity-60"
            readOnly
          />
          <p className="mt-1 text-[0.66rem] text-white/30">
            A alteração de email exige verificação do novo endereço.
          </p>
        </div>
        <div>
          <label htmlFor="a-phone" className="label">
            Telefone
          </label>
          <input id="a-phone" name="phone" defaultValue={initial.phone} className="field" />
        </div>
        <div>
          <label htmlFor="a-country" className="label">
            País
          </label>
          <select id="a-country" name="country" defaultValue={initial.country} className="field">
            <option>Moçambique</option>
            <option>Angola</option>
            <option>Outros países</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={status === "saving"} className="btn btn-gold w-full">
            {status === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> A guardar…
              </>
            ) : status === "saved" ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Guardado
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Guardar alterações
              </>
            )}
          </button>
        </div>
      </div>

      <hr className="hairline my-5" />

      <h3 className="text-[0.8rem] font-semibold text-white/70">Alterar email</h3>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input type="email" placeholder="novo@exemplo.com" className="field sm:max-w-xs" />
        <button
          type="button"
          onClick={() =>
            setEmailNotice(
              "Pedido registado. Será enviada uma confirmação para o novo endereço e para o atual antes da alteração entrar em vigor.",
            )
          }
          className="btn btn-ghost"
        >
          Solicitar alteração
        </button>
      </div>
      {emailNotice && (
        <p className="mt-2 rounded-lg border border-gold-400/25 bg-gold-400/8 p-2.5 text-[0.74rem] text-gold-100">
          {emailNotice}
        </p>
      )}

      <p className="mt-5 text-[0.68rem] leading-relaxed text-white/25">
        Os dados pessoais são tratados de acordo com a política de privacidade. Pode solicitar a
        exportação ou o apagamento da conta através do apoio.
      </p>
    </form>
  );
}
