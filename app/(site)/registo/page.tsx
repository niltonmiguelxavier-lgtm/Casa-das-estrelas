import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto. Necessário apenas para votar e acompanhar o seu histórico."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-gold-300 hover:text-gold-200">
            Iniciar sessão
          </Link>
        </>
      }
      image="/media/atmosphere.jpg"
    >
      <RegisterForm />
    </AuthShell>
  );
}
