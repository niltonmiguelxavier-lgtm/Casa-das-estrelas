import type {
  GalleryItem,
  NewsPost,
  Participant,
  VotePackage,
  VotingCampaign,
} from "@/lib/types";

/**
 * ============================================================================
 *  DADOS DE DEMONSTRAÇÃO
 * ============================================================================
 *  Este ficheiro existe apenas para que a interface possa ser avaliada antes de
 *  a administração introduzir os dados reais.
 *
 *  REGRAS:
 *   - Estes dados NUNCA devem ser publicados como informação oficial.
 *   - Os perfis marcados com `isDemo` são espaços reservados da grelha oficial
 *     de 20 concorrentes (10 Angola + 10 Moçambique).
 *   - Quando o Supabase está configurado (NEXT_PUBLIC_SUPABASE_URL +
 *     SUPABASE_SERVICE_ROLE_KEY), todo este módulo é ignorado: a base de dados
 *     PostgreSQL é a única fonte de verdade.
 * ============================================================================
 */
/**
 * Modo de demonstração: só existe quando NÃO há base de dados configurada.
 * Com Supabase ligado, a aplicação mostra exclusivamente dados reais (mesmo que
 * a grelha esteja vazia) e todos os avisos de demonstração desaparecem.
 */
export const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const demoParticipants: Participant[] = [
  {
    id: "ao-01", number: 1, name: "Nádia K.", age: 24, country: "Angola", city: "Luanda",
    tagline: "Voz que atravessa a cidade", occupation: "Cantora",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Canto", "Composição"], photo: null, gallery: [], status: "activo",
    totalVotes: 18420, freeVotes: 12210, paidVotes: 6210, previousPosition: 2, isPublished: true,
  },
  {
    id: "ao-02", number: 2, name: "Kelson T.", age: 27, country: "Angola", city: "Benguela",
    tagline: "Ritmo de kuduro moderno", occupation: "Bailarino",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Dança", "Coreografia"], photo: null, gallery: [], status: "activo",
    totalVotes: 15230, freeVotes: 10110, paidVotes: 5120, previousPosition: 1, isPublished: true,
  },
  {
    id: "ao-03", number: 3, name: "Irene S.", age: 22, country: "Angola", city: "Huambo",
    tagline: "Presença de palco e verdade", occupation: "Actriz",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Representação", "Improviso"], photo: null, gallery: [], status: "activo",
    totalVotes: 12780, freeVotes: 8990, paidVotes: 3790, previousPosition: 3, isPublished: true,
  },
  {
    id: "ao-04", number: 4, name: "Benvindo A.", age: 29, country: "Angola", city: "Lubango",
    tagline: "Contador de histórias", occupation: "Comunicador",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Oratória", "Humor"], photo: null, gallery: [], status: "activo",
    totalVotes: 11420, freeVotes: 8110, paidVotes: 3310, previousPosition: 4, isPublished: true,
  },
  {
    id: "ao-05", number: 5, name: "Luena M.", age: 25, country: "Angola", city: "Cabinda",
    tagline: "Soul com raízes", occupation: "Música",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Canto", "Piano"], photo: null, gallery: [], status: "activo",
    totalVotes: 9980, freeVotes: 7210, paidVotes: 2770, previousPosition: 6, isPublished: true,
  },
  {
    id: "ao-06", number: 6, name: "Domingos P.", age: 31, country: "Angola", city: "Namibe",
    tagline: "Precisão e disciplina", occupation: "Multimédia",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Design", "Edição"], photo: null, gallery: [], status: "activo",
    totalVotes: 8740, freeVotes: 6320, paidVotes: 2420, previousPosition: 5, isPublished: true,
  },
  {
    id: "ao-07", number: 7, name: "Telma G.", age: 23, country: "Angola", city: "Lobito",
    tagline: "Energia contagiante", occupation: "Dançarina",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Dança", "Aulas"], photo: null, gallery: [], status: "activo",
    totalVotes: 8110, freeVotes: 5980, paidVotes: 2130, previousPosition: 7, isPublished: true,
  },
  {
    id: "ao-08", number: 8, name: "Osvaldo N.", age: 26, country: "Angola", city: "Luanda",
    tagline: "Rap com mensagem", occupation: "Rapper",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Escrita", "Freestyle"], photo: null, gallery: [], status: "activo",
    totalVotes: 7690, freeVotes: 5510, paidVotes: 2180, previousPosition: 8, isPublished: true,
  },
  {
    id: "ao-09", number: 9, name: "Cátia B.", age: 21, country: "Angola", city: "Soyo",
    tagline: "Delicadeza e força", occupation: "Estudante",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Canto", "Poesia"], photo: null, gallery: [], status: "activo",
    totalVotes: 7020, freeVotes: 5140, paidVotes: 1880, previousPosition: 10, isPublished: true,
  },
  {
    id: "ao-10", number: 10, name: "Adão C.", age: 30, country: "Angola", city: "Menongue",
    tagline: "Instrumentista de raiz", occupation: "Músico",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Guitarra", "Produção"], photo: null, gallery: [], status: "activo",
    totalVotes: 6480, freeVotes: 4710, paidVotes: 1770, previousPosition: 9, isPublished: true,
  },
  {
    id: "mz-11", number: 11, name: "Amina J.", age: 24, country: "Moçambique", city: "Maputo",
    tagline: "Marrabenta reinventada", occupation: "Cantora",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Canto", "Composição"], photo: null, gallery: [], status: "activo",
    totalVotes: 21640, freeVotes: 14300, paidVotes: 7340, previousPosition: 2, isPublished: true,
  },
  {
    id: "mz-12", number: 12, name: "Ivan M.", age: 28, country: "Moçambique", city: "Beira",
    tagline: "Palco é a minha casa", occupation: "Actor",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Representação", "Dublagem"], photo: null, gallery: [], status: "activo",
    totalVotes: 19870, freeVotes: 13210, paidVotes: 6660, previousPosition: 1, isPublished: true,
  },
  {
    id: "mz-13", number: 13, name: "Sónia R.", age: 25, country: "Moçambique", city: "Nampula",
    tagline: "Poesia em movimento", occupation: "Poetisa",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Poesia", "Performance"], photo: null, gallery: [], status: "activo",
    totalVotes: 17120, freeVotes: 11840, paidVotes: 5280, previousPosition: 4, isPublished: true,
  },
  {
    id: "mz-14", number: 14, name: "Celso F.", age: 26, country: "Moçambique", city: "Matola",
    tagline: "Batida da nova geração", occupation: "Produtor",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Produção", "DJ"], photo: null, gallery: [], status: "activo",
    totalVotes: 15630, freeVotes: 10720, paidVotes: 4910, previousPosition: 3, isPublished: true,
  },
  {
    id: "mz-15", number: 15, name: "Rute A.", age: 22, country: "Moçambique", city: "Quelimane",
    tagline: "Voz suave, ideias firmes", occupation: "Estudante",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Canto", "Ukulele"], photo: null, gallery: [], status: "activo",
    totalVotes: 13980, freeVotes: 9720, paidVotes: 4260, previousPosition: 5, isPublished: true,
  },
  {
    id: "mz-16", number: 16, name: "Edson L.", age: 32, country: "Moçambique", city: "Tete",
    tagline: "Comédia com verdade", occupation: "Comediante",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Humor", "Escrita"], photo: null, gallery: [], status: "activo",
    totalVotes: 12470, freeVotes: 8790, paidVotes: 3680, previousPosition: 7, isPublished: true,
  },
  {
    id: "mz-17", number: 17, name: "Milagre C.", age: 23, country: "Moçambique", city: "Xai-Xai",
    tagline: "Dança que conta histórias", occupation: "Bailarina",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Dança", "Figurinos"], photo: null, gallery: [], status: "activo",
    totalVotes: 11210, freeVotes: 8020, paidVotes: 3190, previousPosition: 6, isPublished: true,
  },
  {
    id: "mz-18", number: 18, name: "Nilton V.", age: 29, country: "Moçambique", city: "Pemba",
    tagline: "Guitarra do norte", occupation: "Músico",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Guitarra", "Canto"], photo: null, gallery: [], status: "activo",
    totalVotes: 10430, freeVotes: 7360, paidVotes: 3070, previousPosition: 8, isPublished: true,
  },
  {
    id: "mz-19", number: 19, name: "Joana U.", age: 27, country: "Moçambique", city: "Chimoio",
    tagline: "Elegância e discurso", occupation: "Comunicadora",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Apresentação", "Moda"], photo: null, gallery: [], status: "activo",
    totalVotes: 9670, freeVotes: 6890, paidVotes: 2780, previousPosition: 9, isPublished: true,
  },
  {
    id: "mz-20", number: 20, name: "Hélder Z.", age: 33, country: "Moçambique", city: "Inhambane",
    tagline: "Experiência e humildade", occupation: "Mentor",
    bio: "Perfil de demonstração. A biografia oficial é introduzida pela administração antes do início das emissões.",
    talents: ["Mentoria", "Canto"], photo: null, gallery: [], status: "activo",
    totalVotes: 9020, freeVotes: 6450, paidVotes: 2570, previousPosition: 10, isPublished: true,
  },
];

const now = Date.now();
const iso = (daysAgo: number, hoursAgo = 0) =>
  new Date(now - daysAgo * 86_400_000 - hoursAgo * 3_600_000).toISOString();

export const demoNews: NewsPost[] = [
  {
    id: "n-01", slug: "casa-das-estrelas-abre-portas-ao-publico",
    title: "Casa das Estrelas abre portas ao público",
    excerpt:
      "A plataforma oficial do reality show está online. Saiba como acompanhar os concorrentes, votar e receber todas as actualizações.",
    body: "A Casa das Estrelas passa a ter um espaço digital oficial onde o público acompanha cada momento da competição.\n\nNa plataforma é possível conhecer os 20 concorrentes, consultar notícias e comunicados, ver a classificação actualizada e participar na votação. O acesso à leitura é livre; para votar é necessário criar conta.\n\nTodas as informações publicadas nesta plataforma são aprovadas pela produção do programa.",
    category: "Comunicado", cover: "/media/house.jpg", publishedAt: iso(1, 3),
    author: "Produção Casa das Estrelas", featured: true, pinned: true,
  },
  {
    id: "n-02", slug: "calendario-oficial-de-votacao",
    title: "Calendário oficial de votação da primeira gala",
    excerpt: "As regras de votação gratuita e o limite diário por utilizador já estão publicados.",
    body: "A primeira campanha de votação arranca com as regras publicadas na página de votação.\n\nCada utilizador autenticado dispõe de um número limitado de votos gratuitos por dia. O limite é definido pela produção e pode ser consultado na página da campanha activa.\n\nOs votos pagos estão sujeitos a confirmação do fornecedor de pagamento. Os votos só são creditados depois da confirmação verificada no servidor.",
    category: "Programa", cover: "/media/spotlights.jpg", publishedAt: iso(2, 5),
    author: "Produção", featured: true,
  },
  {
    id: "n-03", slug: "como-funciona-a-votacao",
    title: "Como funciona a votação: guia completo",
    excerpt: "Votos gratuitos, pacotes de votos e classificação: tudo explicado passo a passo.",
    body: "A votação é o coração do programa. Existem duas formas de participar: voto gratuito, incluído em cada campanha, e votos adicionais através de pacotes.\n\nO voto gratuito é limitado por campanha e por utilizador. Os pacotes de votos são processados por fornecedores de pagamento autorizados e creditados apenas após confirmação verificada.\n\nA classificação é calculada a partir dos votos válidos registados na base de dados.",
    category: "Programa", cover: "/media/voting.jpg", publishedAt: iso(4, 2),
    author: "Equipa Editorial", featured: false,
  },
  {
    id: "n-04", slug: "regulamento-oficial-disponivel",
    title: "Regulamento oficial já disponível para consulta",
    excerpt: "Documento define regras de participação, votação, prémios e tratamento de dados.",
    body: "O regulamento oficial descreve as regras de participação, o funcionamento das campanhas de votação, os critérios de eliminação e a atribuição dos prémios.\n\nA participação na votação implica a aceitação integral do regulamento e dos termos e condições da plataforma.",
    category: "Comunicado", cover: "/media/atmosphere.jpg", publishedAt: iso(6, 1),
    author: "Produção", featured: false,
  },
  {
    id: "n-05", slug: "seguranca-e-transparencia-na-votacao",
    title: "Segurança e transparência na votação",
    excerpt: "Todos os votos são validados no servidor, com registo de auditoria e protecção contra abusos.",
    body: "A votação da Casa das Estrelas é validada integralmente no servidor. O frontend nunca altera totais de votos.\n\nCada voto registado guarda data, hora, campanha e identificação da conta. Existem limites de frequência, verificações antifraude e auditoria das operações administrativas.",
    category: "Programa", cover: "/media/microphone.jpg", publishedAt: iso(9, 4),
    author: "Equipa Técnica", featured: false,
  },
];

export const demoGallery: GalleryItem[] = [
  { id: "g-01", type: "foto", title: "O palco da primeira gala", src: "/media/hero.jpg", caption: "A casa preparada para a estreia.", event: "Estreia", createdAt: iso(1) },
  { id: "g-02", type: "video", title: "Making of: a casa das estrelas", src: "/media/house.jpg", poster: "/media/house.jpg", caption: "Os bastidores da construção do cenário.", event: "Bastidores", createdAt: iso(3) },
  { id: "g-03", type: "foto", title: "Luzes da gala", src: "/media/spotlights.jpg", caption: "Desenho de luz da primeira noite.", event: "Estreia", createdAt: iso(4) },
  { id: "g-04", type: "foto", title: "Estúdio de ensaios", src: "/media/microphone.jpg", caption: "Onde começam as actuações.", event: "Ensaios", createdAt: iso(5) },
  { id: "g-05", type: "foto", title: "Audiência ao vivo", src: "/media/atmosphere.jpg", caption: "O público presente na estreia.", event: "Estreia", createdAt: iso(6) },
  { id: "g-06", type: "video", title: "Votar em 30 segundos", src: "/media/voting.jpg", poster: "/media/voting.jpg", caption: "Tutorial rápido de votação.", event: "Tutoriais", createdAt: iso(7) },
  { id: "g-07", type: "foto", title: "Sala principal", src: "/media/house.jpg", caption: "O espaço de convivência dos concorrentes.", event: "Bastidores", createdAt: iso(8) },
  { id: "g-08", type: "foto", title: "Detalhe do cenário", src: "/media/portrait-placeholder.jpg", caption: "Padrões inspirados na arte africana.", event: "Bastidores", createdAt: iso(9) },
];

export const demoPackages: VotePackage[] = [
  { id: "pkg-1", name: "Pacote Estrela", votes: 10, price: 50, currency: "MZN", active: true },
  { id: "pkg-2", name: "Pacote Constelação", votes: 30, price: 130, currency: "MZN", bonusLabel: "+3 votos oferta", active: true },
  { id: "pkg-3", name: "Pacote Galáxia", votes: 80, price: 300, currency: "MZN", bonusLabel: "+15 votos oferta", bestValue: true, active: true },
  { id: "pkg-4", name: "Pacote Supernova", votes: 200, price: 700, currency: "MZN", bonusLabel: "+50 votos oferta", active: true },
];

export const demoCampaign: VotingCampaign = {
  id: "camp-1",
  name: "1.ª Gala — Votação do público",
  status: "activa",
  startsAt: iso(2),
  endsAt: new Date(now + 5 * 86_400_000).toISOString(),
  freeVotesPerUser: 5,
  frequency: "diaria",
  participantsIds: demoParticipants.map((p) => p.id),
  rules: [
    "Cada conta autenticada dispõe de 5 votos gratuitos por dia.",
    "Os votos gratuitos são renovados diariamente às 00:00 (Africa/Maputo).",
    "Votos pagos são creditados apenas após confirmação do fornecedor de pagamento.",
    "A votação encerra no final da gala, conforme o regulamento.",
    "Contas com comportamento abusivo podem ser suspensas.",
  ],
};

/** Ranking derivado dos votos (mesma lógica da vista SQL `ranking_current`). */
export function demoRanking() {
  return [...demoParticipants]
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .map((p, i) => {
      const previous = p.previousPosition ?? i + 1;
      return {
        position: i + 1,
        participantId: p.id,
        name: p.name,
        number: p.number,
        country: p.country,
        photo: p.photo,
        votes: p.totalVotes,
        variation: previous - (i + 1),
      };
    });
}

export const demoSponsors = [
  { name: "Parceiro Principal", tier: "principal" },
  { name: "Parceiro Oficial", tier: "oficial" },
  { name: "Parceiro de Media", tier: "media" },
  { name: "Parceiro de Telecomunicações", tier: "oficial" },
  { name: "Parceiro de Energia", tier: "oficial" },
  { name: "Parceiro de Mobilidade", tier: "media" },
];
