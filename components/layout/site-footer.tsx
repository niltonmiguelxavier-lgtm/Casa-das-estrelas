import Link from "next/link";
import { InstagramIcon, FacebookIcon, YoutubeIcon, TiktokIcon } from "@/components/ui/social-icons";
import { Logo } from "@/components/ui/logo";
import { FOOTER_LINKS, site } from "@/lib/site";

export function SiteFooter() {
  /**
   * Apenas redes sociais oficialmente definidas. Um endereço vazio não é
   * apresentado — o site não mostra ícones que levem a lado nenhum.
   */
  const social = [
    { href: site.social.instagram, Icon: InstagramIcon, label: "Instagram" },
    { href: site.social.facebook, Icon: FacebookIcon, label: "Facebook" },
    { href: site.social.youtube, Icon: YoutubeIcon, label: "YouTube" },
    { href: site.social.tiktok, Icon: TiktokIcon, label: "TikTok" },
  ].filter((s) => s.href.length > 0);

  return (
    <footer className="mt-20 border-t border-white/10 bg-ink-900 md:mt-28">
      <div className="container-page py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-[0.86rem] leading-relaxed text-white/50">
              {site.description}
            </p>

            <dl className="mt-6 space-y-1.5 text-[0.8rem] text-white/45">
              <div className="flex gap-2">
                <dt className="text-white/30">Geral</dt>
                <dd>
                  <a href={`mailto:${site.emails.geral}`} className="hover:text-gold-200">
                    {site.emails.geral}
                  </a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-white/30">Apoio</dt>
                <dd>
                  <a href={`mailto:${site.emails.apoio}`} className="hover:text-gold-200">
                    {site.emails.apoio}
                  </a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-white/30">Imprensa</dt>
                <dd>
                  <a href={`mailto:${site.emails.imprensa}`} className="hover:text-gold-200">
                    {site.emails.imprensa}
                  </a>
                </dd>
              </div>
            </dl>

            {social.length > 0 && (
            <div className="mt-6 flex gap-2">
              {social.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="tap grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/55 transition hover:border-gold-400/50 hover:text-gold-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            )}
          </div>

          <FooterCol title="Programa" links={FOOTER_LINKS.programa} />
          <FooterCol title="Participar" links={FOOTER_LINKS.participar} />
          <FooterCol title="Institucional" links={FOOTER_LINKS.institucional} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 text-[0.74rem] text-white/35 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. Todos os direitos reservados. {site.edition}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{site.country}</span>
            <Link href="/regulamento" className="hover:text-white/70">
              Regulamento
            </Link>
            <Link href="/privacidade" className="hover:text-white/70">
              Privacidade
            </Link>
            <Link href="/cookies" className="hover:text-white/70">
              Cookies
            </Link>
          </p>
        </div>

        <p className="mt-5 max-w-3xl text-[0.66rem] leading-relaxed text-white/22">
          A votação é validada no servidor e registada com data, hora e campanha. Votos pagos são
          creditados exclusivamente após confirmação verificada do fornecedor de pagamento. A
          participação está sujeita às regras do regulamento.
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
    <nav aria-label={title}>
      <h3 className="mb-4 text-[0.66rem] font-bold uppercase tracking-[0.22em] text-white/35">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[0.85rem] text-white/55 transition hover:text-gold-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
