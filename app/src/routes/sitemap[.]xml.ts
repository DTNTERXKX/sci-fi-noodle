import { createFileRoute } from "@tanstack/react-router";

import { classics, labEntries, universes } from "../content/catalog";
import { SITE_URL } from "../lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = SITE_URL;
        const today = new Date().toISOString().split("T")[0];
        const paths = [
          "/",
          "/watch",
          "/originals",
          "/public-domain",
          "/docs",
          "/atmospheres",
          "/shorts",
          "/lab",
          "/host",
          "/about",
          "/contact",
          "/privacy",
          "/terms",
          "/rights",
          ...universes.map((item) => `/originals/${item.slug}`),
          ...classics.map((item) => `/public-domain/${item.slug}`),
          ...labEntries.map((item) => `/lab/${item.slug}`),
        ];
        const unique = [...new Set(paths)];
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...unique.map(
            (path) =>
              `  <url><loc>${origin}${path}</loc><lastmod>${today}</lastmod></url>`,
          ),
          "</urlset>",
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
