"use client";

import { useEffect, useState } from "react";

/**
 * Contagem decrescente para o encerramento da votação.
 * O valor só é calculado no cliente (evita divergência de hidratação) e o
 * componente não é apresentado quando não existe uma data real de fim.
 */
export function VoteCountdown({ target, compact = false }: { target: string; compact?: boolean }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const value = left ?? 0;
  const cells = [
    { v: Math.floor(value / 86_400_000), l: "dias" },
    { v: Math.floor((value % 86_400_000) / 3_600_000), l: "horas" },
    { v: Math.floor((value % 3_600_000) / 60_000), l: "min" },
    { v: Math.floor((value % 60_000) / 1000), l: "seg" },
  ];

  if (compact) {
    return (
      <p className="font-display text-[0.95rem] font-bold tabular-nums text-white" suppressHydrationWarning>
        {left === null
          ? "—"
          : cells
              .slice(0, 3)
              .map((c) => `${String(c.v).padStart(2, "0")}${c.l[0]}`)
              .join(" ")}
      </p>
    );
  }

  return (
    <div className="flex items-end gap-4 sm:gap-5">
      {cells.map((c) => (
        <div key={c.l} className="min-w-[3rem]">
          <p
            className="font-display text-[1.7rem] font-black tabular-nums leading-none text-white sm:text-[2.1rem]"
            suppressHydrationWarning
          >
            {left === null ? "--" : String(c.v).padStart(2, "0")}
          </p>
          <p className="mt-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/35">
            {c.l}
          </p>
        </div>
      ))}
    </div>
  );
}
