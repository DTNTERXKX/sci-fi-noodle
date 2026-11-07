/**
 * Writes index.html with correct hashed asset names (reads from app/dist/client/assets).
 * TanStack Start client build emits only JS/CSS under assets/; this shell boots the SPA.
 *
 *   bun deploy/spa-shell.mjs [outputIndexPath]
 * Default: app/dist/client/index.html
 */
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "app", "dist", "client", "assets");

if (!existsSync(assetsDir)) {
  console.error("Missing app/dist/client/assets. Run: cd app && bun run build");
  process.exit(1);
}

const files = readdirSync(assetsDir);
const indexJs = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const stylesCss = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

if (!indexJs) {
  console.error("Could not find index-*.js in dist/client/assets");
  process.exit(1);
}

const lines = [
  "<!doctype html>",
  '<html lang="en">',
  "<head>",
  '  <meta charset="utf-8" />',
  '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
  "  <title>SCI-FI NOODLES</title>",
];

if (stylesCss) {
  lines.push(`  <link rel="stylesheet" href="/assets/${stylesCss}" />`);
}
lines.push(`  <link rel="modulepreload" href="/assets/${indexJs}" />`);
lines.push("</head>");
lines.push('<body><div id="root"></div>');
lines.push(`  <script type="module" src="/assets/${indexJs}"></script>`);
lines.push("</body>");
lines.push("</html>");

const out = process.argv[2] || join(root, "app", "dist", "client", "index.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${out}`);
