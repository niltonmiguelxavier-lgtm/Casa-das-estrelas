import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { PageHero, Prose, InfoBanner } from "@/components/ui/page-hero";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Regulamento",
  description:
    "Regulamento oficial da Casa das Estrelas: participação, votação, eliminações, prémios e tratamento de dados.",
};

export default function RegulamentoPage() {
  return (
    <>
      <PageHero
        eyebrow="Documento oficial"
        title="Regulamento"
        description="Regras de participação, funcionamento da votação, critérios de eliminação e atribuição de prémios."
        breadcrumb={[{ href: "/regulamento", label: "Regulamento" }]}
        image="/media/microphone.jpg"
        size="sm"
      />

      <section className="container-page py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <InfoBanner tone="gold" title="Versão em vigor" icon={<FileText className="h-3.5 w-3.5" />}>
              Versão 1.0 · Última actualização: {formatDate(new Date())}. Este documento é
              complementado pelos{" "}
              <Link href="/termos" className="underline">
                termos e condições
              </Link>{" "}
              e pela{" "}
              <Link href="/privacidade" className="underline">
                política de privacidade
              </Link>
              .
            </InfoBanner>

            <div className="mt-8">
              <Prose>
                <h2>1. Objecto e âmbito</h2>
                <p>
                  O presente regulamento estabelece as regras aplicáveis à participação no programa
                  <strong> {site.name}</strong>, incluindo o funcionamento das campanhas de votação
                  e a atribuição de prémios. Aplica-se a todos os concorrentes, ao público votante e
                  a qualquer utilizador da plataforma oficial.
                </p>

                <h2>2. Participação dos concorrentes</h2>
                <ul>
                  <li>A grelha oficial é composta por vinte concorrentes: dez de Angola e dez de Moçambique.</li>
                  <li>A selecção, verificação documental e contratação dos concorrentes é da responsabilidade exclusiva da produção.</li>
                  <li>Informações de perfil publicadas na plataforma são previamente autorizadas pelos concorrentes.</li>
                  <li>A produção pode substituir ou retirar um concorrente por incumprimento das regras de conduta.</li>
                </ul>

                <h2>3. Participação do público</h2>
                <p>
                  A consulta do website é livre. A votação, a compra de votos e a consulta do
                  histórico pessoal exigem a criação de conta e sessão iniciada. Cada pessoa deve
                  possuir apenas uma conta e não pode ceder ou partilhar credenciais.
                </p>
                <ul>
                  <li>Idade mínima e condições de participação definidas pela produção e pela legislação aplicável.</li>
                  <li>Dados de registo verdadeiros, completos e actualizados.</li>
                  <li>Proibição de automatismos, bots, VPN destinada a contornar limites, ou qualquer artifício de manipulação.</li>
                </ul>

                <h2>4. Votação gratuita</h2>
                <ul>
                  <li>Cada conta dispõe de um número de votos gratuitos definido por campanha.</li>
                  <li>A frequência de renovação (diária, semanal ou única) é indicada na página da campanha activa.</li>
                  <li>Os votos gratuitos não são acumuláveis para campanhas seguintes, salvo indicação em contrário.</li>
                  <li>O limite é verificado no servidor em cada operação.</li>
                </ul>

                <h2>5. Votos pagos</h2>
                <ul>
                  <li>Os pacotes de votos são definidos pela produção, com quantidade, preço e moeda publicados.</li>
                  <li>O pagamento é processado por fornecedores autorizados (M-Pesa, e-Mola, mKesh, Visa, Mastercard, conforme disponibilidade).</li>
                  <li>Os votos só são creditados após confirmação verificada do fornecedor no servidor.</li>
                  <li>O fornecedor define as condições, comissões e prazos do respectivo serviço.</li>
                  <li>Votos já creditados não são reembolsáveis, salvo erro comprovado do sistema.</li>
                </ul>

                <h2>6. Eliminações e resultados</h2>
                <ul>
                  <li>A votação de cada gala abre e encerra nas datas e horas divulgadas pela produção.</li>
                  <li>Os votos recebidos após o encerramento não são contabilizados.</li>
                  <li>Os resultados divulgados na plataforma são provisórios até ao comunicado oficial.</li>
                  <li>Em caso de empate, aplica-se o critério definido pela produção e divulgado no comunicado da gala.</li>
                </ul>

                <h2>7. Prémios</h2>
                <p>
                  Os prémios da edição constam na página{" "}
                  <Link href="/premios">Prémios</Link>. A entrega depende do cumprimento integral do
                  regulamento pelo concorrente premiado e observa as obrigações fiscais aplicáveis.
                </p>

                <h2>8. Integridade da votação</h2>
                <p>
                  A produção pode auditar votos, suspender contas e anular votos obtidos por meios
                  fraudulentos. Todas as operações administrativas ficam registadas em auditoria.
                </p>
                <ul>
                  <li>Registo de data, hora, campanha e conta em cada voto.</li>
                  <li>Limites de frequência e mecanismos antiautomação.</li>
                  <li>Verificação de assinatura em todas as confirmações de pagamento.</li>
                </ul>

                <h2>9. Protecção de dados</h2>
                <p>
                  O tratamento de dados pessoais rege-se pela{" "}
                  <Link href="/privacidade">política de privacidade</Link>. O titular pode exercer
                  os seus direitos através de {site.emails.privacidade}.
                </p>

                <h2>10. Alterações e lei aplicável</h2>
                <p>
                  A produção pode alterar o regulamento, informando os utilizadores pelos canais
                  oficiais e na área de notificações. As alterações materiais entram em vigor após o
                  prazo indicado no aviso. A lei aplicável é a da República de Moçambique, sem
                  prejuízo de normas imperativas aplicáveis ao país de residência do utilizador.
                </p>
              </Prose>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="panel rounded-xl2 p-5">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/70">
                Neste documento
              </h3>
              <ul className="mt-3 space-y-2 text-[0.8rem] text-white/45">
                {[
                  "Objecto e âmbito",
                  "Participação dos concorrentes",
                  "Participação do público",
                  "Votação gratuita",
                  "Votos pagos",
                  "Eliminações e resultados",
                  "Prémios",
                  "Integridade da votação",
                  "Protecção de dados",
                  "Alterações e lei aplicável",
                ].map((t, i) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-gold-400/60">{i + 1}.</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel rounded-xl2 p-5">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white/70">
                <Download className="h-4 w-4 text-gold-400" /> Versão PDF
              </h3>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-white/45">
                A versão PDF assinada é publicada pela produção. Enquanto não estiver disponível,
                esta é a versão de referência.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
