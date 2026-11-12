import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { PageHero, InfoBanner } from "@/components/ui/page-hero";
import { PackageCheckout } from "@/components/voting/package-checkout";
import { listPackages, listParticipants } from "@/lib/services/data";
import { getCurrentUser } from "@/lib/services/session";
import { PAYMENT_METHODS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Comprar votos",
  description:
    "Adquira pacotes de votos para apoiar o seu concorrente na Casa das Estrelas através de métodos de pagamento locais.",
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ concorrente?: string }>;
}) {
  const { concorrente } = await searchParams;
  const [packages, participants, user] = await Promise.all([
    listPackages(),
    listParticipants(),
    getCurrentUser(),
  ]);

  const available = participants.filter((p) => p.status !== "eliminado");

  return (
    <>
      <PageHero
        eyebrow="Votos adicionais"
        title="Comprar votos"
        description="Escolha o concorrente, o pacote e o método de pagamento. Os votos são creditados apenas depois da confirmação verificada do fornecedor de pagamento."
        breadcrumb={[
          { href: "/votar", label: "Votar" },
          { href: "/votar/pacotes", label: "Comprar votos" },
        ]}
        image="/media/microphone.jpg"
        size="sm"
      >
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <span
              key={m.id}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.7rem] text-white/55"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500/60" />
              {m.label}
              <span className="text-[0.58rem] uppercase tracking-wider text-white/25">
                {m.status === "previsto" ? "em integração" : m.status}
              </span>
            </span>
          ))}
        </div>
      </PageHero>

      <section className="container-page py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <PackageCheckout
            packages={packages}
            participants={available.map((p) => ({
              id: p.id,
              name: p.name,
              number: p.number,
              country: p.country,
              photo: p.photo,
            }))}
            methods={PAYMENT_METHODS.map((m) => ({ id: m.id, label: m.label, region: m.region }))}
            authenticated={Boolean(user)}
            preselected={concorrente ?? null}
          />

          <aside className="space-y-5">
            <div className="panel rounded-xl2 p-5">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white/75">
                <ShieldCheck className="h-4 w-4 text-star-teal" /> Como o pagamento é tratado
              </h3>
              <ol className="mt-3 space-y-2.5 text-[0.79rem] leading-relaxed text-white/55">
                {[
                  "Criamos uma ordem de pagamento com referência única e valor lido da base de dados.",
                  "É encaminhado para o fornecedor autorizado do método escolhido.",
                  "O fornecedor processa a transacção e envia a confirmação por webhook assinado.",
                  "O servidor verifica a assinatura, o valor e a referência antes de creditar votos.",
                  "Os votos são creditados uma única vez (idempotência) e o utilizador é notificado.",
                ].map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-star-teal/12 text-[0.6rem] font-bold text-star-teal">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <InfoBanner tone="rose" title="Sem simulações" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
              Os métodos de pagamento só ficam activos quando a integração com o fornecedor
              autorizado está homologada e configurada no servidor. Nunca creditamos votos por
              regresso a uma página de sucesso.
            </InfoBanner>

            <div className="panel rounded-xl2 p-5">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white/75">
                <Lock className="h-4 w-4 text-gold-400" /> Segurança
              </h3>
              <ul className="mt-3 space-y-2 text-[0.78rem] leading-relaxed text-white/50">
                <li>• Webhooks verificados por assinatura HMAC.</li>
                <li>• Valores e referências confirmados no servidor.</li>
                <li>• Transacções atómicas na base de dados.</li>
                <li>• Registo de auditoria de todas as operações.</li>
                <li>• Reconciliação financeira e reembolsos suportados.</li>
              </ul>
            </div>

            <p className="text-[0.68rem] leading-relaxed text-white/25">
              Ao comprar votos o utilizador aceita o{" "}
              <Link href="/regulamento" className="underline hover:text-white/50">
                regulamento
              </Link>{" "}
              e os{" "}
              <Link href="/termos" className="underline hover:text-white/50">
                termos e condições
              </Link>
              . Votos adquiridos não são reembolsáveis depois de creditados, salvo erro comprovado
              do sistema.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
