import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/session";
import { recordAudit } from "@/lib/services/audit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = updateProfileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ ok: false, message: "Dados inválidos." }, { status: 422 });

  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return NextResponse.json({ ok: false, message: "Serviço indisponível." }, { status: 503 });

  const { error } = await supabase
    .from("user_profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      country: parsed.data.country,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ ok: false }, { status: 400 });

  await recordAudit({
    action: "auth.login",
    actorId: user.id,
    entity: "user_profiles",
    metadata: { event: "profile.updated" },
  });

  return NextResponse.json({ ok: true });
}
