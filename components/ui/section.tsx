import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "Ver tudo",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className="title-eyebrow mb-3 flex items-center gap-2">
            <span className="inline-block h-px w-6 bg-gold-400/70" />
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-[0.95rem] leading-relaxed text-white/55 text-balance">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.18em] text-gold-300 transition hover:text-gold-200"
        >
          {hrefLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "gold" | "green" | "rose";
}) {
  const tones = {
    default: "text-white",
    gold: "gold-text",
    green: "text-star-teal",
    rose: "text-star-rose",
  } as const;

  return (
    <div className="panel rounded-xl2 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">{label}</p>
        {icon && <span className="text-gold-400/70">{icon}</span>}
      </div>
      <p className={cn("mt-3 font-display text-3xl font-extrabold tabular-nums", tones[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 rounded-xl2 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-gold-300">
        ✦
      </div>
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <p className="max-w-md text-sm text-white/50">{description}</p>
      {action}
    </div>
  );
}

export function Coin({ className }: { className?: string }) {
  return <span className={cn("text-gold-300", className)}>✦</span>;
}
