import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { ParticipantCard } from "@/components/participants/participant-card";
import { Reveal } from "@/components/ui/reveal";
import { getActiveCampaign, listParticipants } from "@/lib/services/data";
import { getCurrentUser } from "@/lib/services/session";
import { cn } from "@/lib/utils";
import { CountryCode } from "@/components/ui/country-tag";

export const metadata: Metadata = {
  title: "Concorrentes",
  description:
    "Conheça os 20 concorrentes da Casa das Estrelas — 10 de Angola e 10 de Moçambique — e vote no seu favorito.",
};

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ pais?: string }>;
}) {
  const { pais } = await searchParams;
  const [participants, campaign, user] = await Promise.all([
    listParticipants(),
    getActiveCampaign(),
    getCurrentUser(),
  ]);

  const filter = pais === "Angola" || pais === "Moçambique" ? pais : "todos";
  const list =
    filter === "todos" ? participants : participants.filter((p) => p.country === filter);

  const angola = participants.filter((p) => p.country === "Angola").length;
  const mocambique = participants.filter((p) => p.country === "Moçambique").length;

  return (
    <>
      <PageHero
        eyebrow="Os protagonistas"
        title="Concorrentes"
        description={
          participants.length > 0
            ? `${participants.length} concorrentes publicados. Conheça o percurso de cada um e o estado na competição.`
            : "Os perfis oficiais dos concorrentes são publicados pela produção antes do início das emissões."
        }
        breadcrumb={[{ href: "/concorrentes", label: "Concorrentes" }]}
        image="/media/atmosphere.jpg"
      >
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip href="/concorrentes" active={filter === "todos"} label={`Todos (${participants.length})`} />
          <FilterChip
            href="/concorrentes?pais=Angola"
            active={filter === "Angola"}
            label={<><CountryCode country="Angola" /> Angola ({angola})</>}
          />
          <FilterChip
            href="/concorrentes?pais=Moçambique"
            active={filter === "Moçambique"}
            label={<><CountryCode country="Moçambique" /> Moçambique ({mocambique})</>}
          />
        </div>
      </PageHero>

      <section className="container-page py-12 md:py-16">
        {list.length === 0 ? (
          <div className="border border-dashed border-white/12 px-6 py-16 text-center">
            <p className="font-display text-lg font-bold text-white">
              A grelha de concorrentes ainda não foi publicada
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              Assim que a produção publicar a lista oficial, os perfis aparecem aqui
              automaticamente.
            </p>
            <Link href="/noticias" className="btn btn-ghost mt-5">
              Ver comunicados
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 8) * 40}>
                <ParticipantCard
                  participant={p}
                  index={i}
                  campaignId={campaign?.id}
                  authenticated={Boolean(user)}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.74rem] font-bold uppercase tracking-wider transition",
        active
          ? "border-gold-400/60 bg-gold-400/15 text-gold-200"
          : "border-white/12 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}
