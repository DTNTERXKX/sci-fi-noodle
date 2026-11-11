/**
 * Renders every path in Data/sitemap-paths.json through the built TanStack Start
 * server bundle (app/dist/server/server.js) and writes the HTML into a wwwroot:
 * "/" -> <wwwroot>/index.html, "/watch" -> <wwwroot>/watch/index.html, ...
 *
 * The client entry hydrates the whole document and needs the server's $_TSR
 * payload, so a hand-written shell with an empty #root renders a black page.
 *
 *   bun deploy/prerender-pages.mjs [targetWwwroot]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverBundle = join(root, "app", "dist", "server", "server.js");
const pathsFile = join(root, "server", "SciFiNoodles.Web", "Data", "sitemap-paths.json");
const appSettings = join(root, "server", "SciFiNoodles.Web", "appsettings.json");
const wwwroot = process.argv[2] || join(root, "server", "SciFiNoodles.Web", "wwwroot");

for (const file of [serverBundle, pathsFile]) {
  if (!existsSync(file)) {
    console.error(`Missing ${file}. Run the app build and export-sitemap-paths.mjs first.`);
    process.exit(1);
  }
}

let origin = "https://www.scifinoodles.com";
try {
  const configured = JSON.parse(readFileSync(appSettings, "utf8"))?.Site?.PublicUrl;
  if (typeof configured === "string" && configured.startsWith("http")) origin = configured.replace(/\/+$/, "");
} catch {
  // appsettings.json is optional here; the default origin is the production one.
}

const { default: worker } = await import(pathToFileURL(serverBundle).href);
if (typeof worker?.fetch !== "function") {
  console.error(`${serverBundle} does not export a fetch handler.`);
  process.exit(1);
}

const ctx = { waitUntil() {}, passThroughOnException() {} };
const paths = JSON.parse(readFileSync(pathsFile, "utf8"));
if (!paths.includes("/")) paths.unshift("/");

let failed = 0;
for (const path of paths) {
  const res = await worker.fetch(new Request(origin + path, { headers: { accept: "text/html" } }), {}, ctx);
  const html = await res.text();
  if (res.status !== 200 || !html.includes("$_TSR") || !html.includes("/assets/")) {
    console.error(`Render failed for ${path}: status ${res.status}, ${html.length} bytes`);
    failed++;
    continue;
  }

  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "");
  const out = clean ? join(wwwroot, clean, "index.html") : join(wwwroot, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html, "utf8");
}

// Unknown page paths get this instead of the homepage: hydration data from one URL
// rendered at another leaves the document empty.
const missing = await worker.fetch(new Request(`${origin}/__sfn-not-found__`, { headers: { accept: "text/html" } }), {}, ctx);
const notFoundHtml = await missing.text();
if (missing.status !== 404 || !notFoundHtml.includes("$_TSR")) {
  console.error(`Not-found page render failed: status ${missing.status}, ${notFoundHtml.length} bytes`);
  failed++;
} else {
  writeFileSync(join(wwwroot, "404.html"), notFoundHtml, "utf8");
}

if (failed) {
  console.error(`${failed} render(s) failed.`);
  process.exit(1);
}
console.log(`Rendered ${paths.length} pages and 404.html into ${wwwroot}`);
