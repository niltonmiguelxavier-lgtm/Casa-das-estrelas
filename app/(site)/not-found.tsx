import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-[6rem] font-black leading-none gold-text">404</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-white">
        Esta página saiu da casa
      </h1>
      <p className="mt-2 max-w-md text-[0.9rem] leading-relaxed text-white/45">
        O conteúdo que procura pode ter sido movido, eliminado ou nunca existiu. Experimente a
        página inicial ou a lista de concorrentes.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-gold">
          Voltar ao início
        </Link>
        <Link href="/concorrentes" className="btn btn-ghost">
          <Search className="h-4 w-4" /> Ver concorrentes
        </Link>
        <Link href="/noticias" className="btn btn-ghost">
          Notícias
        </Link>
      </div>
    </div>
  );
}
