import { redirect } from "next/navigation";
import { can, requireAdmin } from "@/lib/services/session";
import { listAllGalleryForAdmin } from "@/lib/services/admin-data";
import { GalleryEditor } from "@/components/admin/gallery-editor";

export const dynamic = "force-dynamic";

/**
 * Gestão da galeria (fotografias e vídeos).
 * Os ficheiros são referenciados por URL (object storage + CDN); a base de dados
 * guarda apenas metadados.
 */
export default async function AdminGalleryPage() {
  const user = await requireAdmin();
  if (!can(user.role, "conteudos.galeria")) redirect("/acesso-negado");

  const items = await listAllGalleryForAdmin();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Galeria</h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Fotografias e vídeos do programa. Ficheiros pesados ficam no object storage — aqui
          guarda-se apenas o endereço e os metadados.
        </p>
      </div>

      <GalleryEditor items={items} />
    </div>
  );
}
