import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  image = "/media/hero.jpg",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  image?: string;
}) {
  return (
    <div className="relative -mt-16 min-h-screen md:-mt-[74px]">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" aria-hidden className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#05060a,rgba(5,6,10,0.85)_45%,rgba(5,6,10,0.7))]" />
        <div className="absolute inset-0 noise" />
      </div>

      <div className="container-page relative grid min-h-screen items-center gap-10 py-24 lg:grid-cols-2">
        <div className="hidden lg:block">
          <Logo />
          <h2 className="mt-8 max-w-md font-display text-[2.6rem] font-black leading-[0.98] text-white">
            A sua voz na <span className="gold-text">Casa das Estrelas</span>
          </h2>
          <p className="mt-4 max-w-sm text-[0.92rem] leading-relaxed text-white/50">
            Crie conta para votar, acompanhar o seu histórico e receber notificações oficiais do
            programa.
          </p>
          <ul className="mt-8 space-y-3 text-[0.85rem] text-white/55">
            {[
              "Votos gratuitos todos os dias",
              "Histórico de votos e pagamentos",
              "Notificações de galas e nomeações",
              "Dados protegidos e sessões seguras",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-400/15 text-[0.6rem] text-gold-300">
                  ✦
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <div className="relative overflow-hidden rounded-xl2 border border-white/10 bg-ink-900/85 p-6 backdrop-blur-xl md:p-7">
            <div className="absolute inset-x-0 top-0 h-px gold-line" />
            <h1 className="font-display text-2xl font-extrabold text-white">{title}</h1>
            <p className="mt-1.5 text-[0.84rem] leading-relaxed text-white/45">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-[0.82rem] text-white/45">{footer}</div>}
          <p className="mt-6 text-center text-[0.66rem] leading-relaxed text-white/25">
            Ao continuar declara que leu e aceita os{" "}
            <Link href="/termos" className="underline hover:text-white/50">
              termos
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="underline hover:text-white/50">
              política de privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-star-rose/30 bg-star-rose/10 px-3 py-2.5 text-[0.8rem] leading-relaxed text-rose-200"
    >
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="rounded-lg border border-star-teal/30 bg-star-teal/10 px-3 py-2.5 text-[0.8rem] leading-relaxed text-teal-200"
    >
      {message}
    </p>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-[0.7rem] text-rose-300">{errors[0]}</p>;
}
