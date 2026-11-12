import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sessão", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; motivo?: string }>;
}) {
  const { next, motivo } = await searchParams;

  const notice =
    motivo === "autenticacao-necessaria"
      ? "Precisa de iniciar sessão para continuar."
      : motivo === "votar"
        ? "Inicie sessão para registar o seu voto. A sua escolha foi guardada."
        : motivo === "comprar"
          ? "Inicie sessão para concluir a compra de votos."
          : motivo === "acesso-restrito"
            ? "Essa área exige permissões de administração."
            : undefined;

  return (
    <AuthShell
      title="Iniciar sessão"
      subtitle={notice ?? "Aceda à sua conta para votar e acompanhar o programa."}
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/registo" className="font-semibold text-gold-300 hover:text-gold-200">
            Criar conta gratuita
          </Link>
        </>
      }
    >
      <LoginForm next={next ?? "/painel"} />
    </AuthShell>
  );
}
