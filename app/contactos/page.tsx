import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { ContactForm } from "@/components/site/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contactos",
  description: "Contacte a produção da Casa das Estrelas — apoio ao público, imprensa e parcerias.",
};

const CHANNELS = [
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Apoio ao público",
    desc: "Dúvidas sobre conta, votação, pagamentos e notificações.",
    value: site.emails.apoio,
    href: `mailto:${site.emails.apoio}`,
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Assuntos gerais",
    desc: "Informações institucionais e pedidos da produção.",
    value: site.emails.geral,
    href: `mailto:${site.emails.geral}`,
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Imprensa",
    desc: "Credenciais, entrevistas e materiais de imprensa.",
    value: site.emails.imprensa,
    href: `mailto:${site.emails.imprensa}`,
  },
  {
    icon: <Phone className="h-5 w-5" />,
    title: "Telefone",
    desc: "Atendimento em dias úteis, horário local.",
    value: site.phone,
    href: `tel:${site.phone.replace(/\s/g, "")}`,
  },
];

export default function ContactosPage() {
  return (
    <>
      <PageHero
        eyebrow="Falar connosco"
        title="Contactos"
        description="Escolha o canal mais adequado. Respondemos a todos os pedidos em dias úteis."
        breadcrumb={[{ href: "/contactos", label: "Contactos" }]}
        image="/media/microphone.jpg"
        size="sm"
      />

      <section className="container-page py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            {CHANNELS.map((c) => (
              <a
                key={c.title}
                href={c.href}
                className="group flex items-start gap-4 rounded-xl2 border border-white/8 bg-white/[0.02] p-4 transition hover:border-gold-400/30 hover:bg-white/[0.045]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold-400/20 bg-gold-400/10 text-gold-300">
                  {c.icon}
                </span>
                <span>
                  <span className="block text-[0.88rem] font-semibold text-white">{c.title}</span>
                  <span className="mt-0.5 block text-[0.78rem] text-white/45">{c.desc}</span>
                  <span className="mt-1.5 block text-[0.8rem] font-medium text-gold-200 group-hover:underline">
                    {c.value}
                  </span>
                </span>
              </a>
            ))}

            <div className="panel rounded-xl2 p-4">
              <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-widest text-white/50">
                <MapPin className="h-3.5 w-3.5 text-gold-400" /> Produção
              </p>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-white/50">
                A morada da produtora e do estúdio é divulgada pela produção nos canais oficiais. O
                acesso ao estúdio é restrito e sujeito a credenciação.
              </p>
              <p className="mt-2 flex items-center gap-2 text-[0.72rem] text-white/35">
                <Clock className="h-3 w-3" /> Segunda a sexta, 08h00–17h00 (Africa/Maputo)
              </p>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
