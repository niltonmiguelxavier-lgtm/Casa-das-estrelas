import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Prose } from "@/components/ui/page-hero";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Como a Casa das Estrelas recolhe, utiliza e protege dados pessoais dos utilizadores da plataforma.",
};

export default function PrivacidadePage() {
  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Política de privacidade"
        description="Informação clara sobre os dados que recolhemos, para que fins os utilizamos e como protegemos os seus direitos."
        breadcrumb={[{ href: "/privacidade", label: "Política de privacidade" }]}
        image="/media/voting.jpg"
        size="sm"
      />
      <section className="container-page py-12 md:py-16">
        <Prose>
          <p className="text-white/40">Última actualização: {formatDate(new Date())}.</p>

          <h2>1. Responsável pelo tratamento</h2>
          <p>
            A produção do programa Casa das Estrelas é responsável pelo tratamento dos dados
            pessoais recolhidos nesta plataforma. Contacto:{" "}
            <a href={`mailto:${site.emails.privacidade}`}>{site.emails.privacidade}</a>.
          </p>

          <h2>2. Dados recolhidos</h2>
          <ul>
            <li><strong>Identificação e conta:</strong> nome completo, email, telefone, país, palavra-passe (armazenada com hash), preferências.</li>
            <li><strong>Actividade:</strong> votos registados, compras, ordens de pagamento, notificações lidas.</li>
            <li><strong>Técnicos:</strong> endereço IP, tipo de dispositivo e navegador, registos de segurança (protecção contra abuso).</li>
            <li><strong>Comunicações:</strong> pedidos de apoio e mensagens enviadas através dos formulários.</li>
          </ul>
          <p>
            Não recolhemos dados de cartão bancário nos nossos servidores: os pagamentos são
            processados directamente pelos fornecedores autorizados.
          </p>

          <h2>3. Finalidades e fundamentos</h2>
          <ul>
            <li>Criação, autenticação e gestão da conta — execução do contrato.</li>
            <li>Registo e contabilização de votos e aplicação de limites — execução do contrato e integridade do concurso.</li>
            <li>Processamento de pagamentos, facturação e prevenção de fraude — obrigação legal e interesse legítimo.</li>
            <li>Notificações sobre o programa e a conta — execução do contrato; comunicações de marketing apenas com consentimento.</li>
            <li>Segurança, auditoria e detecção de abusos — interesse legítimo.</li>
          </ul>

          <h2>4. Partilha com terceiros</h2>
          <p>Os dados podem ser tratados por subcontratantes estritamente necessários:</p>
          <ul>
            <li>Alojamento e base de dados (Supabase / PostgreSQL gerido, Vercel).</li>
            <li>Fornecedores de pagamento (M-Pesa, e-Mola, mKesh, processadores de cartão).</li>
            <li>Fornecedores de email, SMS e notificações push, quando activos.</li>
          </ul>
          <p>
            Não vendemos dados pessoais. Transferências internacionais são enquadradas por
            garantias contratuais adequadas.
          </p>

          <h2>5. Conservação</h2>
          <p>
            Os dados de conta são conservados enquanto a conta existir. Registos de votos e
            transacções são conservados pelo período exigido para auditoria do concurso e
            cumprimento de obrigações legais e fiscais. Registos de segurança são conservados por
            período limitado.
          </p>

          <h2>6. Direitos do titular</h2>
          <p>
            O utilizador pode solicitar acesso, rectificação, apagamento, limitação, portabilidade e
            oposição, através de {site.emails.privacidade}. Responderemos dentro do prazo legal
            aplicável. Existe também o direito de reclamar junto da autoridade de protecção de dados
            competente.
          </p>

          <h2>7. Segurança</h2>
          <ul>
            <li>Ligações cifradas por HTTPS e cabeçalhos de segurança.</li>
            <li>Palavras-passe protegidas por hashing e nunca armazenadas em texto simples.</li>
            <li>Autorização por funções e Row Level Security na base de dados.</li>
            <li>Registo de auditoria de operações administrativas e de segurança.</li>
            <li>Limitação de tentativas de autenticação e de votação.</li>
          </ul>

          <h2>8. Menores</h2>
          <p>
            A criação de conta por menores depende de autorização do representante legal, nos termos
            do regulamento e da legislação aplicável.
          </p>

          <h2>9. Cookies</h2>
          <p>
            A utilização de cookies está descrita na{" "}
            <Link href="/cookies">política de cookies</Link>.
          </p>
        </Prose>
      </section>
    </>
  );
}
