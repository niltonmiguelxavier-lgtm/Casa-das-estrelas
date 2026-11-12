import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/services/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: true, demo: true });

  // RLS garante que o utilizador só altera as suas próprias linhas.
  const { error } = await supabase
    .from("notification_recipients")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}
