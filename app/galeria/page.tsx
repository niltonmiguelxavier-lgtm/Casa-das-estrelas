import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { listGallery } from "@/lib/services/data";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Galeria",
  description:
    "Fotografias e vídeos oficiais da Casa das Estrelas — galas, bastidores, ensaios e momentos do programa.",
};

export default async function GalleryPage() {
  const items = await listGallery();
  const events = Array.from(new Set(items.map((i) => i.event)));

  return (
    <>
      <PageHero
        eyebrow="Multimédia"
        title="Galeria oficial"
        description="Os momentos que marcam a edição: galas, bastidores, ensaios e conteúdos especiais em fotografia e vídeo."
        breadcrumb={[{ href: "/galeria", label: "Galeria" }]}
        image="/media/spotlights.jpg"
        size="sm"
      >
        <div className="flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-wider text-white/40">
          <span className="badge badge-muted">{items.filter((i) => i.type === "foto").length} fotografias</span>
          <span className="badge badge-muted">{items.filter((i) => i.type === "video").length} vídeos</span>
          <span className="badge badge-muted">{events.length} colecções</span>
        </div>
      </PageHero>

      <section className="container-page py-12 md:py-16">
        <GalleryGrid items={items} events={events} />
      </section>
    </>
  );
}
