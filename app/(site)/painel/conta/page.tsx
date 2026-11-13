import { AccountForms } from "@/components/dashboard/account-forms";
import { requireUser } from "@/lib/services/session";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Conta" };

export default async function AccountPage() {
  const user = await requireUser("/painel/conta");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white">Dados pessoais</h1>
        <p className="mt-1 text-[0.84rem] text-white/45">
          Mantenha os seus dados actualizados. Só você tem acesso a esta informação.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/35">Estado</p>
          <p className="mt-1 text-[0.86rem] font-semibold capitalize text-white">{user.status}</p>
        </div>
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/35">
            Email verificado
          </p>
          <p className="mt-1 text-[0.86rem] font-semibold text-white">
            {user.emailVerified ? "Sim" : "Não"}
          </p>
        </div>
        <div className="panel rounded-xl2 p-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/35">
            Membro desde
          </p>
          <p className="mt-1 text-[0.86rem] font-semibold text-white">{formatDate(user.createdAt)}</p>
        </div>
      </div>

      <AccountForms
        initial={{
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
        }}
      />
    </div>
  );
}
