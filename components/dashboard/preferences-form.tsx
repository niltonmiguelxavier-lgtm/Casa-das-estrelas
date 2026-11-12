"use client";

import { useState } from "react";
import { BellRing, CheckCircle2, Loader2, Mail, MessageCircle, Smartphone, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prefs {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
  voteAlerts: boolean;
  newsAlerts: boolean;
  paymentAlerts: boolean;
  securityAlerts: boolean;
}

const CHANNELS: { key: keyof Prefs; label: string; desc: string; icon: React.ReactNode; available: boolean }[] = [
  { key: "inApp", label: "No website", desc: "Centro de notificações da plataforma", icon: <BellRing className="h-4 w-4" />, available: true },
  { key: "email", label: "Email", desc: "Para o endereço da conta", icon: <Mail className="h-4 w-4" />, available: true },
  { key: "push", label: "Push no navegador", desc: "Requer autorização do dispositivo", icon: <Smartphone className="h-4 w-4" />, available: false },
  { key: "sms", label: "SMS", desc: "Depende de fornecedor integrado", icon: <MessageCircle className="h-4 w-4" />, available: false },
  { key: "whatsapp", label: "WhatsApp", desc: "Apenas com integração oficial", icon: <MessageCircle className="h-4 w-4" />, available: false },
];

const TOPICS: { key: keyof Prefs; label: string; essential?: boolean }[] = [
  { key: "voteAlerts", label: "Alertas de votação e campanhas" },
  { key: "newsAlerts", label: "Notícias, vídeos e comunicados" },
  { key: "paymentAlerts", label: "Pagamentos e transacções", essential: true },
  { key: "securityAlerts", label: "Segurança da conta", essential: true },
];

export function PreferencesForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const toggle = (key: keyof Prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  async function save() {
    setStatus("saving");
    await fetch("/api/account/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    }).catch(() => {});
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="space-y-5">
      <section className="panel rounded-xl2 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
          Canais
        </h2>
        <p className="mt-1 text-[0.78rem] text-white/40">
          Os canais marcados como indisponíveis só aparecem activos quando a integração estiver
          configurada.
        </p>
        <ul className="mt-4 space-y-2">
          {CHANNELS.map((c) => (
            <li
              key={c.key}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5",
                c.available ? "border-white/8 bg-white/[0.02]" : "border-white/5 bg-white/[0.01] opacity-60",
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/6 text-gold-300">
                {c.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[0.85rem] font-semibold text-white">
                  {c.label}
                  {!c.available && <span className="badge badge-muted !text-[0.55rem]">indisponível</span>}
                </p>
                <p className="text-[0.7rem] text-white/35">{c.desc}</p>
              </div>
              <Switch
                checked={prefs[c.key]}
                disabled={!c.available}
                onChange={() => toggle(c.key)}
                label={c.label}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel rounded-xl2 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
          Tipos de notificação
        </h2>
        <ul className="mt-4 space-y-2">
          {TOPICS.map((t) => (
            <li
              key={t.key}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-gold-400/70" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.85rem] font-semibold text-white">{t.label}</p>
                {t.essential && (
                  <p className="text-[0.68rem] text-white/35">
                    Notificação essencial — exigida para segurança e transacções. Não pode ser
                    desactivada.
                  </p>
                )}
              </div>
              <Switch
                checked={prefs[t.key] || Boolean(t.essential)}
                disabled={Boolean(t.essential)}
                onChange={() => toggle(t.key)}
                label={t.label}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={status === "saving"} className="btn btn-gold">
          {status === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> A guardar…
            </>
          ) : status === "saved" ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Preferências guardadas
            </>
          ) : (
            "Guardar preferências"
          )}
        </button>
        <p className="text-[0.68rem] text-white/25">
          As alterações aplicam-se imediatamente aos envios futuros.
        </p>
      </div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        checked ? "border-gold-400/60 bg-gold-400/70" : "border-white/12 bg-white/8",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 shrink-0 rounded-full bg-white transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}
