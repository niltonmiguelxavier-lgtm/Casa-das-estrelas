import { NextResponse } from "next/server";
import { getParticipant } from "@/lib/services/data";

export const dynamic = "force-dynamic";

/** Dados públicos mínimos de um concorrente (usado para restaurar a intenção de voto). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await getParticipant(id);
  if (!participant) return NextResponse.json({ participant: null }, { status: 404 });

  return NextResponse.json(
    {
      participant: {
        id: participant.id,
        name: participant.name,
        number: participant.number,
        country: participant.country,
        photo: participant.photo,
      },
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
