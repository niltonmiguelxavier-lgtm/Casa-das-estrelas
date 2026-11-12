import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
  image = "/media/spotlights.jpg",
  children,
  align = "left",
  size = "md",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: { href: string; label: string }[];
  image?: string;
  children?: React.ReactNode;
  align?: "left" | "center";
  size?: "sm" | "md" | "lg";
}) {
  const heights = {
    sm: "pt-14 pb-12 md:pt-20 md:pb-16",
    md: "pt-16 pb-14 md:pt-24 md:pb-20",
    lg: "pt-20 pb-20 md:pt-32 md:pb-28",
  };

  return (
    <section className={cn("relative overflow-hidden border-b border-white/8", heights[size])}>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" aria-hidden className="h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#05060a_8%,rgba(5,6,10,0.88)_45%,rgba(5,6,10,0.72))]" />
        <div className="absolute inset-0 noise" />
      </div>

      <div
        className={cn(
          "container-page relative",
          align === "center" && "text-center",
        )}
      >
        {breadcrumb && (
          <nav aria-label="Trilha de navegação" className="mb-5 flex flex-wrap items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-white/35">
            <Link href="/" className="hover:text-gold-300">
              Início
            </Link>
            {breadcrumb.map((b) => (
              <span key={b.href} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-white/20" />
                <Link href={b.href} className="hover:text-gold-300">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <p className={cn("title-eyebrow flex items-center gap-2", align === "center" && "justify-center")}>
            <span className="inline-block h-px w-6 bg-gold-400/70" />
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 max-w-3xl font-display text-[2.2rem] font-black leading-[0.98] tracking-tight text-white sm:text-[3rem] md:text-[3.4rem]">
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-white/55 md:text-base",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}

/** Layout para páginas institucionais/legais. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        max-w-3xl
        [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[1.35rem] [&_h2]:font-extrabold [&_h2]:text-white
        [&_h2:first-child]:mt-0
        [&_h3]:mt-7 [&_h3]:text-[1rem] [&_h3]:font-bold [&_h3]:text-white
        [&_p]:mt-3 [&_p]:text-[0.92rem] [&_p]:leading-[1.75] [&_p]:text-white/60
        [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:marker:text-gold-500
        [&_ol]:mt-3 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:marker:text-gold-500
        [&_li]:text-[0.92rem] [&_li]:leading-[1.7] [&_li]:text-white/60
        [&_a]:text-gold-300 [&_a]:underline [&_a]:decoration-gold-500/30 [&_a:hover]:text-gold-200
        [&_strong]:text-white/85 [&_strong]:font-semibold
        [&_blockquote]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:border-gold-500/50 [&_blockquote]:pl-4 [&_blockquote]:text-white/50 [&_blockquote]:italic
      "
    >
      {children}
    </div>
  );
}

export function InfoBanner({
  tone = "gold",
  title,
  children,
  icon,
}: {
  tone?: "gold" | "rose" | "teal";
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const tones = {
    gold: "border-gold-400/25 bg-gold-400/[0.06] text-gold-100",
    rose: "border-star-rose/25 bg-star-rose/[0.06] text-rose-100",
    teal: "border-star-teal/25 bg-star-teal/[0.06] text-teal-100",
  };
  return (
    <div className={cn("rounded-xl2 border p-4 md:p-5", tones[tone])}>
      <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.16em]">
        {icon}
        {title}
      </p>
      <div className="mt-2 text-[0.85rem] leading-relaxed text-white/60">{children}</div>
    </div>
  );
}
