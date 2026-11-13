import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { requireUser } from "@/lib/services/session";

export const metadata = { title: "Preferências" };

export default async function PreferencesPage() {
  await requireUser("/painel/preferencias");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Preferências de notificação</h1>
        <p className="mt-1 text-[0.84rem] text-white/45">
          Escolha como quer ser informado sobre o programa, a sua conta e as suas transacções.
        </p>
      </div>
      <PreferencesForm
        initial={{
          inApp: true,
          email: true,
          push: false,
          sms: false,
          whatsapp: false,
          voteAlerts: true,
          newsAlerts: true,
          paymentAlerts: true,
          securityAlerts: true,
        }}
      />
    </div>
  );
}
