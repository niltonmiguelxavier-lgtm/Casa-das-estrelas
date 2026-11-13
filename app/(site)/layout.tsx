import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { getCurrentUser } from "@/lib/services/session";
import { listNotifications } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

/**
 * Layout do site público.
 * Carrega a sessão e as notificações do utilizador (RLS) para o cabeçalho.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const notifications = user ? await listNotifications(8) : [];

  return (
    <NotificationProvider initial={notifications} userId={user?.id ?? null}>
      <SiteHeader isAuthenticated={Boolean(user)} userName={user?.fullName} />
      {/* pb-16: espaço para a barra de navegação inferior em telemóvel */}
      <main id="conteudo" className="min-h-[60vh] pb-16 pt-16 md:pt-[72px] lg:pb-0">
        {children}
      </main>
      <SiteFooter />
    </NotificationProvider>
  );
}
