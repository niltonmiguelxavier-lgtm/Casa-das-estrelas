import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/session";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: true, demo: true });

  const { error } = await supabase
    .from("notification_recipients")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}
