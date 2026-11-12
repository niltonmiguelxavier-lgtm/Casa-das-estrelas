import { CheckCircle2, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/services/session";
import { site, PAYMENT_METHODS } from "@/lib/site";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const envChecks = [
    { k: "NEXT_PUBLIC_SUPABASE_URL", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { k: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    { k: "SUPABASE_SERVICE_ROLE_KEY", ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { k: "UPSTASH_REDIS_REST_URL", ok: Boolean(process.env.UPSTASH_REDIS_REST_URL) },
    { k: "PAYMENT_MPESA_API_KEY", ok: Boolean(process.env.PAYMENT_MPESA_API_KEY) },
    { k: "PAYMENT_EMOLA_API_KEY", ok: Boolean(process.env.PAYMENT_EMOLA_API_KEY) },
    { k: "PAYMENT_MKESH_API_KEY", ok: Boolean(process.env.PAYMENT_MKESH_API_KEY) },
    { k: "PAYMENT_CARD_PROVIDER_KEY", ok: Boolean(process.env.PAYMENT_CARD_PROVIDER_KEY) },
    { k: "RESEND_API_KEY (email)", ok: Boolean(process.env.RESEND_API_KEY) },
    { k: "VAPID_PUBLIC_KEY (push)", ok: Boolean(process.env.VAPID_PUBLIC_KEY) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Configurações</h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Identidade do programa, moedas, métodos de pagamento e estado das integrações.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel rounded-xl2 p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            Identidade do programa
          </h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Nome do programa</label>
              <input className="field" defaultValue={site.name} />
            </div>
            <div>
              <label className="label">Tagline</label>
              <input className="field" defaultValue={site.tagline} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Moeda principal</label>
                <select className="field">
                  <option>MZN — Metical</option>
                  <option>AOA — Kwanza</option>
                </select>
              </div>
              <div>
                <label className="label">Fuso horário</label>
                <input className="field" defaultValue={site.timezone} readOnly />
              </div>
            </div>
            <div>
              <label className="label">Email de contacto</label>
              <input className="field" defaultValue={site.emails.geral} />
            </div>
            <label className="flex items-center gap-2 text-[0.76rem] text-white/55">
              <input type="checkbox" defaultChecked className="accent-gold-400" />
              Publicar totais de votos nas páginas públicas
            </label>
            <button className="btn btn-gold !py-2 !text-[0.78rem]">Guardar configurações</button>
          </div>
        </section>

        <div className="space-y-4">
          <section className="panel rounded-xl2 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              Integrações
            </h2>
            <ul className="mt-3 space-y-2">
              {envChecks.map((c) => (
                <li key={c.k} className="flex items-center justify-between gap-2 text-[0.72rem]">
                  <span className="font-mono text-white/55">{c.k}</span>
                  {c.ok ? (
                    <span className="flex items-center gap-1 text-star-teal">
                      <CheckCircle2 className="h-3.5 w-3.5" /> activo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-white/25">
                      <XCircle className="h-3.5 w-3.5" /> ausente
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.66rem] leading-relaxed text-white/25">
              As chaves nunca são apresentadas, apenas o seu estado. Segredos são exclusivamente
              variáveis de ambiente do servidor.
            </p>
          </section>

          <section className="panel rounded-xl2 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
              Métodos de pagamento
            </h2>
            <ul className="mt-3 space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-[0.76rem]">
                  <span className="text-white/60">
                    {m.label} <span className="text-white/25">· {m.region}</span>
                  </span>
                  <span className="badge badge-muted !text-[0.5rem]">não homologado</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
