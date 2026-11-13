"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Send } from "lucide-react";
import {
  sendNotificationAction,
  type AdminActionResult,
} from "@/app/actions/admin";
import { cn } from "@/lib/utils";

/**
 * Formulário de envio de notificação (painel ADM).
 * Todos os campos são validados outra vez no servidor; a confirmação é
 * obrigatória para envios imediatos a todos os utilizadores.
 */
export function NotificationComposer({
  emailAvailable,
  smsAvailable,
  pushAvailable,
  whatsappAvailable,
}: {
  emailAvailable: boolean;
  smsAvailable: boolean;
  pushAvailable: boolean;
  whatsappAvailable: boolean;
}) {
  const [state, formAction, pending] = useActionState<AdminActionResult | undefined, FormData>(
    sendNotificationAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="label">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          className="field"
          placeholder="Ex.: Votação da 2.ª gala já abriu"
        />
        {state?.fieldErrors?.title && <FieldMsg>{state.fieldErrors.title}</FieldMsg>}
      </div>

      <div>
        <label htmlFor="body" className="label">
          Mensagem
        </label>
        <textarea
          id="body"
          name="body"
          rows={4}
          required
          maxLength={1000}
          className="field resize-y"
          placeholder="Texto da notificação apresentado ao utilizador."
        />
        {state?.fieldErrors?.body && <FieldMsg>{state.fieldErrors.body}</FieldMsg>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">
            Categoria
          </label>
          <select id="category" name="category" className="field" defaultValue="programa">
            <option value="programa">Programa</option>
            <option value="votacao">Votação</option>
            <option value="pagamento">Pagamento</option>
            <option value="conta">Conta</option>
            <option value="sistema">Sistema</option>
          </select>
        </div>
        <div>
          <label htmlFor="audience" className="label">
            Audiência
          </label>
          <select id="audience" name="audience" className="field" defaultValue="todos">
            <option value="todos">Todos os utilizadores activos</option>
            <option value="pais">Por país</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="country" className="label">
          País (quando aplicável)
        </label>
        <select id="country" name="country" className="field" defaultValue="Moçambique">
          <option value="Moçambique">Moçambique</option>
          <option value="Angola">Angola</option>
        </select>
        {state?.fieldErrors?.country && <FieldMsg>{state.fieldErrors.country}</FieldMsg>}
      </div>

      <div>
        <label htmlFor="link" className="label">
          Ligação (opcional)
        </label>
        <input
          id="link"
          name="link"
          className="field"
          placeholder="/votar ou https://…"
        />
        {state?.fieldErrors?.link && <FieldMsg>{state.fieldErrors.link}</FieldMsg>}
      </div>

      <fieldset>
        <legend className="label">Canais</legend>
        <div className="flex flex-wrap gap-2">
          <ChannelChip label="No site" checked disabled always />
          <ChannelChip label="Email" name="channel_email" available={emailAvailable} defaultChecked={emailAvailable} />
          <ChannelChip label="Push" name="channel_push" available={pushAvailable} />
          <ChannelChip label="SMS" name="channel_sms" available={smsAvailable} />
          <ChannelChip label="WhatsApp" name="channel_whatsapp" available={whatsappAvailable} />
        </div>
        <p className="mt-2 text-[0.66rem] leading-relaxed text-white/30">
          Só é possível escolher canais com fornecedor configurado. Os restantes não são
          apresentados como activos.
        </p>
      </fieldset>

      <div>
        <label htmlFor="scheduledAt" className="label">
          Agendamento (opcional)
        </label>
        <input id="scheduledAt" name="scheduledAt" type="datetime-local" className="field" />
        {state?.fieldErrors?.scheduledAt && <FieldMsg>{state.fieldErrors.scheduledAt}</FieldMsg>}
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 border border-white/10 bg-white/[0.02] p-3">
        <input type="checkbox" name="confirmar" className="mt-0.5 h-4 w-4 accent-gold-400" />
        <span className="text-[0.76rem] leading-relaxed text-white/60">
          Confirmo o envio imediato a <strong className="text-white">todos os utilizadores activos</strong>.
          Esta acção não pode ser revertida.
        </span>
      </label>
      {state?.fieldErrors?.confirmar && <FieldMsg>{state.fieldErrors.confirmar}</FieldMsg>}

      <button type="submit" disabled={pending} className="btn btn-gold w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> A processar…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Enviar notificação
          </>
        )}
      </button>

      {state && (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2.5 border p-3 text-[0.78rem] leading-relaxed",
            state.ok
              ? "border-star-teal/25 bg-star-teal/8 text-teal-200"
              : "border-star-rose/30 bg-star-rose/8 text-rose-200",
          )}
        >
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      )}
    </form>
  );
}

function FieldMsg({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[0.7rem] text-rose-300">{children}</p>;
}

function ChannelChip({
  label,
  name,
  available = true,
  defaultChecked = false,
  checked,
  disabled,
  always,
}: {
  label: string;
  name?: string;
  available?: boolean;
  defaultChecked?: boolean;
  checked?: boolean;
  disabled?: boolean;
  always?: boolean;
}) {
  const on = always || available;
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1.5 text-[0.72rem]",
        on
          ? "border-white/12 text-white/70"
          : "cursor-not-allowed border-white/6 text-white/20",
      )}
    >
      <input
        type="checkbox"
        name={name}
        className="h-3.5 w-3.5 accent-gold-400"
        defaultChecked={defaultChecked}
        checked={checked}
        disabled={disabled || !on}
      />
      {label}
      {!on && <span className="text-[0.58rem] uppercase tracking-wider">indisponível</span>}
    </label>
  );
}
