/**
 * Copies the SPA shell index.html to each path in Data/sitemap-paths.json
 * (except /) as .../index.html under a target wwwroot. Used for crawlers and
 * first paint before JS boots the client router.
 *
 *   bun deploy/prerender-static.mjs [targetWwwroot]
 * Shell: <wwwroot>/index.html (run spa-shell.mjs into wwwroot first).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pathsFile = join(root, "server", "SciFiNoodles.Web", "Data", "sitemap-paths.json");
const wwwroot = process.argv[2] || join(root, "server", "SciFiNoodles.Web", "wwwroot");
const shell = join(wwwroot, "index.html");

if (!existsSync(shell)) {
  console.error(`Missing ${shell}. Run: bun deploy/spa-shell.mjs <wwwroot>/index.html`);
  process.exit(1);
}
if (!existsSync(pathsFile)) {
  console.error("Missing sitemap-paths.json. Run: bun deploy/export-sitemap-paths.mjs");
  process.exit(1);
}

const paths = JSON.parse(readFileSync(pathsFile, "utf8"));
let count = 0;
for (const path of paths) {
  if (path === "/") {
    copyFileSync(shell, join(wwwroot, "index.html"));
    count++;
    continue;
  }
  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!clean) continue;
  const dir = join(wwwroot, clean);
  mkdirSync(dir, { recursive: true });
  copyFileSync(shell, join(dir, "index.html"));
  count++;
}

console.log(`Copied SPA shell to ${count} locations under ${wwwroot}`);
