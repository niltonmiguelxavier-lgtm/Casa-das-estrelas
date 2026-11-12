"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, User, X, LogOut, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function SiteHeader({
  isAuthenticated,
  userName,
  isAdmin,
}: {
  isAuthenticated: boolean;
  userName?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink-950"
      >
        Saltar para o conteúdo
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-white/8 bg-ink-950/85 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-950/70"
            : "bg-gradient-to-b from-ink-950/90 to-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[74px]">
          <div className="flex items-center gap-8">
            <Logo />
            <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => {
                const active =
                  pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-[0.82rem] font-semibold transition-colors",
                      active ? "text-white" : "text-white/60 hover:text-white",
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link
                  href="/painel"
                  className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.8rem] font-semibold text-white/85 transition hover:border-gold-400/40 hover:text-white sm:flex"
                >
                  <User className="h-4 w-4 text-gold-300" />
                  <span className="max-w-[9rem] truncate">{userName?.split(" ")[0] ?? "Painel"}</span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-[0.75rem] font-bold uppercase tracking-wider text-gold-200 transition hover:bg-gold-400/20 md:flex"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" /> Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/entrar"
                  className="hidden rounded-full px-3.5 py-2 text-[0.82rem] font-semibold text-white/70 transition hover:text-white sm:block"
                >
                  Entrar
                </Link>
                <Link href="/registo" className="btn btn-ghost hidden px-4 py-2 text-[0.8rem] sm:inline-flex">
                  Criar conta
                </Link>
              </>
            )}
            <Link href="/votar" className="btn btn-gold px-3.5 py-2 text-[0.78rem] sm:px-4 sm:text-[0.8rem]">
              <span className="sm:hidden">Votar</span>
              <span className="hidden sm:inline">Votar agora</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu móvel */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-x-0 top-16 mx-3 origin-top rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl transition-all duration-300",
            open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          )}
        >
          <nav className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between border-b border-white/5 py-3 text-[0.95rem] font-semibold text-white/80 last:border-0"
              >
                {link.label}
                <span className="text-gold-400">›</span>
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {isAuthenticated ? (
                <>
                  <Link href="/painel" className="btn btn-ghost w-full">
                    <LayoutDashboard className="h-4 w-4" /> Painel
                  </Link>
                  <Link href="/painel/notificacoes" className="btn btn-ghost w-full">
                    <Bell className="h-4 w-4" /> Alertas
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/entrar" className="btn btn-ghost w-full">
                    <LogOut className="h-4 w-4" /> Entrar
                  </Link>
                  <Link href="/registo" className="btn btn-gold w-full">
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
