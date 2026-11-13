import { Search, ShieldOff } from "lucide-react";
import { requireAdmin, can } from "@/lib/services/session";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { getServiceClient } from "@/lib/supabase/service";

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  if (!can(user.role, "utilizadores.consultar")) redirect("/admin");

  const admin = getServiceClient();
  let users: {
    id: string;
    fullName: string;
    email: string;
    country: string;
    role: string;
    status: string;
    createdAt: string;
  }[] = [];

  if (admin) {
    const { data } = await admin
      .from("users")
      .select("id, email, role, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    const profilesRes = await admin.from("user_profiles").select("user_id, full_name, country");
    const profiles = new Map(
      (profilesRes.data ?? []).map((p) => [String(p.user_id), p as Record<string, unknown>]),
    );
    users = (data ?? []).map((u) => ({
      id: String(u.id),
      fullName: String(profiles.get(String(u.id))?.full_name ?? u.email ?? "—"),
      email: String(u.email ?? "—"),
      country: String(profiles.get(String(u.id))?.country ?? "—"),
      role: String(u.role ?? "utilizador"),
      status: String(u.status ?? "pendente"),
      createdAt: String(u.created_at),
    }));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Utilizadores</h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Consulta de contas, estados e funções. Dados pessoais apresentados de forma mínima.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input className="field !pl-9" placeholder="Procurar por nome, email ou telefone…" />
      </div>

      <div className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
        <div className="hidden grid-cols-[1fr_1fr_110px_110px_130px_100px] gap-3 border-b border-white/6 px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/25 md:grid">
          <span>Nome</span>
          <span>Email</span>
          <span>País</span>
          <span>Função</span>
          <span>Registo</span>
          <span className="text-right">Estado</span>
        </div>
        <ul className="divide-y divide-white/5">
          {users.map((u) => (
            <li
              key={u.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[1fr_1fr_110px_110px_130px_100px]"
            >
              <span className="truncate text-[0.82rem] font-semibold text-white">{u.fullName}</span>
              <span className="truncate text-[0.74rem] text-white/45">{u.email}</span>
              <span className="hidden text-[0.74rem] text-white/45 md:block">{u.country}</span>
              <span className="hidden md:block">
                <span className="badge badge-muted !text-[0.55rem]">{u.role}</span>
              </span>
              <span className="hidden text-[0.7rem] text-white/30 md:block">
                {formatDate(u.createdAt, { day: "2-digit", month: "short", year: "2-digit" })}
              </span>
              <span className="text-right">
                <span className={`badge ${u.status === "activa" ? "badge-green" : "badge-live"}`}>
                  {u.status}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl2 border border-star-rose/20 bg-star-rose/[0.05] p-4">
        <p className="flex items-center gap-2 text-[0.74rem] font-bold uppercase tracking-widest text-rose-200">
          <ShieldOff className="h-3.5 w-3.5" /> Suspensão de contas
        </p>
        <p className="mt-1.5 text-[0.78rem] leading-relaxed text-white/50">
          A suspensão exige justificação obrigatória, é registada em auditoria e notifica o
          utilizador por email. As permissões são sempre verificadas no servidor — esconder uma
          opção na interface não é protecção.
        </p>
      </div>
    </div>
  );
}
