import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Share2, User } from "lucide-react";
import { NewsCard } from "@/components/news/news-card";
import { getNewsPost, listNews } from "@/lib/services/data";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) return { title: "Notícia" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: post.cover }],
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getNewsPost(slug), listNews(20)]);
  if (!post) notFound();

  const related = all.filter((n) => n.slug !== post.slug).slice(0, 3);

  return (
    <article>
      <header className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt="" aria-hidden className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,#05060a_8%,rgba(5,6,10,0.85))]" />
        </div>
        <div className="container-page relative py-12 md:py-20">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white/40 hover:text-gold-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Notícias
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="badge badge-gold">{post.category}</span>
            {post.pinned && <span className="badge badge-live">comunicado oficial</span>}
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-[2rem] font-black leading-[1.05] tracking-tight text-white sm:text-[2.8rem]">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-[0.72rem] uppercase tracking-wider text-white/40">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> conteúdo oficial
            </span>
          </div>
        </div>
      </header>

      <div className="container-page py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="overflow-hidden rounded-xl2 border border-white/8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover}
                alt={post.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
            <p className="mt-7 border-l-2 border-gold-500/50 pl-4 text-[1.02rem] font-medium leading-relaxed text-white/70">
              {post.excerpt}
            </p>
            <div className="mt-7 space-y-4 text-[0.95rem] leading-[1.8] text-white/60">
              {post.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/votar" className="btn btn-gold">
                Votar agora
              </Link>
              <Link href="/concorrentes" className="btn btn-ghost">
                Ver concorrentes
              </Link>
            </div>
          </div>

          <aside>
            <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/35">
              Mais notícias
            </h2>
            <div className="mt-3 space-y-1">
              {related.map((n) => (
                <NewsCard key={n.id} post={n} variant="compact" />
              ))}
            </div>
            <div className="panel mt-6 rounded-xl2 p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold-400">
                Comunicados oficiais
              </p>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-white/50">
                Apenas o conteúdo publicado nesta área é considerado oficial. Informações de
                terceiros não vinculam a produção do programa.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
