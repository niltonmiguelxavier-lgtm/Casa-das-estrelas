import { redirect } from "next/navigation";
import { can, requireAdmin } from "@/lib/services/session";
import { listAllNewsForAdmin } from "@/lib/services/admin-data";
import { NewsEditor } from "@/components/admin/news-editor";

export const dynamic = "force-dynamic";

/**
 * Gestão de notícias.
 * Criar, editar, publicar e remover — com validação e auditoria no servidor.
 */
export default async function AdminContentPage() {
  const user = await requireAdmin();
  if (!can(user.role, "conteudos.noticias")) redirect("/acesso-negado");

  const news = await listAllNewsForAdmin();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Conteúdos</h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Notícias e comunicados oficiais. Uma publicação só aparece no site depois de estar
          marcada como «Publicado».
        </p>
      </div>

      <NewsEditor news={news} />
    </div>
  );
}
