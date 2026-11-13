import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CreditCard,
  Heart,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { Avatar } from "@/components/ui/logo";
import { requireUser } from "@/lib/services/session";
import { countUnread } from "@/lib/services/notifications";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { VoteIntentRestorer } from "@/components/voting/vote-intent-restorer";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };

// Área autenticada: sempre renderizada por pedido (nunca pré-renderizada).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/painel");
  const unread = await countUnread();

  const items = [
    { href: "/painel", label: "Visão geral", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/painel/votos", label: "Votos", icon: <Heart className="h-4 w-4" /> },
    { href: "/painel/pagamentos", label: "Pagamentos", icon: <CreditCard className="h-4 w-4" /> },
    {
      href: "/painel/notificacoes",
      label: "Notificações",
      icon: <Bell className="h-4 w-4" />,
      badge: unread,
    },
    { href: "/painel/conta", label: "Conta", icon: <User className="h-4 w-4" /> },
    { href: "/painel/seguranca", label: "Segurança", icon: <ShieldCheck className="h-4 w-4" /> },
    { href: "/painel/preferencias", label: "Preferências", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="container-page py-8 md:py-12">
      <VoteIntentRestorer authenticated />

      <div className="flex flex-col gap-3 border-b border-white/8 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5">
          <Avatar name={user.fullName} size={52} className="ring-2 ring-gold-400/30" />
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-gold-400">
              Painel pessoal
            </p>
            <h1 className="font-display text-xl font-extrabold text-white md:text-2xl">
              Olá, {user.fullName.split(" ")[0]}
            </h1>
            <p className="text-[0.78rem] text-white/40">
              {user.email} · {user.country}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-green">
            <ShieldCheck className="h-3 w-3" /> conta {user.status}
          </span>
          {user.emailVerified ? (
            <span className="badge badge-muted">email verificado</span>
          ) : (
            <span className="badge badge-live">email por verificar</span>
          )}
          <Link href="/votar" className="btn btn-gold !py-2 !text-[0.76rem]">
            <Heart className="h-3.5 w-3.5" /> Votar
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[230px_1fr]">
        <DashboardNav items={items} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
