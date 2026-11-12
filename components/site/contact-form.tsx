"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

/**
 * Formulário de contacto.
 * Validação no cliente para UX; a validação definitiva ocorre na rota /api/contact
 * (rate limiting + sanitização + envio para a fila de email).
 */
export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !json.ok) throw new Error(json.message ?? "Erro");
      setStatus("done");
      setMessage(json.message ?? "Mensagem recebida.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Não foi possível enviar a mensagem. Tente novamente ou escreva para o email de apoio.");
    }
  }

  if (status === "done")
    return (
      <div className="panel grid place-items-center rounded-xl2 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-star-teal" />
        <h2 className="mt-3 font-display text-lg font-bold text-white">Mensagem enviada</h2>
        <p className="mt-1.5 max-w-sm text-[0.85rem] text-white/50">{message}</p>
        <button onClick={() => setStatus("idle")} className="btn btn-ghost mt-5">
          Enviar outra mensagem
        </button>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="panel rounded-xl2 p-5 md:p-6">
      <h2 className="font-display text-lg font-extrabold text-white">Enviar mensagem</h2>
      <p className="mt-1 text-[0.8rem] text-white/45">
        Preencha o formulário. Indique a referência da ordem se o assunto for um pagamento.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">
            Nome completo
          </label>
          <input id="c-name" name="name" required minLength={3} className="field" placeholder="O seu nome" />
        </div>
        <div>
          <label htmlFor="c-email" className="label">
            Email
          </label>
          <input id="c-email" name="email" type="email" required className="field" placeholder="nome@exemplo.com" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-subject" className="label">
            Assunto
          </label>
          <select id="c-subject" name="subject" className="field" defaultValue="apoio">
            <option value="apoio">Apoio ao público / conta</option>
            <option value="pagamento">Pagamento ou votos</option>
            <option value="imprensa">Imprensa</option>
            <option value="parceria">Parcerias e patrocínios</option>
            <option value="dados">Protecção de dados</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-message" className="label">
            Mensagem
          </label>
          <textarea
            id="c-message"
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={6}
            className="field resize-y"
            placeholder="Descreva o seu pedido com o máximo de detalhe possível."
          />
        </div>
        {/* honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <div className="sm:col-span-2">
          <label className="flex items-start gap-2 text-[0.72rem] leading-relaxed text-white/40">
            <input type="checkbox" name="privacy" required className="mt-0.5 accent-gold-400" />
            Autorizo o tratamento dos dados fornecidos para resposta a este pedido, nos termos da
            política de privacidade.
          </label>
        </div>
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-lg border border-star-rose/25 bg-star-rose/10 p-3 text-[0.78rem] text-rose-200">
          {message}
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-gold mt-5 w-full sm:w-auto">
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> A enviar…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Enviar mensagem
          </>
        )}
      </button>
    </form>
  );
}
