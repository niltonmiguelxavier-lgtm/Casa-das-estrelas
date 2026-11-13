import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Home, Mic2, ShieldCheck, Users } from "lucide-react";
import { PageHero, Prose, InfoBanner } from "@/components/ui/page-hero";
import { SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "O Programa",
  description:
    "História, conceito, objectivos e formato do reality show Casa das Estrelas — 20 concorrentes de Angola e Moçambique.",
};

const FORMATO = [
  {
    icon: <Home className="h-5 w-5" />,
    title: "A casa",
    text: "Convivência permanente durante a competição, com regras claras de conduta e acompanhamento da produção.",
  },
  {
    icon: <Mic2 className="h-5 w-5" />,
    title: "As galas",
    text: "Actuações semanais avaliadas pelo júri e pelo público, transmitidas em televisão e nas plataformas oficiais.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "As nomeações",
    text: "Os concorrentes mais votados pelo público e pela casa ficam em risco — a decisão final é do público.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "A votação",
    text: "Votação gratuita e votos adicionais por pacotes, com regras publicadas e validação integral no servidor.",
  },
];

const OBJECTIVOS = [
  "Revelar e valorizar talento artístico emergente de Angola e de Moçambique.",
  "Criar uma plataforma de exposição profissional para artistas e criadores.",
  "Promover o intercâmbio cultural entre os dois países e a lusofonia.",
  "Garantir transparência total nos processos de votação e classificação.",
  "Dar ao público um papel decisivo e verificável na competição.",
];

export default function ProgramaPage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre o programa"
        title="Um formato que coloca o talento e o público no centro"
        description="A Casa das Estrelas é um reality show de talento e convivência que reúne 20 concorrentes de Angola e Moçambique numa competição com eliminações semanais decididas pela votação do público."
        breadcrumb={[{ href: "/programa", label: "O Programa" }]}
        image="/media/house.jpg"
        size="lg"
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/concorrentes" className="btn btn-gold">
            Conhecer os concorrentes
          </Link>
          <Link href="/regulamento" className="btn btn-ghost">
            Consultar o regulamento
          </Link>
        </div>
      </PageHero>

      <section className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="title-eyebrow">História</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white">
              De uma ideia televisiva a um fenómeno de participação
            </h2>
            <div className="mt-5 space-y-4 text-[0.92rem] leading-relaxed text-white/55">
              <p>
                A Casa das Estrelas nasceu da vontade de criar um formato de entretenimento que
                fosse, ao mesmo tempo, uma plataforma real de lançamento de carreiras e um espaço
                de encontro entre culturas.
              </p>
              <p>
                O programa combina os elementos que o público reconhece — convivência, provas,
                galas e nomeações — com um sistema de votação digital transparente, auditável e
                acessível em qualquer telemóvel.
              </p>
              <p className="text-white/40">
                Os textos desta página são institucionais. Informações factuais específicas de
                edição (datas, canais de emissão, júri e prémios) são publicadas pela produção
                através de comunicados oficiais na área de notícias.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FORMATO.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="panel h-full rounded-xl2 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-300">
                    {f.icon}
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-[0.82rem] leading-relaxed text-white/50">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-ink-900/40 py-16 md:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Objectivos"
            title="O que o programa se propõe fazer"
            description="Objectivos institucionais que orientam o formato, a produção e a plataforma oficial."
          />
          <div className="mt-9 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {OBJECTIVOS.map((o, i) => (
              <Reveal key={o} delay={i * 60}>
                <div className="flex h-full items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                  <p className="text-[0.85rem] leading-relaxed text-white/60">{o}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <Prose>
            <h2>Conceito</h2>
            <p>
              Vinte pessoas, dez de cada país, entram numa casa e competem em provas de talento,
              criatividade e convivência. Semanalmente, o público avalia o percurso de cada
              concorrente através de voto — gratuito ou através de pacotes de votos.
            </p>
            <p>
              O programa assenta em três pilares: <strong>talento</strong> (o que cada concorrente
              traz), <strong>convivência</strong> (como se comporta em grupo) e{" "}
              <strong>ligação ao público</strong> (quem o público quer manter na casa).
            </p>

            <h2>Formato de cada semana</h2>
            <ol>
              <li>Prova semanal de talento ou criatividade.</li>
              <li>Gala com actuações e avaliação do júri.</li>
              <li>Nomeações e abertura da campanha de votação.</li>
              <li>Encerramento da votação e divulgação do resultado.</li>
              <li>Eliminação e actualização da classificação oficial.</li>
            </ol>

            <h2>Regras gerais</h2>
            <p>
              As regras completas de participação, votação, eliminação, prémios e tratamento de
              dados pessoais constam no <Link href="/regulamento">regulamento oficial</Link>. A
              participação na votação implica a aceitação do regulamento e dos{" "}
              <Link href="/termos">termos e condições</Link>.
            </p>
          </Prose>

          <div className="space-y-4">
            <InfoBanner tone="gold" title="Informação oficial" icon={<Clock className="h-3.5 w-3.5" />}>
              Datas de estreia, horários de emissão e canais oficiais são publicados exclusivamente
              na área de notícias e nos canais oficiais do programa.
            </InfoBanner>
            <InfoBanner tone="teal" title="Transparência na votação">
              Todos os votos são registados na base de dados com data, hora e campanha. A
              classificação é calculada a partir dos votos válidos — nunca a partir de valores
              enviados pelo navegador.
            </InfoBanner>
            <div className="panel rounded-xl2 p-5">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/70">
                Documentos úteis
              </h3>
              <ul className="mt-3 space-y-2 text-[0.85rem]">
                {[
                  { href: "/regulamento", label: "Regulamento oficial" },
                  { href: "/premios", label: "Prémios da edição" },
                  { href: "/faq", label: "Perguntas frequentes" },
                  { href: "/termos", label: "Termos e condições" },
                  { href: "/privacidade", label: "Política de privacidade" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2 text-white/60 transition hover:border-gold-400/30 hover:text-white"
                    >
                      {l.label} <span className="text-gold-400">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
