/**
 * Writes server/SciFiNoodles.Web/Data/sitemap-paths.json from the same catalog
 * routes as app/src/routes/sitemap[.]xml.ts. Run with Bun from repo root:
 *   bun deploy/export-sitemap-paths.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { classics, labEntries, universes } from "../app/src/content/catalog.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "server", "SciFiNoodles.Web", "Data");
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

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "sitemap-paths.json"), `${JSON.stringify([...new Set(paths)], null, 2)}\n`, "utf8");
console.log(`Wrote ${paths.length} paths to server/SciFiNoodles.Web/Data/sitemap-paths.json`);
