import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Mail } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { listSponsors } from "@/lib/services/data";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Patrocinadores",
  description: "Marcas e parceiros oficiais que apoiam a Casa das Estrelas.",
};

export default async function SponsorsPage() {
  const sponsors = await listSponsors();
  const tiers = [
    { id: "principal", label: "Parceiro principal" },
    { id: "oficial", label: "Parceiros oficiais" },
    { id: "media", label: "Parceiros de media" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Parceiros"
        title="Patrocinadores oficiais"
        description="As marcas que tornam possível a produção e a plataforma digital da Casa das Estrelas."
        breadcrumb={[{ href: "/patrocinadores", label: "Patrocinadores" }]}
        image="/media/atmosphere.jpg"
        size="sm"
      />

      <section className="container-page py-12 md:py-16">
        {tiers.map((tier) => {
          const list = sponsors.filter((s) => s.tier === tier.id);
          if (list.length === 0) return null;
          return (
            <div key={tier.id} className="mb-12">
              <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-white/35">
                {tier.label}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s, i) => (
                  <div
                    key={`${s.name}-${i}`}
                    className="group grid h-32 place-items-center rounded-xl2 border border-white/8 bg-white/[0.02] transition hover:border-gold-400/30 hover:bg-white/[0.04]"
                  >
                    <div className="text-center">
                      <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-gold-400/60">
                        ✦
                      </span>
                      <p className="mt-2.5 text-[0.74rem] font-bold uppercase tracking-[0.14em] text-white/45 group-hover:text-white/80">
                        {s.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-10 rounded-xl2 border border-gold-400/20 bg-[radial-gradient(100%_120%_at_0%_0%,rgba(242,182,43,0.1),transparent_60%)] p-6 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="title-eyebrow">Parcerias</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-white">
                Quer associar a sua marca ao programa?
              </h2>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-white/50">
                Fale com a equipa comercial para conhecer as modalidades de patrocínio, activação
                de marca e presença digital na plataforma oficial.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a href={`mailto:${site.emails.geral}`} className="btn btn-gold">
                <Mail className="h-4 w-4" /> Contactar equipa comercial
              </a>
              <Link href="/contactos" className="btn btn-ghost">
                <Handshake className="h-4 w-4" /> Outros contactos
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-[0.72rem] leading-relaxed text-white/25">
          Os logótipos e designações de marcas de terceiros são propriedade dos respectivos
          titulares e são apresentados apenas quando existe relação de patrocínio confirmada.
        </p>
      </section>
    </>
  );
}
