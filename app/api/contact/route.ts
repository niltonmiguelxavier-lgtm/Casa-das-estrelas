import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/services/rate-limit";
import { recordAudit } from "@/lib/services/audit";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().toLowerCase().email(),
  subject: z.enum(["apoio", "pagamento", "imprensa", "parceria", "dados"]),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req.headers, "contact"), {
    limit: 5,
    windowMs: 900_000,
    blockMs: 900_000,
  });
  if (!limit.success)
    return NextResponse.json(
      { ok: false, message: "Demasiadas mensagens enviadas. Tente novamente mais tarde." },
      { status: 429 },
    );

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Pedido inválido." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, message: "Verifique os campos do formulário." },
      { status: 422 },
    );

  const admin = await getSupabaseAdminClient();
  if (admin) {
    await admin.from("system_events").insert({
      type: "contact.message",
      payload: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });
  }

  await recordAudit({
    action: "admin.export",
    entity: "contact",
    metadata: { subject: parsed.data.subject },
    severity: "info",
  });

  return NextResponse.json({
    ok: true,
    message:
      "Recebemos a sua mensagem. A equipa de apoio responde em dias úteis para o email indicado.",
  });
}
