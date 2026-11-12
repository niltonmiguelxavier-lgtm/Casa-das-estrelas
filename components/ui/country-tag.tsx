import { cn } from "@/lib/utils";

const CODES: Record<string, string> = {
  Angola: "AO",
  Moçambique: "MZ",
  "Outros países": "··",
};

/**
 * Identificador de país baseado em código ISO (sem depender de fontes de emoji).
 */
export function CountryCode({ country, className }: { country: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid h-[15px] min-w-[22px] place-items-center rounded-[3px] border border-white/15 bg-white/[0.07] px-1 font-display text-[0.52rem] font-extrabold leading-none tracking-[0.06em] text-white/60",
        className,
      )}
      aria-label={country}
      title={country}
    >
      {CODES[country] ?? "··"}
    </span>
  );
}

export function CountryLabel({
  country,
  className,
  showName = true,
}: {
  country: string;
  className?: string;
  showName?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CountryCode country={country} />
      {showName && <span>{country}</span>}
    </span>
  );
}
