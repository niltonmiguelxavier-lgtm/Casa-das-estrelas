import { NotificationsCenter } from "@/components/notifications/notifications-center";

export const metadata = { title: "Notificações" };

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Notificações</h1>
        <p className="mt-1 text-[0.84rem] text-white/45">
          Todas as actualizações da sua conta, votação, pagamentos e programa. Actualização em tempo
          real quando o serviço está configurado.
        </p>
      </div>
      <NotificationsCenter />
    </div>
  );
}
