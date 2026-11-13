import { redirect } from "next/navigation";
import { can, requireAdmin } from "@/lib/services/session";
import { ParticipantEditor } from "@/components/admin/participant-editor";

export const dynamic = "force-dynamic";

/**
 * Gestão de concorrentes.
 * Lista todos os perfis (publicados e não publicados) e permite criar, editar e
 * remover. As alterações são validadas e registadas no servidor.
 */
export default async function AdminParticipantsPage() {
  const user = await requireAdmin();
  if (!can(user.role, "concorrentes.gerir")) redirect("/acesso-negado");

  // O painel precisa de ver também os perfis não publicados: usa o cliente de
  // serviço com autorização de servidor já verificada acima.
  const { listAllParticipantsForAdmin } = await import("@/lib/services/admin-data");
  const participants = await listAllParticipantsForAdmin();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Concorrentes</h1>
        <p className="mt-1 text-[0.82rem] text-white/45">
          Perfis, fotografias, biografias e estado na competição. Os dados são os únicos que o
          público vê — nada é inventado pela interface.
        </p>
      </div>

      <ParticipantEditor participants={participants} />
    </div>
  );
}
