import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/ui/page-hero";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Que cookies e tecnologias semelhantes são utilizadas na plataforma Casa das Estrelas.",
};

const COOKIES = [
  {
    name: "Sessão de autenticação",
    purpose: "Manter a sessão iniciada de forma segura.",
    duration: "Sessão / até 30 dias",
    required: true,
  },
  {
    name: "Preferências de interface",
    purpose: "Guardar escolhas como filtros e intenção de voto pendente.",
    duration: "30 dias",
    required: false,
  },
  {
    name: "Segurança e antifraude",
    purpose: "Detectar abusos de autenticação e de votação.",
    duration: "30 dias",
    required: true,
  },
  {
    name: "Medição de audiência",
    purpose: "Compreender a utilização do website de forma agregada.",
    duration: "13 meses",
    required: false,
  },
];

export default function CookiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Política de cookies"
        description="Transparência sobre as tecnologias que permitem o funcionamento seguro da plataforma."
        breadcrumb={[{ href: "/cookies", label: "Política de cookies" }]}
        image="/media/house.jpg"
        size="sm"
      />
      <section className="container-page py-12 md:py-16">
        <Prose>
          <h2>O que são cookies</h2>
          <p>
            Cookies são pequenos ficheiros guardados no dispositivo que permitem reconhecer a sessão
            do utilizador e manter preferências. Utilizamos também armazenamento local do navegador
            para guardar a intenção de voto antes da autenticação.
          </p>

          <h2>Categorias utilizadas</h2>
          <div className="not-prose mt-4 overflow-hidden rounded-xl2 border border-white/8">
            <table className="w-full text-left text-[0.82rem]">
              <thead className="bg-white/[0.03] text-[0.62rem] uppercase tracking-[0.14em] text-white/40">
                <tr>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Finalidade</th>
                  <th className="px-4 py-3">Duração</th>
                  <th className="px-4 py-3">Obrigatório</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COOKIES.map((c) => (
                  <tr key={c.name}>
                    <td className="px-4 py-3 font-medium text-white/80">{c.name}</td>
                    <td className="px-4 py-3 text-white/50">{c.purpose}</td>
                    <td className="px-4 py-3 text-white/50">{c.duration}</td>
                    <td className="px-4 py-3">
                      {c.required ? (
                        <span className="badge badge-gold">sim</span>
                      ) : (
                        <span className="badge badge-muted">opcional</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Como gerir</h2>
          <p>
            Pode eliminar ou bloquear cookies nas definições do navegador. Note que bloquear os
            cookies obrigatórios impede o início de sessão e, consequentemente, a votação e a compra
            de votos.
          </p>

          <h2>Consentimento</h2>
          <p>
            Os cookies estritamente necessários não requerem consentimento. Categorias opcionais
            (como medição de audiência) só são activadas após consentimento explícito, que pode ser
            retirado a qualquer momento.
          </p>
        </Prose>
      </section>
    </>
  );
}
