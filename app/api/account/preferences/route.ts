import { NextResponse } from "next/server";
import { notificationPreferencesSchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/session";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = notificationPreferencesSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 422 });

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: true, demo: true });

  // Avisos essenciais (segurança/transacções) nunca podem ser desactivados no servidor.
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      in_app: parsed.data.inApp,
      email: parsed.data.email,
      push: parsed.data.push,
      sms: parsed.data.sms,
      whatsapp: parsed.data.whatsapp,
      vote_alerts: parsed.data.voteAlerts,
      news_alerts: parsed.data.newsAlerts,
      payment_alerts: true,
      security_alerts: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}
