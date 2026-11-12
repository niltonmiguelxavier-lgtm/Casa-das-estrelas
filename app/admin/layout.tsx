import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin, ROLE_PERMISSIONS } from "@/lib/services/session";
import { isAdminKeyConfigured, isDatabaseConfigured, isServiceConfigured } from "@/lib/services/data";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Administração", robots: { index: false } };

// Área autenticada: sempre renderizada por pedido (nunca pré-renderizada).
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const perms = ROLE_PERMISSIONS[user.role] ?? [];

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="border-b border-white/8 bg-ink-900/80 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo compact />
            <span className="hidden text-[0.62rem] font-bold uppercase tracking-[0.24em] text-white/35 sm:block">
              Painel administrativo
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[0.72rem] text-white/45 sm:block">
              {user.fullName} · <span className="text-gold-300">{user.role}</span>
            </span>
            <Link
              href="/"
              className="rounded-full border border-white/10 px-3 py-1.5 text-[0.7rem] text-white/60 hover:text-white"
            >
              Ver site
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page py-6">
        {!isDatabaseConfigured() ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-gold-400/25 bg-gold-400/[0.07] p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
            <p className="text-[0.78rem] leading-relaxed text-white/60">
              <strong className="text-gold-200">Modo de demonstração.</strong> Não existe ligação ao
              PostgreSQL. As ações de escrita estão desactivadas ou simuladas e nenhuma alteração é
              persistida. Configure <code className="text-gold-200">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              e <code className="text-gold-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para activar o
              painel real.
            </p>
          </div>
        ) : !isServiceConfigured() ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
            <p className="text-[0.78rem] leading-relaxed text-white/60">
              <strong className="text-white/80">Base de dados ligada (leitura real).</strong> Não
              existe caminho privilegiado de servidor: as acções administrativas ficam
              indisponíveis até configurar{" "}
              <code className="text-gold-200">SUPABASE_SERVICE_ROLE_KEY</code> ou{" "}
              <code className="text-gold-200">DATABASE_URL</code>.
            </p>
          </div>
        ) : !isAdminKeyConfigured() ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-400/70" />
            <p className="text-[0.78rem] leading-relaxed text-white/55">
              <strong className="text-white/75">Serviço ligado por PostgreSQL directo.</strong> As
              leituras e operações auditadas funcionam. A chave secreta da Supabase é recomendada
              para completar o conjunto (upload para Storage e operações PostgREST).
            </p>
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <AdminNav permissions={perms} role={user.role} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
