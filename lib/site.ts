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
  /**
   * Redes sociais oficiais. Apenas são mostradas as que estiverem definidas e
   * activas — um endereço vazio significa «sem presença pública ainda» e o
   * ícone não é apresentado. Substituir pelos endereços oficiais confirmados.
   */
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    x: "",
  },
  edition: "1.ª Edição",
  timezone: "Africa/Maputo",
  /** Estado global de publicação de totais de votos (configurável pela administração). */
  showPublicVoteTotals: true,
} as const;

export type SiteConfig = typeof site;

/**
 * Navegação pública. Ordem definida pela produção:
 * Início · Concorrentes · Notícias · Vídeos · Votação.
 * Nenhuma ligação administrativa é exposta ao visitante.
 */
export const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/concorrentes", label: "Concorrentes" },
  { href: "/noticias", label: "Notícias" },
  { href: "/galeria", label: "Vídeos" },
  { href: "/votar", label: "Votação" },
] as const;

/** Navegação secundária (desktop e menu móvel). */
export const NAV_LINKS_SECONDARY = [
  { href: "/programa", label: "O Programa" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/premios", label: "Prémios" },
  { href: "/patrocinadores", label: "Patrocinadores" },
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
