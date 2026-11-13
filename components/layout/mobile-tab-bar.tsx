"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Trophy, User, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Barra de navegação inferior — apenas em telemóvel.
 * Dá acesso permanente às cinco áreas essenciais com alvos de toque grandes,
 * sem ocupar espaço do conteúdo nem depender de menus suspensos.
 */
const ITEMS = [
  { href: "/", label: "Início", Icon: Home },
  { href: "/concorrentes", label: "Casa", Icon: Trophy },
  { href: "/votar", label: "Votar", Icon: Heart },
  { href: "/noticias", label: "Notícias", Icon: Newspaper },
] as const;

export function MobileTabBar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();

  const items = [
    ...ITEMS,
    { href: isAuthenticated ? "/painel" : "/entrar", label: isAuthenticated ? "Conta" : "Entrar", Icon: User },
  ];

  return (
    <nav
      aria-label="Navegação rápida"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/95 backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[0.6rem] font-semibold uppercase tracking-wider transition-colors",
                  active ? "text-gold-300" : "text-white/45",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
