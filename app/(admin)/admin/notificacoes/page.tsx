import { redirect } from "next/navigation";
import { Bell, CheckCircle2, Clock, XCircle } from "lucide-react";
import { can, requireAdmin } from "@/lib/services/session";
import { getServiceClient } from "@/lib/supabase/service";
import { NotificationComposer } from "@/components/admin/notification-composer";
import { formatDateTime, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  category: string;
  title: string;
  body: string;
  audience: string;
  target_country: string | null;
  channels: string[];
  scheduled_at: string | null;
  sent_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

/**
 * Painel de notificações — dados reais.
 * Lista os envios existentes, o estado de cada um e o número de destinatários.
 */
export default async function AdminNotificationsPage() {
  const user = await requireAdmin();
  if (!can(user.role, "notificacoes.gerir")) redirect("/access-denied");

  const db = getServiceClient();
  let rows: Row[] = [];
  let recipients = new Map<string, number>();
  let dbError: string | null = null;

  if (db) {
    const { data, error } = await db
      .from("notifications")
      .select(
        "id,category,title,body,audience,target_country,channels,scheduled_at,sent_at,cancelled_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) dbError = error.message;
    rows = (data ?? []) as unknown as Row[];

    if (rows.length) {
      const { data: recs } = await db
        .from("notification_recipients")
        .select("notification_id");
      const counts = new Map<string, number>();
      for (const r of (recs ?? []) as unknown as { notification_id: string }[]) {
        counts.set(r.notification_id, (counts.get(r.notification_id) ?? 0) + 1);
      }
      recipients = counts;
    }
  } else {
    dbError = "Sem caminho privilegiado de servidor: não é possível ler os envios.";
  }

  const emailAvailable = Boolean(process.env.NOTIFICA_API_TOKEN);
  const smsAvailable = Boolean(process.env.NOTIFICA_SMS_SENDER_ID);
  const whatsappAvailable = Boolean(process.env.NOTIFICA_WHATSAPP_FROM);
  const pushAvailable = Boolean(process.env.VAPID_PRIVATE_KEY);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Notificações</h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Comunicados e envios segmentados. Cada envio é registado com autor, audiência e canais.
        </p>
      </div>

      {dbError && (
        <div className="border border-gold-400/25 bg-gold-400/[0.06] p-3.5 text-[0.78rem] text-white/60">
          {dbError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border border-white/10 p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            Novo envio
          </h2>
          <div className="mt-4">
            <NotificationComposer
              emailAvailable={emailAvailable}
              smsAvailable={smsAvailable}
              whatsappAvailable={whatsappAvailable}
              pushAvailable={pushAvailable}
            />
          </div>
        </section>

        <section className="border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              Envios
            </h2>
            <span className="text-[0.64rem] uppercase tracking-[0.14em] text-white/30">
              {rows.length} registos
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Bell className="mx-auto h-5 w-5 text-white/20" />
              <p className="mt-3 text-[0.82rem] text-white/40">
                Ainda não foi enviada nenhuma notificação.
              </p>
            </div>
          ) : (
            <ul className="max-h-[34rem] divide-y divide-white/6 overflow-y-auto">
              {rows.map((n) => {
                const state = n.cancelled_at
                  ? { label: "cancelado", tone: "text-rose-300", Icon: XCircle }
                  : n.sent_at
                    ? { label: "enviado", tone: "text-teal-200", Icon: CheckCircle2 }
                    : n.scheduled_at
                      ? { label: "agendado", tone: "text-gold-200", Icon: Clock }
                      : { label: "pendente", tone: "text-white/50", Icon: Clock };

                return (
                  <li key={n.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-[0.84rem] font-semibold text-white">
                        {n.title}
                      </p>
                      <span
                        className={`flex shrink-0 items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider ${state.tone}`}
                      >
                        <state.Icon className="h-3 w-3" /> {state.label}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[0.74rem] leading-relaxed text-white/40">
                      {n.body}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.62rem] text-white/30">
                      <span className="badge badge-muted !text-[0.52rem]">{n.category}</span>
                      <span>{n.audience === "pais" ? n.target_country : "todos"}</span>
                      <span>· {recipients.get(n.id) ?? 0} destinatários</span>
                      <span>· {n.channels.join(", ")}</span>
                      <span>
                        ·{" "}
                        {n.sent_at
                          ? `enviado ${timeAgo(n.sent_at)}`
                          : n.scheduled_at
                            ? `para ${formatDateTime(n.scheduled_at)}`
                            : `criado ${timeAgo(n.created_at)}`}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
