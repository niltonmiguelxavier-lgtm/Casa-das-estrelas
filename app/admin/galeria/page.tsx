import { Upload } from "lucide-react";
import { requireAdmin, can } from "@/lib/services/session";
import { redirect } from "next/navigation";
import { listGallery } from "@/lib/services/data";
import { formatDate } from "@/lib/utils";

export default async function AdminGalleryPage() {
  const user = await requireAdmin();
  if (!can(user.role, "conteudos.galeria")) redirect("/admin");
  const items = await listGallery();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-white">Galeria</h1>
          <p className="mt-1 text-[0.82rem] text-white/45">
            Fotografias e vídeos organizados por colecção.
          </p>
        </div>
        <button className="btn btn-gold !py-2 !text-[0.76rem]">
          <Upload className="h-3.5 w-3.5" /> Carregar média
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.id} className="group overflow-hidden rounded-xl border border-white/8 bg-ink-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={i.poster ?? i.src}
              alt={i.title}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            <div className="p-2.5">
              <p className="truncate text-[0.76rem] font-semibold text-white">{i.title}</p>
              <p className="text-[0.62rem] text-white/30">
                {i.event} · {i.type} · {formatDate(i.createdAt, { day: "2-digit", month: "short" })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[0.7rem] leading-relaxed text-white/25">
        Os ficheiros são enviados para object storage (Supabase Storage) com validação de tipo e
        tamanho, geração de miniaturas e entrega por CDN. A base de dados guarda apenas metadados e
        URLs.
      </p>
    </div>
  );
}
