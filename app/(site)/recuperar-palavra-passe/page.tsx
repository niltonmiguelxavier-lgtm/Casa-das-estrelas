import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Recuperar palavra-passe", robots: { index: false } };

export default function RecoverPage() {
  return (
    <AuthShell
      title="Recuperar palavra-passe"
      subtitle="Indique o email associado à sua conta. Enviaremos uma ligação segura e temporária."
      footer={
        <Link href="/entrar" className="font-semibold text-gold-300 hover:text-gold-200">
          Voltar ao início de sessão
        </Link>
      }
      image="/media/voting.jpg"
    >
      <ForgotForm />
    </AuthShell>
  );
}
