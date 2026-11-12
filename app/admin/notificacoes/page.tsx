import { AlertTriangle, Send } from "lucide-react";
import { requireAdmin, can } from "@/lib/services/session";
import { redirect } from "next/navigation";
import { demoNotifications } from "@/lib/services/notifications";
import { timeAgo } from "@/lib/utils";

export default async function AdminNotificationsPage() {
  const user = await requireAdmin();
  if (!can(user.role, "notificacoes.gerir")) redirect("/admin");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Notificações</h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Comunicados, envios segmentados e agendamentos. Envios gerais exigem confirmação explícita.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel rounded-xl2 p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            Novo envio
          </h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Título</label>
              <input className="field" placeholder="Ex.: Votação da 2.ª gala já abriu" />
            </div>
            <div>
              <label className="label">Mensagem</label>
              <textarea rows={3} className="field resize-y" placeholder="Texto da notificação…" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Categoria</label>
                <select className="field">
                  <option>Programa</option>
                  <option>Votação</option>
                  <option>Pagamento</option>
                  <option>Conta</option>
                  <option>Sistema</option>
                </select>
              </div>
              <div>
                <label className="label">Audiência</label>
                <select className="field">
                  <option>Todos os utilizadores</option>
                  <option>Por país</option>
                  <option>Utilizadores selecionados</option>
                  <option>Votantes da campanha activa</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Canais</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { l: "No site", on: true },
                  { l: "Email", on: true },
                  { l: "Push", on: false },
                  { l: "SMS", on: false },
                  { l: "WhatsApp", on: false },
                ].map((c) => (
                  <span
                    key={c.l}
                    className={`rounded-lg border px-2.5 py-1.5 text-[0.7rem] ${
                      c.on
                        ? "border-gold-400/40 bg-gold-400/10 text-gold-200"
                        : "border-white/8 text-white/25"
                    }`}
                  >
                    {c.l} {!c.on && "· indisponível"}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Agendamento (opcional)</label>
              <input type="datetime-local" className="field" />
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-[0.74rem] text-white/50">
              <input type="checkbox" className="mt-0.5 accent-gold-400" />
              Confirmo que revi o conteúdo e autorizo o envio para todos os destinatários
              selecionados.
            </label>

            <button className="btn btn-gold w-full">
              <Send className="h-4 w-4" /> Enviar notificação
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="panel rounded-xl2 p-4">
            <h3 className="text-[0.66rem] font-bold uppercase tracking-widest text-white/40">
              Envios recentes
            </h3>
            <ul className="mt-3 space-y-2.5">
              {demoNotifications.slice(0, 5).map((n) => (
                <li key={n.id} className="rounded-lg border border-white/6 bg-white/[0.02] p-2.5">
                  <p className="truncate text-[0.78rem] font-semibold text-white">{n.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[0.62rem] text-white/30">
                    <span className="badge badge-muted !text-[0.5rem]">{n.category}</span>
                    {timeAgo(n.createdAt)} · {n.channel.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl2 border border-gold-400/20 bg-gold-400/[0.06] p-4">
            <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest text-gold-200">
              <AlertTriangle className="h-3.5 w-3.5" /> Infraestrutura
            </p>
            <p className="mt-2 text-[0.72rem] leading-relaxed text-white/50">
              Os envios são processados por fila com idempotência, retry exponencial e registo de
              entrega por canal. A indisponibilidade de email ou SMS nunca bloqueia votos ou
              pagamentos confirmados.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
