import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Prose } from "@/components/ui/page-hero";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Termos e condições",
  description: "Termos e condições de utilização da plataforma oficial Casa das Estrelas.",
};

export default function TermosPage() {
  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Termos e condições"
        description="Condições de utilização da plataforma oficial do programa Casa das Estrelas."
        breadcrumb={[{ href: "/termos", label: "Termos e condições" }]}
        image="/media/spotlights.jpg"
        size="sm"
      />
      <section className="container-page py-12 md:py-16">
        <Prose>
          <p className="text-white/40">Última actualização: {formatDate(new Date())}.</p>

          <h2>1. Aceitação</h2>
          <p>
            Ao aceder e utilizar este website, o utilizador aceita os presentes termos. Se não
            concordar, deve abster-se de utilizar a plataforma, designadamente das funcionalidades
            que exigem conta.
          </p>

          <h2>2. Conta de utilizador</h2>
          <ul>
            <li>O utilizador é responsável pela veracidade dos dados fornecidos no registo.</li>
            <li>As credenciais são pessoais e intransmissíveis.</li>
            <li>É obrigatório comunicar imediatamente qualquer acesso não autorizado.</li>
            <li>A produção pode suspender contas que violem estes termos ou o regulamento.</li>
          </ul>

          <h2>3. Utilização permitida</h2>
          <p>É proibido:</p>
          <ul>
            <li>Utilizar automatismos, scripts ou bots para votar ou criar contas.</li>
            <li>Tentar acessos não autorizados, testes de intrusão sem autorização escrita, ou interferir com o funcionamento do serviço.</li>
            <li>Reproduzir, distribuir ou explorar comercialmente conteúdos do programa sem autorização.</li>
            <li>Publicar conteúdos ilícitos, difamatórios ou que violem direitos de terceiros.</li>
          </ul>

          <h2>4. Votação e pagamentos</h2>
          <p>
            A votação rege-se pelo <Link href="/regulamento">regulamento</Link>. Os votos pagos são
            processados por fornecedores autorizados e creditados apenas após confirmação verificada
            no servidor. Preços e pacotes são apresentados antes da confirmação da compra.
          </p>
          <ul>
            <li>Os valores cobrados correspondem aos publicados no momento da criação da ordem.</li>
            <li>Não é possível creditar votos sem pagamento confirmado.</li>
            <li>Pedidos de reembolso são analisados caso a caso, nos termos do regulamento.</li>
          </ul>

          <h2>5. Disponibilidade do serviço</h2>
          <p>
            Envidamos esforços para manter a plataforma disponível, podendo ocorrer interrupções
            programadas para manutenção, comunicadas com antecedência quando possível. Não existe
            garantia de disponibilidade ininterrupta.
          </p>

          <h2>6. Propriedade intelectual</h2>
          <p>
            A marca, logótipo, grafismos, textos, fotografias e vídeos do programa são propriedade
            da produção ou de terceiros licenciantes. É proibida a utilização sem autorização
            prévia e escrita.
          </p>

          <h2>7. Limitação de responsabilidade</h2>
          <p>
            Na medida permitida por lei, a produção não responde por danos indirectos resultantes da
            utilização da plataforma, incluindo falhas de rede, dispositivos do utilizador ou
            serviços de terceiros (operadoras, fornecedores de pagamento).
          </p>

          <h2>8. Alterações</h2>
          <p>
            Os presentes termos podem ser actualizados. Alterações materiais são comunicadas na área
            de notificações e produzem efeitos após o prazo indicado no aviso.
          </p>

          <h2>9. Contacto</h2>
          <p>
            Questões sobre estes termos: <a href={`mailto:${site.emails.geral}`}>{site.emails.geral}</a>.
            Para dados pessoais: <a href={`mailto:${site.emails.privacidade}`}>{site.emails.privacidade}</a>.
          </p>
        </Prose>
      </section>
    </>
  );
}
