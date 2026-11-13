import { Laptop, ShieldCheck } from "lucide-react";
import { PasswordForm } from "@/components/dashboard/password-form";
import { getSecurityActivity } from "@/lib/services/user-data";
import { requireUser } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Segurança" };

export default async function SecurityPage() {
  await requireUser("/painel/seguranca");
  const activity = await getSecurityActivity(10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Segurança da conta</h1>
        <p className="mt-1 text-[0.84rem] text-white/45">
          Gestão de palavra-passe e actividade recente de acesso.
        </p>
      </div>

      <PasswordForm />

      <section className="panel rounded-xl2">
        <header className="flex items-center gap-2 border-b border-white/8 px-5 py-3.5">
          <ShieldCheck className="h-4 w-4 text-star-teal" />
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            Actividade recente
          </h2>
        </header>
        <ul className="divide-y divide-white/5">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/6 text-white/50">
                <Laptop className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.84rem] font-semibold text-white">{a.event}</p>
                <p className="text-[0.68rem] text-white/35">
                  {a.device} · {a.location}
                </p>
              </div>
              <span className="text-[0.68rem] text-white/30">{formatDateTime(a.at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-xl2 border border-white/8 bg-white/[0.02] p-4 text-[0.74rem] leading-relaxed text-white/40">
        Se reconhecer um acesso que não foi seu, altere imediatamente a palavra-passe e contacte o
        apoio. As sessões activas podem ser revogadas pelo encerramento de sessão em todos os
        dispositivos, disponível ao iniciar sessão de novo.
      </div>
    </div>
  );
}
