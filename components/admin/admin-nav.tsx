"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: null },
  { href: "/admin/concorrentes", label: "Concorrentes", icon: Star, perm: "concorrentes.gerir" },
  { href: "/admin/utilizadores", label: "Utilizadores", icon: Users, perm: "utilizadores.consultar" },
  { href: "/admin/votacoes", label: "Votações", icon: Vote, perm: "votacoes.gerir" },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard, perm: "financeiro.consultar" },
  { href: "/admin/conteudos", label: "Conteúdos", icon: FileText, perm: "conteudos.noticias" },
  { href: "/admin/galeria", label: "Galeria", icon: ImageIcon, perm: "conteudos.galeria" },
  { href: "/admin/notificacoes", label: "Notificações", icon: Megaphone, perm: "notificacoes.gerir" },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, perm: "relatorios.exportar" },
  { href: "/admin/auditoria", label: "Auditoria", icon: ShieldCheck, perm: "auditoria.ver" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, perm: "*" },
];

export function AdminNav({ permissions, role }: { permissions: string[]; role: string }) {
  const pathname = usePathname();
  const allowed = (perm: string | null) =>
    perm === null || permissions.includes("*") || permissions.includes(perm);

  return (
    <nav aria-label="Navegação administrativa" className="lg:sticky lg:top-20 lg:self-start">
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
        <Bell className="h-3.5 w-3.5 text-gold-400" />
        <span className="text-[0.64rem] uppercase tracking-widest text-white/40">{role}</span>
      </div>
      <ul className="scrollbar-none flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {ITEMS.filter((i) => allowed(i.perm)).map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[0.8rem] font-medium transition",
                  active
                    ? "border-gold-400/35 bg-gold-400/10 text-white"
                    : "border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-gold-300" : "text-white/30")} />
                {item.label}
              </Link>
            </li>
          );
        })}
        {ITEMS.filter((i) => !allowed(i.perm)).slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href} className="hidden shrink-0 lg:block">
              <span
                className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8rem] text-white/20"
                title="Sem permissão para esta função"
              >
                <Icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto text-[0.55rem] uppercase tracking-wider">bloqueado</span>
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
