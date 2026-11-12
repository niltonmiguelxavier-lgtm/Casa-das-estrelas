export type Country = "Angola" | "Moçambique";

export type ParticipantStatus = "activo" | "nomeado" | "eliminado" | "vencedor";

export interface Participant {
  id: string;
  number: number;
  name: string;
  age: number | null;
  country: Country;
  city: string | null;
  tagline: string;
  bio: string;
  occupation: string | null;
  talents: string[];
  photo: string | null;
  gallery: string[];
  status: ParticipantStatus;
  /** Votos contabilizados na base de dados (fonte de verdade: tabela votes). */
  totalVotes: number;
  freeVotes: number;
  paidVotes: number;
  previousPosition: number | null;
  isPublished: boolean;
}

export interface NewsCategory {
  id: string;
  slug: string;
  name: string;
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  cover: string;
  publishedAt: string;
  author: string;
  featured: boolean;
  pinned?: boolean;
}

export interface GalleryItem {
  id: string;
  type: "foto" | "video";
  title: string;
  src: string;
  poster?: string;
  caption: string;
  event: string;
  createdAt: string;
}

export interface VotePackage {
  id: string;
  name: string;
  votes: number;
  price: number;
  currency: string;
  bonusLabel?: string;
  bestValue?: boolean;
  active: boolean;
  validUntil?: string;
}

export interface VotingCampaign {
  id: string;
  name: string;
  status: "agendada" | "activa" | "encerrada";
  startsAt: string;
  endsAt: string;
  freeVotesPerUser: number;
  frequency: "diaria" | "unica" | "semanal";
  participantsIds: string[];
  updatedAt?: string;
  rules: string[];
}

export type NotificationCategory =
  | "conta"
  | "votacao"
  | "pagamento"
  | "programa"
  | "sistema";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  read: boolean;
  channel: ("in_app" | "email")[];
  priority: "normal" | "alta";
}

export type PaymentStatus = "pendente" | "confirmado" | "recusado" | "expirado" | "reembolsado";

export interface VoteRecord {
  id: string;
  participantId: string;
  participantName: string;
  type: "gratuito" | "pago";
  quantity: number;
  createdAt: string;
  campaign: string;
}

export interface OrderRecord {
  id: string;
  reference: string;
  packageName: string;
  votes: number;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  role: "utilizador" | "gestor_conteudos" | "operador_financeiro" | "administrador" | "superadministrador";
  emailVerified: boolean;
  phoneVerified: boolean;
  status: "activa" | "suspensa" | "pendente";
  createdAt: string;
  avatarColor: string;
}

export interface RankingRow {
  position: number;
  participantId: string;
  name: string;
  number: number;
  country: Country;
  photo: string | null;
  votes: number;
  variation: number;
}
