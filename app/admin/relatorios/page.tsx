import { BarChart3, Download, FileSpreadsheet } from "lucide-react";
import { requireAdmin, can } from "@/lib/services/session";
import { redirect } from "next/navigation";
import { getPlatformStats, getRanking } from "@/lib/services/data";
import { formatNumber } from "@/lib/utils";

export default async function AdminReportsPage() {
  const user = await requireAdmin();
  if (!can(user.role, "relatorios.exportar")) redirect("/admin");
  const [stats, ranking] = await Promise.all([getPlatformStats(), getRanking()]);
  const max = Math.max(...ranking.map((r) => r.votes), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
            <BarChart3 className="h-5 w-5 text-gold-400" /> Relatórios
          </h1>
          <p className="mt-1 text-[0.82rem] text-white/45">
            Exportações auditadas. Todos os ficheiros exportados ficam registados em auditoria.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t: "Votos por concorrente", f: "votos.csv" },
          { t: "Transacções", f: "transacoes.csv" },
          { t: "Utilizadores", f: "utilizadores.csv" },
          { t: "Auditoria", f: "auditoria.csv" },
        ].map((r) => (
          <button
            key={r.t}
            className="panel group rounded-xl2 p-4 text-left transition hover:border-gold-400/35"
          >
            <FileSpreadsheet className="h-5 w-5 text-gold-400/70" />
            <p className="mt-2.5 text-[0.84rem] font-semibold text-white">{r.t}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[0.66rem] text-white/30 group-hover:text-gold-300">
              <Download className="h-3 w-3" /> {r.f}
            </p>
          </button>
        ))}
      </div>

      <section className="panel rounded-xl2 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
          Distribuição de votos
        </h2>
        <ul className="mt-4 space-y-2">
          {ranking.map((r) => (
            <li key={r.participantId} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-[0.74rem] text-white/60">{r.name}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/6">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300"
                  style={{ width: `${Math.max(3, (r.votes / max) * 100)}%` }}
                />
              </span>
              <span className="w-16 shrink-0 text-right font-display text-[0.72rem] tabular-nums text-white/50">
                {formatNumber(r.votes)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/35">
            Votos gratuitos
          </p>
          <p className="mt-1.5 font-display text-xl font-extrabold text-white">
            {formatNumber(stats.freeVotes)}
          </p>
        </div>
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/35">
            Votos pagos
          </p>
          <p className="mt-1.5 font-display text-xl font-extrabold text-gold-200">
            {formatNumber(stats.paidVotes)}
          </p>
        </div>
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/35">
            Utilizadores
          </p>
          <p className="mt-1.5 font-display text-xl font-extrabold text-white">
            {formatNumber(stats.registeredUsers)}
          </p>
        </div>
      </div>
    </div>
  );
}
