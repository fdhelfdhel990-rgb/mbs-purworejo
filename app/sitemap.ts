import type { MetadataRoute } from "next";
import { getPublicNewsArticles } from "./data/public-cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://mbs-purworejo.vercel.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/profil`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kontak`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const articles = await getPublicNewsArticles();
    const seenUrls = new Set<string>();

    const dynamicArticleRoutes: MetadataRoute.Sitemap = [];

    for (const article of articles) {
      if (!article.id) continue;
      const url = `${baseUrl}/berita/detail?id=${encodeURIComponent(article.id)}`;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      let articleDate = now;
      if (article.updatedAt) {
        const parsed = new Date(article.updatedAt);
        if (!isNaN(parsed.getTime())) articleDate = parsed;
      } else if (article.publishedAt) {
        const parsed = new Date(article.publishedAt);
        if (!isNaN(parsed.getTime())) articleDate = parsed;
      }

      dynamicArticleRoutes.push({
        url,
        lastModified: articleDate,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    return [...staticRoutes, ...dynamicArticleRoutes];
  } catch (error) {
    console.error("Error generating sitemap article URLs:", error);
    return staticRoutes;
  }
}
