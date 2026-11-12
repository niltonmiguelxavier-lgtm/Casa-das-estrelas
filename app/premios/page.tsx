import type { Metadata } from "next";
import Link from "next/link";
import { Award, Gift, Trophy, Sparkles } from "lucide-react";
import { PageHero, InfoBanner } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Prémios",
  description: "Prémios da edição da Casa das Estrelas — categorias, condições e critérios de atribuição.",
};

const CATEGORIAS = [
  {
    icon: <Trophy className="h-5 w-5" />,
    title: "Vencedor da edição",
    desc: "O concorrente com maior votação acumulada até à final, conforme o regulamento e o comunicado oficial da produção.",
    tag: "Prémio principal",
  },
  {
    icon: <Award className="h-5 w-5" />,
    title: "2.º e 3.º classificados",
    desc: "Prémios de reconhecimento atribuídos aos finalistas seguintes na classificação oficial.",
    tag: "Finalistas",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Prémios especiais",
    desc: "Categorias definidas pela produção em cada edição, divulgadas em comunicado oficial antes da gala correspondente.",
    tag: "Por edição",
  },
  {
    icon: <Gift className="h-5 w-5" />,
    title: "Prémios do público",
    desc: "Sorteios e benefícios para participantes da votação, quando anunciados, sujeitos a regulamento próprio.",
    tag: "Participação",
  },
];

export default function PremiosPage() {
  return (
    <>
      <PageHero
        eyebrow="Reconhecimento"
        title="Prémios"
        description="O que está em jogo nesta edição — categorias, condições e critérios de atribuição, conforme o regulamento oficial."
        breadcrumb={[{ href: "/premios", label: "Prémios" }]}
        image="/media/hero.jpg"
        size="sm"
      />

      <section className="container-page py-12 md:py-16">
        <InfoBanner tone="gold" title="Informação oficial" icon={<Award className="h-3.5 w-3.5" />}>
          A composição detalhada dos prémios (valores, parcerias e condições) é publicada pela
          produção em comunicado oficial. Não divulgamos valores que não estejam oficialmente
          confirmados.
        </InfoBanner>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CATEGORIAS.map((c, i) => (
            <Reveal key={c.title} delay={i * 70}>
              <div className="panel h-full rounded-xl2 p-6">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-300">
                    {c.icon}
                  </span>
                  <span className="badge badge-muted">{c.tag}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-extrabold text-white">{c.title}</h3>
                <p className="mt-2 text-[0.86rem] leading-relaxed text-white/50">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-14">
          <SectionHeading
            eyebrow="Condições"
            title="Como os prémios são atribuídos"
            description="Regras gerais que garantem transparência na atribuição."
          />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              "A classificação final resulta exclusivamente dos votos válidos registados na base de dados.",
              "O concorrente premiado deve ter cumprido integralmente o regulamento e as regras de conduta.",
              "Prémios em dinheiro ou bens estão sujeitos às obrigações fiscais aplicáveis no país do premiado.",
              "A produção pode solicitar documentação de identificação antes da entrega do prémio.",
              "Prémios não são transmissíveis nem convertíveis, salvo autorização expressa da produção.",
              "Comunicados oficiais prevalecem sobre informações de terceiros.",
            ].map((t) => (
              <div
                key={t}
                className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-[0.84rem] leading-relaxed text-white/55"
              >
                <span className="mt-0.5 text-gold-400">✦</span>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/regulamento" className="btn btn-gold">
            Ler o regulamento
          </Link>
          <Link href="/concorrentes" className="btn btn-ghost">
            Ver concorrentes
          </Link>
        </div>
      </section>
    </>
  );
}
