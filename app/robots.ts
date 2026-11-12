import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casadasestrelas.tv";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/painel", "/api", "/entrar", "/registo", "/recuperar-palavra-passe"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
