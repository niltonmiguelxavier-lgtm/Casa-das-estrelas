import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Definir nova palavra-passe",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Definir nova palavra-passe"
      subtitle="Escolha uma nova palavra-passe para a sua conta. A ligação é de uso único e termina após a confirmação."
      footer={
        <Link href="/entrar" className="font-semibold text-gold-300 hover:text-gold-200">
          Voltar ao início de sessão
        </Link>
      }
      image="/media/voting.jpg"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
