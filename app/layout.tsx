import type { Metadata, Viewport } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";

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
    "Website oficial do reality show Casa das Estrelas. Conheça os concorrentes de Angola e Moçambique, acompanhe as notícias, consulte a classificação e vote.",
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
    description: "Acompanhe o reality show, conheça os concorrentes e vote no seu favorito.",
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

/**
 * Layout raiz — mínimo e partilhado.
 * O site público e o painel administrativo têm cada um o seu próprio layout:
 * o painel não herda cabeçalho, rodapé, barra móvel nem o fornecedor de
 * notificações do site público.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-MZ" className={`${inter.variable} ${archivo.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
