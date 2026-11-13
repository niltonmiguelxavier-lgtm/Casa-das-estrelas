import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { listGallery } from "@/lib/services/data";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Galeria e vídeos",
  description: "Fotografias, actuações e bastidores oficiais da Casa das Estrelas.",
};

/**
 * Galeria pública.
 * Fotografias e vídeos publicados pela produção. Sem conteúdo de exemplo: se a
 * galeria estiver vazia, o estado é apresentado de forma explícita.
 */
export default async function GalleryPage() {
  const items = await listGallery();
  const videos = items.filter((i) => i.type === "video");
  const photos = items.filter((i) => i.type === "foto");

  return (
    <>
      <PageHero
        eyebrow="Multimédia"
        title="Galeria"
        description="Actuações, bastidores e os momentos decisivos de cada gala — fotografias e vídeos oficiais do programa."
        breadcrumb={[{ href: "/galeria", label: "Galeria" }]}
        size="sm"
      />

      <section className="container-page py-12 md:py-16">
        {items.length === 0 ? (
          <div className="border border-dashed border-white/12 px-6 py-16 text-center">
            <p className="font-display text-lg font-bold uppercase text-white">
              A galeria ainda não tem conteúdo publicado
            </p>
            <p className="mx-auto mt-2 max-w-md text-[0.86rem] leading-relaxed text-white/45">
              As fotografias e os vídeos são publicados pela produção depois de cada gala. Os
              ficheiros ficam em object storage e são servidos por CDN.
            </p>
            <Link href="/noticias" className="btn btn-ghost mt-6">
              Ver comunicados oficiais
            </Link>
          </div>
        ) : (
          <div className="space-y-14">
            <section>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="display-3 text-white">Vídeos</h2>
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/30">
                  {videos.length} publicados
                </span>
              </div>
              {videos.length > 0 ? (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((v) => (
                    <li key={v.id}>
                      <div className="relative overflow-hidden bg-ink-850">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.poster ?? v.src}
                          alt=""
                          className="aspect-video w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="mt-2.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-gold-400">
                        {v.event}
                      </p>
                      <p className="mt-1 font-display text-[0.92rem] font-bold uppercase leading-snug text-white">
                        {v.title}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 border border-white/8 px-4 py-6 text-[0.84rem] text-white/40">
                  Ainda não existem vídeos publicados.
                </p>
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="display-3 text-white">Fotografias</h2>
                <span className="text-[0.66rem] uppercase tracking-[0.16em] text-white/30">
                  {photos.length} publicadas
                </span>
              </div>
              {photos.length > 0 ? (
                <div className="mt-6">
                  <GalleryGrid items={photos} />
                </div>
              ) : (
                <p className="mt-4 border border-white/8 px-4 py-6 text-[0.84rem] text-white/40">
                  Ainda não existem fotografias publicadas.
                </p>
              )}
            </section>
          </div>
        )}
      </section>
    </>
  );
}
