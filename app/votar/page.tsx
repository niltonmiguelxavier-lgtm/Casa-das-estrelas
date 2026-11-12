import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Heart, Info, ShieldCheck, Wallet } from "lucide-react";
import { PageHero, InfoBanner } from "@/components/ui/page-hero";
import { VotePicker } from "@/components/voting/vote-picker";
import { getActiveCampaign, listPackages, listParticipants } from "@/lib/services/data";
import { getCurrentUser } from "@/lib/services/session";
import { daysLeft, formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Votar",
  description:
    "Vote gratuitamente no seu concorrente favorito da Casa das Estrelas ou adquira pacotes de votos.",
};

export default async function VotePage() {
  const [participants, campaign, packages, user] = await Promise.all([
    listParticipants(),
    getActiveCampaign(),
    listPackages(),
    getCurrentUser(),
  ]);

  const active = participants.filter((p) => p.status !== "eliminado");
  const endsAt = campaign?.endsAt ?? new Date(Date.now() + 5 * 86_400_000).toISOString();

  return (
    <>
      <PageHero
        eyebrow="Votação oficial"
        title="O seu voto decide"
        description="Todos os votos são validados no servidor, registados com data e hora, e contabilizados na classificação oficial do programa."
        breadcrumb={[{ href: "/votar", label: "Votar" }]}
        image="/media/voting.jpg"
      >
        <div className="flex flex-wrap items-center gap-3 text-[0.78rem]">
          <span className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-white/65">
            <Clock className="h-3.5 w-3.5 text-gold-400" />
            {campaign?.name ?? "Campanha não activa"}
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-white/65">
            Encerra em {daysLeft(endsAt)} dias · {formatDate(endsAt, { day: "2-digit", month: "short" })}
          </span>
          <span className="flex items-center gap-2 rounded-full border border-star-teal/25 bg-star-teal/10 px-3.5 py-1.5 text-teal-200">
            <ShieldCheck className="h-3.5 w-3.5" /> validação no servidor
          </span>
        </div>
      </PageHero>

      <section className="container-page py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-white">
                  Escolha o concorrente
                </h2>
                <p className="mt-1 text-[0.85rem] text-white/45">
                  {user
                    ? `Sessão iniciada como ${user.fullName}.`
                    : "Pode explorar livremente. Para votar é necessário iniciar sessão."}
                </p>
              </div>
              <Link href="/votar/pacotes" className="btn btn-ghost !py-2 !text-[0.78rem]">
                <Wallet className="h-4 w-4" /> Comprar votos
              </Link>
            </div>

            <VotePicker
              participants={active.map((p) => ({
                id: p.id,
                name: p.name,
                number: p.number,
                country: p.country,
                photo: p.photo,
                status: p.status,
              }))}
              campaignId={campaign?.id}
              authenticated={Boolean(user)}
              freeVotesPerUser={campaign?.freeVotesPerUser ?? 5}
            />
          </div>

          <aside className="space-y-5">
            <div className="panel rounded-xl2 p-5">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white/75">
                <Info className="h-4 w-4 text-gold-400" /> Como funciona
              </h3>
              <ol className="mt-3 space-y-3">
                {campaign?.rules.map((rule, i) => (
                  <li key={i} className="flex gap-2.5 text-[0.8rem] leading-relaxed text-white/55">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-400/12 text-[0.62rem] font-bold text-gold-300">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ol>
            </div>

            <InfoBanner tone="gold" title="Limite de votos" icon={<Heart className="h-3.5 w-3.5" />}>
              Cada conta dispõe de <strong className="text-white">{campaign?.freeVotesPerUser ?? 5} votos gratuitos</strong>{" "}
              por {campaign?.frequency === "diaria" ? "dia" : "campanha"}. O limite é verificado no
              servidor a cada voto.
            </InfoBanner>

            <div className="panel rounded-xl2 p-5">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/75">
                Pacotes de votos
              </h3>
              <ul className="mt-3 space-y-2">
                {packages.slice(0, 4).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2"
                  >
                    <span className="text-[0.8rem] text-white/70">
                      {p.votes} votos
                      {p.bonusLabel && (
                        <span className="ml-1.5 text-[0.62rem] uppercase tracking-wide text-star-teal">
                          +oferta
                        </span>
                      )}
                    </span>
                    <span className="font-display text-[0.8rem] font-bold text-gold-200">
                      {formatCurrency(p.price, p.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/votar/pacotes" className="btn btn-ghost mt-4 w-full !py-2 !text-[0.78rem]">
                Ver todos os pacotes
              </Link>
            </div>

            <p className="text-[0.68rem] leading-relaxed text-white/25">
              A votação é pessoal e não transferível. Contas com comportamento abusivo podem ser
              suspensas, conforme o regulamento. Consulte os{" "}
              <Link href="/termos" className="underline hover:text-white/50">
                termos
              </Link>
              .
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
