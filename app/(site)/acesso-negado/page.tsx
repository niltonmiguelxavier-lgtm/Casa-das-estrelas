import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Acesso restrito",
  robots: { index: false, follow: false },
};

/**
 * Apresentada quando uma conta autenticada tenta abrir uma área para a qual não
 * tem permissão. Não revela a existência de dados administrativos nem permite
 * qualquer operação — apenas informa e oferece saída.
 */
export default function AccessDeniedPage() {
  return (
    <section className="container-page flex min-h-[62vh] items-center justify-center py-20">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/12 text-white/50">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-6 display-2 text-white">Acesso restrito</h1>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-white/50">
          A sua conta não tem permissão para abrir esta área. Se acredita tratar-se de um erro,
          contacte a produção do programa.
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/" className="btn btn-gold">
            Voltar ao início
          </Link>
          <Link href="/painel" className="btn btn-ghost">
            A minha conta
          </Link>
        </div>
      </div>
    </section>
  );
}
