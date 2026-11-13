"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, User, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NAV_LINKS, NAV_LINKS_SECONDARY } from "@/lib/site";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

/**
 * Cabeçalho público.
 * - Sem qualquer ligação administrativa: o painel só é acessível por URL, e
 *   apenas a contas com papel autorizado (verificado no servidor).
 * - Navegação colapsada num painel lateral em telemóvel.
 */
export function SiteHeader({
  isAuthenticated,
  userName,
}: {
  isAuthenticated: boolean;
  userName?: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink-950"
      >
        Saltar para o conteúdo
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled || open
            ? "border-b border-white/10 bg-ink-950/95 backdrop-blur-md"
            : "border-b border-transparent bg-gradient-to-b from-ink-950/85 to-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[72px]">
          <div className="flex items-center gap-9">
            <Logo />
            <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={isActive(link.href)}
                  className={cn(
                    "link-underline py-1 text-[0.82rem] font-semibold tracking-wide transition-colors",
                    isActive(link.href) ? "text-white" : "text-white/60 hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link
                  href="/painel"
                  className="hidden items-center gap-2 rounded-full border border-white/12 px-3 py-1.5 text-[0.78rem] font-semibold text-white/80 transition hover:border-white/30 hover:text-white sm:flex"
                >
                  <User className="h-3.5 w-3.5 text-gold-300" />
                  <span className="max-w-[8rem] truncate">
                    {userName?.split(" ")[0] ?? "A minha conta"}
                  </span>
                </Link>
              </>
            ) : (
              <Link
                href="/entrar"
                className="hidden px-2 py-2 text-[0.82rem] font-semibold text-white/70 transition hover:text-white sm:block"
              >
                Entrar
              </Link>
            )}

            <Link href="/votar" className="btn btn-gold px-4 py-2 text-[0.78rem] sm:px-5">
              Votar
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              className="tap grid h-10 w-10 place-items-center rounded-full border border-white/12 text-white lg:hidden"
            >
              {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Painel de navegação móvel */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-ink-950/85 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <nav
          aria-label="Navegação móvel"
          className={cn(
            "absolute inset-x-0 top-0 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/10 bg-ink-950 px-5 pb-8 pt-2 transition-transform duration-300",
            open ? "translate-y-0" : "-translate-y-4 opacity-0",
          )}
        >
          <ul className="divide-hair">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between py-4 font-display text-[1.15rem] font-bold uppercase tracking-wide text-white/85"
                >
                  {link.label}
                  {isActive(link.href) && <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[0.6rem] font-bold uppercase tracking-[0.24em] text-white/30">
            Mais
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {NAV_LINKS_SECONDARY.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-2.5 text-[0.86rem] text-white/60">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-2.5 border-t border-white/10 pt-5">
            {isAuthenticated ? (
              <>
                <Link href="/painel" className="btn btn-ghost w-full">
                  <User className="h-4 w-4" /> A minha conta
                </Link>
                <Link href="/painel/notificacoes" className="btn btn-ghost w-full">
                  <Bell className="h-4 w-4" /> Notificações
                </Link>
              </>
            ) : (
              <>
                <Link href="/entrar" className="btn btn-ghost w-full">
                  Iniciar sessão
                </Link>
                <Link href="/registo" className="btn btn-outline-gold w-full">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      <MobileTabBar isAuthenticated={isAuthenticated} />
    </>
  );
}
