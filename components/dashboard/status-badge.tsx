import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types";

const MAP: Record<PaymentStatus, { label: string; cls: string }> = {
  confirmado: { label: "confirmado", cls: "badge-green" },
  pendente: { label: "pendente", cls: "badge-gold" },
  recusado: { label: "recusado", cls: "badge-live" },
  expirado: { label: "expirado", cls: "badge-muted" },
  reembolsado: { label: "reembolsado", cls: "badge-muted" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  const meta = MAP[status as PaymentStatus] ?? { label: status, cls: "badge-muted" };
  return <span className={cn("badge", meta.cls)}>{meta.label}</span>;
}
