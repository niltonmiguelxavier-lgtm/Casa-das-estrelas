import type { Metadata, Viewport } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { getCurrentUser, can } from "@/lib/services/session";
import { listNotifications } from "@/lib/services/notifications";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://casadasestrelas.tv"),
  title: {
    default: "Casa das Estrelas — Website oficial",
    template: "%s · Casa das Estrelas",
  },
  description:
    "Website oficial do reality show Casa das Estrelas. Conheça os 20 concorrentes de Angola e Moçambique, acompanhe as notícias, consulte a classificação e vote.",
  keywords: [
    "Casa das Estrelas",
    "reality show",
    "Moçambique",
    "Angola",
    "votação",
    "concorrentes",
  ],
  openGraph: {
    type: "website",
    locale: "pt_MZ",
    siteName: "Casa das Estrelas",
    title: "Casa das Estrelas — Website oficial",
    description:
      "Acompanhe o reality show, conheça os concorrentes e vote no seu favorito.",
    images: [{ url: "/media/hero.jpg", width: 1200, height: 630, alt: "Casa das Estrelas" }],
  },
  twitter: { card: "summary_large_image", title: "Casa das Estrelas" },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const notifications = user ? await listNotifications(8) : [];

  return (
    <html lang="pt-MZ" className={`${inter.variable} ${archivo.variable}`}>
      <body className="min-h-screen antialiased">
        <NotificationProvider initial={notifications} userId={user?.id ?? null}>
          <SiteHeader
            isAuthenticated={Boolean(user)}
            userName={user?.fullName}
            isAdmin={Boolean(user && can(user.role, "conteudos.noticias"))}
          />
          <main id="conteudo" className="min-h-[60vh] pt-16 md:pt-[74px]">
            {children}
          </main>
          <SiteFooter />
        </NotificationProvider>
      </body>
    </html>
  );
}
