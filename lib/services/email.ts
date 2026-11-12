import "server-only";

/**
 * Envio de email — Notifica (api.notifica.co.mz)
 * ---------------------------------------------------------------------------
 * Fornecedor oficial: Notifica, plataforma moçambicana de notificações
 * (SMS, email, WhatsApp e push). A API é HTTP simples; não há SDK nem
 * dependências novas no projecto.
 *
 * Regras implementadas:
 *  - Sem `NOTIFICA_API_TOKEN` o canal é considerado **inactivo**: nada é
 *    enviado e os registos dizem `ignorado/fornecedor_nao_configurado`.
 *    Nunca se afirma que um email foi entregue sem o fornecedor o confirmar.
 *  - Falha de email nunca desfaz um voto, um pagamento ou uma notificação
 *    in-app: o worker regista o erro e tenta novamente com backoff.
 *  - Remetente limitado à lista oficial (`GET /email/senders`); por omissão
 *    `noreply@notifica.co.mz`. Nunca se inventa um domínio que não esteja
 *    verificado no fornecedor.
 *  - Mensagens transaccionais (conta e pagamentos) usam `type: transactional`
 *    e não são bloqueadas por preferências de marketing.
 *
 * Documentação: https://notifica.co.mz/docs/api/email
 */

const ENDPOINT = process.env.NOTIFICA_API_URL ?? "https://api.notifica.co.mz/api/v1";

/** Remetentes oficiais devolvidos por `GET /email/senders`. */
export const NOTIFICA_SENDERS = [
  "noreply@notifica.co.mz",
  "auth@notifica.co.mz",
  "notification@notifica.co.mz",
] as const;

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  from?: string;
  type?: "transactional" | "marketing";
}

export type EmailResult =
  | { status: "sent"; providerId: string }
  | { status: "skipped"; reason: "not_configured" | "invalid_recipient" }
  | { status: "failed"; error: string };

export function isEmailConfigured() {
  return Boolean(process.env.NOTIFICA_API_TOKEN);
}

function validSender(requested?: string) {
  const fallback = process.env.NOTIFICA_EMAIL_FROM ?? NOTIFICA_SENDERS[0];
  if (requested && (NOTIFICA_SENDERS as readonly string[]).includes(requested)) return requested;
  return fallback;
}

/**
 * Envia um email através da Notifica.
 * Devolve sempre um resultado tipado — nunca lança, para não derrubar o worker.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const token = process.env.NOTIFICA_API_TOKEN;
  if (!token) return { status: "skipped", reason: "not_configured" };
  if (!/.+@.+\..+/.test(message.to)) return { status: "skipped", reason: "invalid_recipient" };

  try {
    const response = await fetch(`${ENDPOINT}/email/send`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        to: message.to,
        subject: message.subject,
        body: message.body,
        from: validSender(message.from),
        type: message.type ?? "transactional",
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const raw = await response.text();

    if (!response.ok) {
      return { status: "failed", error: `${response.status} ${raw.slice(0, 180)}` };
    }

    let payload: { data?: { id?: string } } = {};
    try {
      payload = JSON.parse(raw) as { data?: { id?: string } };
    } catch {
      /* resposta sem JSON: consideramos enviado se o estado HTTP foi 2xx */
    }

    return { status: "sent", providerId: payload.data?.id ?? "sem-id" };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "erro de rede" };
  }
}

/**
 * Texto do email por categoria de notificação.
 * A Notifica aplica o template visual da plataforma; enviamos apenas texto,
 * sem HTML — evita divergências entre clientes de correio.
 */
export function emailForPendingDelivery(
  category: string,
  title: string,
  body: string,
  link: string | null,
): EmailMessage {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const url = link && site ? `\n\n${site}${link}` : "";

  const subject =
    category === "pagamento"
      ? `Pagamento — ${title}`
      : category === "conta"
        ? `Conta — ${title}`
        : category === "votacao"
          ? `Votação — ${title}`
          : title;

  const footer =
    category === "conta" || category === "pagamento"
      ? "\n\nMensagem transaccional sobre a sua conta — não é marketing."
      : "\n\nPode ajustar as preferências de notificação no painel.";

  return {
    to: "",
    subject,
    body: `${body}${url}${footer}\n\n— Casa das Estrelas`,
    type: category === "conta" || category === "pagamento" ? "transactional" : "marketing",
  };
}
