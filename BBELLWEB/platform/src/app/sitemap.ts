import type { MetadataRoute } from "next";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://bbellweb.info";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl().replace(/\/$/, "");
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/studio`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
