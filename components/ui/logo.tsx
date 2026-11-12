import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logótipo tipográfico Casa das Estrelas com estrela de oito pontas. */
export function Logo({
  className,
  compact = false,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string | null;
}) {
  const mark = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 shadow-[0_8px_20px_-8px_rgba(242,182,43,0.8)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink-950" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 1.6l2.05 6.02 6.02 2.05-6.02 2.05L12 17.74l-2.05-6.02L3.93 9.67l6.02-2.05L12 1.6z"
          />
          <path fill="currentColor" opacity=".55" d="M12 17.74l1.2 3.53 1.54.53-1.54.52L12 25.9l-1.2-3.58-1.54-.52 1.54-.53L12 17.74z" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-extrabold tracking-[0.14em] text-white">
            Casa das
          </span>
          <span className="font-display text-[15px] font-extrabold tracking-[0.28em] gold-text">
            Estrelas
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} aria-label="Casa das Estrelas — página inicial" className="group">
      {mark}
    </Link>
  );
}

/** Avatar com iniciais — usado quando não existe fotografia carregada. */
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-ink-700 font-semibold text-gold-200",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        letters
      )}
    </span>
  );
}
