import { NextResponse } from "next/server";
import { listNotifications } from "@/lib/services/notifications";
import { getCurrentUser } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: [] }, { status: 401 });

  const notifications = await listNotifications(50);
  return NextResponse.json(
    { notifications, unread: notifications.filter((n) => !n.read).length },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
