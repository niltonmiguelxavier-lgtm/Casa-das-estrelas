import Link from "next/link";
import { Heart, Wallet } from "lucide-react";
import { getUserVotes, getVoteBalance } from "@/lib/services/user-data";
import { requireUser } from "@/lib/services/session";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const metadata = { title: "Histórico de votos" };

export default async function VotesHistoryPage() {
  await requireUser("/painel/votos");
  const [votes, balance] = await Promise.all([getUserVotes(100), getVoteBalance()]);
  const free = votes.filter((v) => v.type === "gratuito").reduce((a, v) => a + v.quantity, 0);
  const paid = votes.filter((v) => v.type === "pago").reduce((a, v) => a + v.quantity, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/35">
            Votos gratuitos dados
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-white">{formatNumber(free)}</p>
        </div>
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/35">
            Votos pagos dados
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-gold-200">{formatNumber(paid)}</p>
        </div>
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/35">
            Saldo disponível
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-star-teal">
            {formatNumber(balance.free + balance.paid)}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5">
          <h1 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            Histórico de votos
          </h1>
          <div className="flex gap-2">
            <Link href="/votar" className="btn btn-gold !py-1.5 !text-[0.72rem]">
              <Heart className="h-3.5 w-3.5" /> Votar
            </Link>
            <Link href="/votar/pacotes" className="btn btn-ghost !py-1.5 !text-[0.72rem]">
              <Wallet className="h-3.5 w-3.5" /> Comprar votos
            </Link>
          </div>
        </header>

        <div className="hidden grid-cols-[1fr_120px_90px_150px] gap-3 border-b border-white/6 px-5 py-2 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-white/25 md:grid">
          <span>Concorrente</span>
          <span>Tipo</span>
          <span className="text-right">Votos</span>
          <span className="text-right">Data</span>
        </div>

        <ul className="divide-y divide-white/5">
          {votes.length === 0 && (
            <li className="px-5 py-14 text-center text-[0.85rem] text-white/40">
              Ainda não registou votos nesta campanha.
            </li>
          )}
          {votes.map((v) => (
            <li
              key={v.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 md:grid-cols-[1fr_120px_90px_150px]"
            >
              <div className="min-w-0">
                <Link
                  href={`/concorrentes/${v.participantId}`}
                  className="block truncate text-[0.86rem] font-semibold text-white hover:text-gold-200"
                >
                  {v.participantName}
                </Link>
                <span className="text-[0.66rem] text-white/30">{v.campaign}</span>
              </div>
              <span className="hidden md:block">
                <span className={`badge ${v.type === "pago" ? "badge-gold" : "badge-muted"}`}>
                  {v.type}
                </span>
              </span>
              <span className="text-right font-display text-[0.86rem] font-bold tabular-nums text-white">
                +{v.quantity}
              </span>
              <span className="hidden text-right text-[0.7rem] text-white/35 md:block">
                {formatDateTime(v.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[0.7rem] leading-relaxed text-white/25">
        Cada voto é registado com data, hora, campanha e conta. Este histórico é pessoal e apenas
        visível para si. Em caso de dúvida, contacte o apoio indicando a data e o concorrente.
      </p>
    </div>
  );
}
