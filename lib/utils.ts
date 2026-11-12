import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MZN = new Intl.NumberFormat("pt-MZ", {
  style: "currency",
  currency: "MZN",
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat("pt-MZ");

export function formatCurrency(value: number, currency = "MZN") {
  if (currency === "MZN") return MZN.format(value);
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number) {
  return NUM.format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-MZ", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatDate(input: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function formatDateTime(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function timeAgo(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `há ${days} d`;
  return formatDate(d, { day: "2-digit", month: "short" });
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Dias restantes até uma data (mínimo 0). */
export function daysLeft(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Máscara simples de telefone moçambicano/angolano para exibição. */
export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 3)} ••• ${digits.slice(-3)}`;
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(2, user.length - 2))}@${domain}`;
}
