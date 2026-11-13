"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção: enviar para o serviço de monitorização (Sentry/equivalente).
    console.error("[app-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-star-rose/30 bg-star-rose/10 text-star-rose">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-white">
        Ocorreu um erro inesperado
      </h1>
      <p className="mt-2 max-w-md text-[0.9rem] leading-relaxed text-white/45">
        A equipa técnica foi notificada. Nenhuma votação ou pagamento em curso é afetado por este
        erro.
        {error.digest && (
          <span className="mt-2 block font-mono text-[0.7rem] text-white/25">
            Referência: {error.digest}
          </span>
        )}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn btn-gold">
          <RotateCcw className="h-4 w-4" /> Tentar novamente
        </button>
        <Link href="/" className="btn btn-ghost">
          Página inicial
        </Link>
      </div>
    </div>
  );
}
