import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { NewsCard } from "@/components/news/news-card";
import { listNews } from "@/lib/services/data";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Notícias",
  description:
    "Notícias, comunicados oficiais, eliminações e actualizações do reality show Casa das Estrelas.",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const news = await listNews(60);
  const categories = ["Todas", ...Array.from(new Set(news.map((n) => n.category)))];
  const active = categoria && categories.includes(categoria) ? categoria : "Todas";
  const filtered = active === "Todas" ? news : news.filter((n) => n.category === active);
  const [lead, ...rest] = filtered;

  return (
    <>
      <PageHero
        eyebrow="Sala de imprensa"
        title="Notícias e comunicados"
        description="Toda a informação oficial do programa num único lugar. Comunicados, eliminações, anúncios e actualizações da produção."
        breadcrumb={[{ href: "/noticias", label: "Notícias" }]}
        image="/media/atmosphere.jpg"
        size="sm"
      >
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <Link
              key={c}
              href={c === "Todas" ? "/noticias" : `/noticias?categoria=${encodeURIComponent(c)}`}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wider transition",
                active === c
                  ? "border-gold-400/60 bg-gold-400/15 text-gold-200"
                  : "border-white/12 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white",
              )}
            >
              {c}
            </Link>
          ))}
        </div>
      </PageHero>

      <section className="container-page py-12 md:py-16">
        {filtered.length === 0 ? (
          <div className="panel rounded-xl2 py-16 text-center">
            <p className="font-display text-lg font-bold text-white">Sem publicações nesta categoria</p>
            <p className="mt-2 text-sm text-white/45">
              Acompanhe esta área para novas actualizações oficiais.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            {lead && <NewsCard post={lead} variant="feature" className="lg:sticky lg:top-24" />}
            <div className="grid gap-5 sm:grid-cols-2">
              {rest.map((post) => (
                <NewsCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
