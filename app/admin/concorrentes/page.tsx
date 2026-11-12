import { Plus, Upload } from "lucide-react";
import { Avatar } from "@/components/ui/logo";
import { listParticipants } from "@/lib/services/data";
import { requireAdmin, can } from "@/lib/services/session";
import { formatNumber } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function AdminParticipantsPage() {
  const user = await requireAdmin();
  if (!can(user.role, "concorrentes.gerir")) redirect("/admin");
  const participants = await listParticipants();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-white">Concorrentes</h1>
          <p className="mt-1 text-[0.82rem] text-white/45">
            {participants.length} perfis · {participants.filter((p) => p.country === "Angola").length} Angola ·{" "}
            {participants.filter((p) => p.country === "Moçambique").length} Moçambique
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost !py-2 !text-[0.76rem]">
            <Upload className="h-3.5 w-3.5" /> Importar
          </button>
          <button className="btn btn-gold !py-2 !text-[0.76rem]">
            <Plus className="h-3.5 w-3.5" /> Novo concorrente
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
        <div className="hidden grid-cols-[50px_1fr_120px_120px_120px_110px] gap-3 border-b border-white/6 px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/25 md:grid">
          <span>Nº</span>
          <span>Nome</span>
          <span>País</span>
          <span>Estado</span>
          <span className="text-right">Votos</span>
          <span className="text-right">Acções</span>
        </div>
        <ul className="divide-y divide-white/5">
          {participants.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[50px_1fr_120px_120px_120px_110px]"
            >
              <span className="font-display text-[0.76rem] font-bold text-white/40">
                {String(p.number).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={p.name} src={p.photo} size={28} />
                <span className="min-w-0">
                  <span className="block truncate text-[0.82rem] font-semibold text-white">{p.name}</span>
                  <span className="block truncate text-[0.64rem] text-white/30 md:hidden">
                    {p.country} · {formatNumber(p.totalVotes)} votos
                  </span>
                </span>
              </span>
              <span className="hidden text-[0.74rem] text-white/50 md:block">{p.country}</span>
              <span className="hidden md:block">
                <span className={`badge ${p.status === "activo" ? "badge-green" : "badge-muted"}`}>
                  {p.status}
                </span>
              </span>
              <span className="hidden text-right font-display text-[0.78rem] tabular-nums text-gold-200 md:block">
                {formatNumber(p.totalVotes)}
              </span>
              <span className="text-right">
                <button className="rounded-md border border-white/10 px-2 py-1 text-[0.64rem] text-white/50 hover:border-gold-400/40 hover:text-white">
                  Editar
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[0.7rem] leading-relaxed text-white/25">
        As fotografias são armazenadas em object storage (Supabase Storage) e referenciadas por URL.
        Ficheiros pesados nunca são guardados na base de dados. Cada alteração gera um registo de
        auditoria com autor, data e valores anteriores.
      </p>
    </div>
  );
}
