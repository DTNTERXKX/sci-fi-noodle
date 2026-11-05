import type { MetadataRoute } from "next";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://bbellweb.info";
}

export default function robots(): MetadataRoute.Robots {
  const base = appUrl().replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev/", "/api/", "/dashboard", "/studio"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
