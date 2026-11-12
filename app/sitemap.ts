import type { MetadataRoute } from "next";
import { listNews, listParticipants } from "@/lib/services/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casadasestrelas.tv";

  const staticRoutes = [
    "",
    "/programa",
    "/concorrentes",
    "/votar",
    "/votar/pacotes",
    "/classificacao",
    "/noticias",
    "/galeria",
    "/regulamento",
    "/premios",
    "/patrocinadores",
    "/contactos",
    "/faq",
    "/termos",
    "/privacidade",
    "/cookies",
  ].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const [participants, news] = await Promise.all([listParticipants(), listNews(100)]);

  return [
    ...staticRoutes,
    ...participants.map((p) => ({
      url: `${base}/concorrentes/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...news.map((n) => ({
      url: `${base}/noticias/${n.slug}`,
      lastModified: new Date(n.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
