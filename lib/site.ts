/**
 * Configuração pública do programa.
 * Estes valores podem ser sobrepostos pelo painel administrativo (tabela admin_settings).
 */
export const site = {
  name: "Casa das Estrelas",
  tagline: "O reality show que revela talentos",
  description:
    "Casa das Estrelas é o reality show oficial que reúne 20 concorrentes de Angola e Moçambique numa competição de talento, convivência e votação do público.",
  shortName: "CDE",
  locale: "pt-MZ",
  country: "Moçambique",
  countries: ["Moçambique", "Angola", "Outros países"] as const,
  emails: {
    geral: "geral@casadasestrelas.tv",
    apoio: "apoio@casadasestrelas.tv",
    imprensa: "imprensa@casadasestrelas.tv",
    privacidade: "privacidade@casadasestrelas.tv",
  },
  phone: "+258 84 000 0000",
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/",
    youtube: "https://youtube.com/",
    x: "https://x.com/",
  },
  edition: "1.ª Edição",
  timezone: "Africa/Maputo",
  /** Estado global de publicação de totais de votos (configurável pela administração). */
  showPublicVoteTotals: true,
} as const;

export type SiteConfig = typeof site;

export const NAV_LINKS = [
  { href: "/programa", label: "O Programa" },
  { href: "/concorrentes", label: "Concorrentes" },
  { href: "/votar", label: "Votar" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/noticias", label: "Notícias" },
  { href: "/galeria", label: "Galeria" },
] as const;

export const FOOTER_LINKS = {
  programa: [
    { href: "/programa", label: "Sobre o programa" },
    { href: "/concorrentes", label: "Concorrentes" },
    { href: "/classificacao", label: "Classificação" },
    { href: "/premios", label: "Prémios" },
    { href: "/regulamento", label: "Regulamento" },
  ],
  participar: [
    { href: "/votar", label: "Votar gratuitamente" },
    { href: "/votar/pacotes", label: "Comprar votos" },
    { href: "/registo", label: "Criar conta" },
    { href: "/entrar", label: "Iniciar sessão" },
    { href: "/painel/notificacoes", label: "Notificações" },
  ],
  institucional: [
    { href: "/patrocinadores", label: "Patrocinadores" },
    { href: "/contactos", label: "Contactos" },
    { href: "/faq", label: "Perguntas frequentes" },
    { href: "/termos", label: "Termos e condições" },
    { href: "/privacidade", label: "Política de privacidade" },
    { href: "/cookies", label: "Política de cookies" },
  ],
} as const;

export const PAYMENT_METHODS = [
  { id: "mpesa", label: "M-Pesa", region: "Moçambique", status: "previsto" },
  { id: "emola", label: "e-Mola", region: "Moçambique", status: "previsto" },
  { id: "mkesh", label: "mKesh", region: "Moçambique", status: "previsto" },
  { id: "visa", label: "Visa", region: "Internacional", status: "previsto" },
  { id: "mastercard", label: "Mastercard", region: "Internacional", status: "previsto" },
] as const;
