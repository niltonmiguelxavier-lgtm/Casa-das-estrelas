export function SponsorMarquee({ items }: { items: { name: string; tier: string }[] }) {
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-white/8 bg-ink-900/60 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-950 to-transparent" />
      <div className="marquee-track items-center gap-12 px-6">
        {doubled.map((s, i) => (
          <span
            key={`${s.name}-${i}`}
            className="flex shrink-0 items-center gap-4 text-white/25 transition hover:text-white/60"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-[0.6rem] font-bold">
              ✦
            </span>
            <span className="whitespace-nowrap font-display text-[0.8rem] font-bold uppercase tracking-[0.2em]">
              {s.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
