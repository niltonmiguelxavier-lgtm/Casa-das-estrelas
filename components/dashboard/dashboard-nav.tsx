"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

export function DashboardNav({
  items,
}: {
  items: { href: string; label: string; icon: React.ReactNode; badge?: number }[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação do painel" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const active =
            item.href === "/painel" ? pathname === "/painel" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[0.82rem] font-medium transition",
                  active
                    ? "border-gold-400/35 bg-gold-400/10 text-white"
                    : "border-transparent text-white/50 hover:border-white/10 hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <span className={active ? "text-gold-300" : "text-white/35"}>{item.icon}</span>
                {item.label}
                {item.badge ? (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-star-rose px-1 text-[0.6rem] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-3 lg:shrink lg:border-t lg:border-white/8 lg:pt-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.82rem] font-medium text-white/40 transition hover:bg-white/[0.03] hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" /> Terminar sessão
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
