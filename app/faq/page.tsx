import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description:
    "Respostas às perguntas mais frequentes sobre votação, conta, pagamentos e notificações na Casa das Estrelas.",
};

const GROUPS = [
  {
    title: "Conta e acesso",
    items: [
      {
        q: "Preciso de conta para ver o website?",
        a: "Não. Toda a informação pública — concorrentes, notícias, galeria e classificação — está disponível sem conta. Apenas a votação, a compra de votos e o histórico pessoal exigem sessão iniciada.",
      },
      {
        q: "Perdi a palavra-passe. Como recupero?",
        a: "Use a opção «Recuperar palavra-passe» na página de início de sessão. Receberá um email com uma ligação segura e temporária. Por segurança, respondemos da mesma forma exista ou não conta associada ao email.",
      },
      {
        q: "Porque tenho de verificar o email?",
        a: "A verificação protege a sua conta e garante que a votação é feita por pessoas reais. Sem email verificado, a votação pode ficar limitada.",
      },
    ],
  },
  {
    title: "Votação",
    items: [
      {
        q: "Quantos votos gratuitos tenho?",
        a: "O número e a frequência são definidos pela produção em cada campanha e apresentados na página de votação. O limite é verificado no servidor em cada voto.",
      },
      {
        q: "Os votos gratuitos acumulam para o dia seguinte?",
        a: "Depende da campanha. Quando a renovação é diária, os votos não utilizados não transitam para o dia seguinte.",
      },
      {
        q: "Como sei que o meu voto foi registado?",
        a: "Recebe confirmação imediata no ecrã e uma notificação na sua conta. O voto fica registado com data, hora e campanha.",
      },
      {
        q: "O meu voto pode ser anulado?",
        a: "Votos obtidos através de automatismos, contas duplicadas ou outras formas de manipulação são anulados após auditoria, conforme o regulamento.",
      },
    ],
  },
  {
    title: "Pagamentos e votos pagos",
    items: [
      {
        q: "Que métodos de pagamento estão disponíveis?",
        a: "Estão previstos M-Pesa, e-Mola, mKesh, Visa e Mastercard. Cada método só fica activo quando a integração com o fornecedor autorizado está homologada. A página de pacotes indica o estado real de cada método.",
      },
      {
        q: "Paguei e os votos não aparecem. O que faço?",
        a: "Os votos são creditados após a confirmação verificada do fornecedor, que pode levar alguns minutos. Se o pagamento foi confirmado pelo fornecedor e os votos não aparecerem, contacte o apoio com a referência da ordem.",
      },
      {
        q: "Posso pedir reembolso?",
        a: "Votos já creditados não são reembolsáveis, salvo erro comprovado do sistema. Pedidos são analisados caso a caso, conforme o regulamento.",
      },
      {
        q: "Guardam os dados do meu cartão?",
        a: "Não. Os pagamentos com cartão são processados directamente pelo fornecedor autorizado; os dados do cartão nunca passam pelos nossos servidores.",
      },
    ],
  },
  {
    title: "Notificações",
    items: [
      {
        q: "Que canais de notificação existem?",
        a: "Notificações dentro do website e email estão disponíveis. Push no navegador, SMS e WhatsApp dependem de integração configurada — só são apresentados como activos quando realmente o estiverem.",
      },
      {
        q: "Posso escolher o que recebo?",
        a: "Sim, nas preferências de notificações do seu painel. Avisos de segurança e de transacções são considerados essenciais e não dependem de consentimento de marketing.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Ajuda"
        title="Perguntas frequentes"
        description="As respostas às dúvidas mais comuns sobre conta, votação, pagamentos e notificações."
        breadcrumb={[{ href: "/faq", label: "Perguntas frequentes" }]}
        image="/media/house.jpg"
        size="sm"
      />

      <section className="container-page py-12 md:py-16">
        <div className="max-w-3xl space-y-10">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-gold-400">
                {group.title}
              </h2>
              <div className="mt-4 divide-y divide-white/6 overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/50">
                {group.items.map((item) => (
                  <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 text-[0.92rem] font-semibold text-white/85 transition group-open:text-white">
                      {item.q}
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 text-gold-400 transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 pr-8 text-[0.86rem] leading-relaxed text-white/50">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-xl2 border border-gold-400/20 bg-gold-400/[0.05] p-6">
            <h2 className="font-display text-lg font-extrabold text-white">
              Não encontrou a resposta?
            </h2>
            <p className="mt-1.5 text-[0.86rem] text-white/55">
              Escreva para{" "}
              <a href={`mailto:${site.emails.apoio}`} className="text-gold-300 underline">
                {site.emails.apoio}
              </a>{" "}
              ou consulte a página de{" "}
              <Link href="/contactos" className="text-gold-300 underline">
                contactos
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
