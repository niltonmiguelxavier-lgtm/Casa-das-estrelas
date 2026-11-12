import Link from "next/link";
import { PenLine, Plus } from "lucide-react";
import { requireAdmin, can } from "@/lib/services/session";
import { redirect } from "next/navigation";
import { listNews } from "@/lib/services/data";
import { formatDateTime } from "@/lib/utils";

export default async function AdminContentPage() {
  const user = await requireAdmin();
  if (!can(user.role, "conteudos.noticias")) redirect("/admin");
  const news = await listNews(50);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-white">Conteúdos</h1>
          <p className="mt-1 text-[0.82rem] text-white/45">
            Notícias, comunicados, categorias e páginas institucionais.
          </p>
        </div>
        <button className="btn btn-gold !py-2 !text-[0.76rem]">
          <Plus className="h-3.5 w-3.5" /> Nova publicação
        </button>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-white/8 bg-ink-900/60">
        <div className="hidden grid-cols-[1fr_130px_120px_150px_90px] gap-3 border-b border-white/6 px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/25 md:grid">
          <span>Título</span>
          <span>Categoria</span>
          <span>Estado</span>
          <span>Publicado</span>
          <span className="text-right">Acções</span>
        </div>
        <ul className="divide-y divide-white/5">
          {news.map((n) => (
            <li
              key={n.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[1fr_130px_120px_150px_90px]"
            >
              <div className="min-w-0">
                <Link
                  href={`/noticias/${n.slug}`}
                  className="block truncate text-[0.82rem] font-semibold text-white hover:text-gold-200"
                >
                  {n.title}
                </Link>
                <span className="text-[0.64rem] text-white/30">/{n.slug}</span>
              </div>
              <span className="hidden md:block">
                <span className="badge badge-muted !text-[0.55rem]">{n.category}</span>
              </span>
              <span className="hidden md:block">
                <span className="badge badge-green">publicado</span>
              </span>
              <span className="hidden text-[0.68rem] text-white/30 md:block">
                {formatDateTime(n.publishedAt)}
              </span>
              <span className="text-right">
                <button className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[0.64rem] text-white/50 hover:border-gold-400/40 hover:text-white">
                  <PenLine className="h-3 w-3" /> Editar
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "Categorias", d: "Comunicado, Programa, Eliminação, Anúncio, Imprensa" },
          { t: "Páginas institucionais", d: "Programa, Regulamento, Prémios, Termos, Privacidade, Cookies" },
          { t: "Media", d: "Imagens em object storage com optimização automática e CDN" },
        ].map((c) => (
          <div key={c.t} className="panel rounded-xl2 p-4">
            <p className="text-[0.8rem] font-semibold text-white">{c.t}</p>
            <p className="mt-1 text-[0.72rem] leading-relaxed text-white/40">{c.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
