import Link from "next/link";
import { InstagramIcon, FacebookIcon, YoutubeIcon, TiktokIcon } from "@/components/ui/social-icons";
import { Logo } from "@/components/ui/logo";
import { FOOTER_LINKS, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/8 bg-ink-900">
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(242,182,43,0.12),transparent)]" />
      <div className="container-page relative py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              {site.description}
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { href: site.social.instagram, Icon: InstagramIcon, label: "Instagram" },
                { href: site.social.facebook, Icon: FacebookIcon, label: "Facebook" },
                { href: site.social.youtube, Icon: YoutubeIcon, label: "YouTube" },
                { href: site.social.tiktok, Icon: TiktokIcon, label: "TikTok" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-gold-400/40 hover:text-gold-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Programa" links={FOOTER_LINKS.programa} />
          <FooterCol title="Participar" links={FOOTER_LINKS.participar} />
          <FooterCol title="Institucional" links={FOOTER_LINKS.institucional} />
        </div>

        <hr className="hairline my-10" />

        <div className="flex flex-col gap-4 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Casa das Estrelas. Todos os direitos reservados.{" "}
            {site.edition}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{site.emails.geral}</span>
            <span className="hidden md:inline">·</span>
            <span>{site.country}</span>
            <span className="hidden md:inline">·</span>
            <Link href="/regulamento" className="hover:text-white/70">
              Regulamento
            </Link>
            <Link href="/privacidade" className="hover:text-white/70">
              Privacidade
            </Link>
          </p>
        </div>
        <p className="mt-6 max-w-3xl text-[0.68rem] leading-relaxed text-white/25">
          A votação é validada no servidor. Os votos pagos são creditados exclusivamente após
          confirmação verificada do fornecedor de pagamento. Consulte o regulamento para as regras
          completas. Jogo/participação sujeita a restrições de idade conforme o regulamento.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/40">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[0.86rem] text-white/60 transition hover:text-gold-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
