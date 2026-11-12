import type { AppNotification } from "@/lib/types";

/** Metadados de apresentação por categoria (seguro para o cliente). */
export const NOTIFICATION_CATEGORY_META: Record<
  AppNotification["category"],
  { label: string; tone: string }
> = {
  conta: { label: "Conta", tone: "badge-muted" },
  votacao: { label: "Votação", tone: "badge-gold" },
  pagamento: { label: "Pagamento", tone: "badge-green" },
  programa: { label: "Programa", tone: "badge-live" },
  sistema: { label: "Sistema", tone: "badge-muted" },
};
