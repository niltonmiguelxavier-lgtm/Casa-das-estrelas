import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { NewsPost } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function NewsCard({
  post,
  variant = "default",
  className,
}: {
  post: NewsPost;
  variant?: "default" | "feature" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <Link
        href={`/noticias/${post.slug}`}
        className="group flex gap-3 rounded-lg p-2 transition hover:bg-white/[0.04]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover}
          alt=""
          className="h-14 w-20 shrink-0 rounded-md object-cover"
          loading="lazy"
        />
        <span className="min-w-0">
          <span className="text-[0.58rem] font-bold uppercase tracking-widest text-gold-400">
            {post.category}
          </span>
          <span className="mt-0.5 block line-clamp-2 text-[0.78rem] font-semibold leading-snug text-white/85 group-hover:text-white">
            {post.title}
          </span>
        </span>
      </Link>
    );
  }

  if (variant === "feature") {
    return (
      <Link
        href={`/noticias/${post.slug}`}
        className={cn("card group relative block min-h-[380px] overflow-hidden", className)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover}
          alt={post.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />
        <div className="relative flex h-full min-h-[380px] flex-col justify-end p-6">
          <div className="flex items-center gap-2">
            <span className="badge badge-gold">{post.category}</span>
            {post.pinned && <span className="badge badge-live">destaque</span>}
          </div>
          <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white md:text-[1.9rem]">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 max-w-lg text-[0.86rem] leading-relaxed text-white/60">
            {post.excerpt}
          </p>
          <div className="mt-4 flex items-center gap-3 text-[0.66rem] uppercase tracking-wider text-white/35">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" /> {formatDate(post.publishedAt)}
            </span>
            <span>·</span>
            <span>{post.author}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/noticias/${post.slug}`} className={cn("card group flex flex-col", className)}>
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent opacity-60" />
        <span className="badge badge-gold absolute left-3 top-3 backdrop-blur">{post.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[1.02rem] font-bold leading-snug text-white group-hover:text-gold-100">
          {post.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-[0.8rem] leading-relaxed text-white/45">
          {post.excerpt}
        </p>
        <div className="mt-3 flex items-center justify-between text-[0.62rem] uppercase tracking-wider text-white/30">
          <span>{formatDate(post.publishedAt, { day: "2-digit", month: "short" })}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-gold-400/60 transition group-hover:translate-x-0.5 group-hover:text-gold-300" />
        </div>
      </div>
    </Link>
  );
}
