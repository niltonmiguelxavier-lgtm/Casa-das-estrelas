import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Minus, Trophy } from "lucide-react";
import type { RankingRow } from "@/lib/types";
import { Avatar } from "@/components/ui/logo";
import { CountryCode } from "@/components/ui/country-tag";
import { cn, formatCompact, formatNumber } from "@/lib/utils";

export function RankingTable({
  rows,
  limit = 10,
  showVotes = true,
  compact = false,
}: {
  rows: RankingRow[];
  limit?: number;
  showVotes?: boolean;
  compact?: boolean;
}) {
  const visible = rows.slice(0, limit);
  const max = Math.max(...visible.map((r) => r.votes), 1);

  return (
    <div className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/70">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold-400" />
          <h3 className="text-[0.8rem] font-bold uppercase tracking-[0.14em] text-white">
            Classificação
          </h3>
        </div>
        <span className="badge badge-muted !text-[0.55rem]">provisória</span>
      </div>
      <ul className="divide-y divide-white/5">
        {visible.map((row) => {
          const pct = Math.round((row.votes / max) * 100);
          return (
            <li key={row.participantId}>
              <Link
                href={`/concorrentes/${row.participantId}`}
                className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.03]"
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-md font-display text-[0.7rem] font-extrabold tabular-nums",
                    row.position === 1
                      ? "bg-gold-400 text-ink-950"
                      : row.position <= 3
                        ? "bg-gold-400/18 text-gold-200"
                        : "bg-white/5 text-white/45",
                  )}
                >
                  {row.position}
                </span>

                <Avatar name={row.name} src={row.photo} size={compact ? 26 : 30} />

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-[0.84rem] font-semibold text-white group-hover:text-gold-200">
                      {row.name}
                    </span>
                    <span className="flex items-center gap-1 text-[0.62rem] uppercase tracking-wider text-white/30">
                      <CountryCode country={row.country} /> {String(row.number).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-white/6">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </span>

                {showVotes && (
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-[0.82rem] font-extrabold tabular-nums text-white">
                      {compact ? formatCompact(row.votes) : formatNumber(row.votes)}
                    </span>
                    <span className="text-[0.55rem] uppercase tracking-wider text-white/30">
                      votos
                    </span>
                  </span>
                )}

                <Variation value={row.variation} />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/classificacao"
        className="flex items-center justify-center gap-2 border-t border-white/8 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-gold-300 transition hover:bg-white/[0.03]"
      >
        Classificação completa <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function Variation({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded text-white/25" title="sem alteração">
        <Minus className="h-3 w-3" />
      </span>
    );
  const up = value > 0;
  return (
    <span
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center rounded",
        up ? "text-star-teal" : "text-star-rose",
      )}
      title={up ? `subiu ${value}` : `desceu ${Math.abs(value)}`}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
    </span>
  );
}
