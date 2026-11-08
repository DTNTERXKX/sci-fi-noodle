import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeSiteFile, type SiteFile } from "./site-file";

function resolveSiteSegmentsPath() {
  const candidates: string[] = [];
  try {
    candidates.push(fileURLToPath(new URL("./site-segments.json", import.meta.url)));
  } catch {
    // A bundled worker URL has no sibling JSON. Production does not call this module.
  }
  candidates.push(resolve(process.cwd(), "src/content/site-segments.json"));
  candidates.push(resolve(process.cwd(), "app/src/content/site-segments.json"));
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error(`site-segments.json not found. Looked in ${candidates.join(", ")}`);
  return found;
}

/** Install a disk reader for local dev. Each call stats the file and re-parses it after a save. */
export function installSiteSegmentReader() {
  const path = resolveSiteSegmentsPath();
  let cache: { mtimeMs: number; size: number; file: SiteFile } | null = null;
  (globalThis as { __readSiteSegments?: () => SiteFile }).__readSiteSegments = () => {
    const stat = statSync(path);
    if (cache && cache.mtimeMs === stat.mtimeMs && cache.size === stat.size) return cache.file;
    const file = normalizeSiteFile(JSON.parse(readFileSync(path, "utf8")));
    cache = { mtimeMs: stat.mtimeMs, size: stat.size, file };
    return file;
  };
}
