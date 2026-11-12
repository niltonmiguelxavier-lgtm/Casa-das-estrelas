"use client";

import { useMemo, useState } from "react";
import { Search, Heart } from "lucide-react";
import { Avatar } from "@/components/ui/logo";
import { VoteDialog } from "@/components/voting/vote-dialog";
import { CountryCode } from "@/components/ui/country-tag";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  name: string;
  number: number;
  country: string;
  photo: string | null;
  status: string;
}

export function VotePicker({
  participants,
  campaignId,
  authenticated,
  freeVotesPerUser,
}: {
  participants: Option[];
  campaignId?: string;
  authenticated: boolean;
  freeVotesPerUser: number;
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<"todos" | "Angola" | "Moçambique">("todos");
  const [selected, setSelected] = useState<Option | null>(null);

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        String(p.number).includes(query);
      const matchCountry = country === "todos" || p.country === country;
      return matchQuery && matchCountry;
    });
  }, [participants, query, country]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar concorrente ou número…"
            className="field !pl-9"
            aria-label="Procurar concorrente"
          />
        </label>
        <div className="flex gap-1.5">
          {(["todos", "Angola", "Moçambique"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={cn(
                "rounded-lg border px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider transition",
                country === c
                  ? "border-gold-400/50 bg-gold-400/12 text-gold-200"
                  : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white",
              )}
            >
              {c === "todos" ? "Todos" : <CountryCode country={c} />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="group flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.025] p-2.5 text-left transition hover:border-gold-400/40 hover:bg-white/[0.06]"
          >
            <Avatar name={p.name} src={p.photo} size={38} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8rem] font-semibold text-white group-hover:text-gold-100">
                {p.name}
              </span>
              <span className="flex items-center gap-1 text-[0.62rem] uppercase tracking-wide text-white/35">
                Nº {String(p.number).padStart(2, "0")} <CountryCode country={p.country} />
              </span>
            </span>
            <Heart className="h-3.5 w-3.5 shrink-0 text-white/15 transition group-hover:text-gold-400" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-white/40">
            Nenhum concorrente encontrado.
          </p>
        )}
      </div>

      {selected && (
        <VoteDialog
          open
          onClose={() => setSelected(null)}
          participant={selected}
          campaignId={campaignId}
          authenticated={authenticated}
          freeVotesPerUser={freeVotesPerUser}
        />
      )}
    </div>
  );
}
