import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${relativePath}`);
    return null;
  }
  return readFileSync(path, "utf8");
}

const indexRoute = read("src/routes/index.tsx");
if (indexRoute != null) {
  for (const marker of ["CosmicHero", "RamenMenu", "SiteShell"]) {
    if (!indexRoute.includes(marker)) {
      failures.push(`src/routes/index.tsx must render the Cosmic Ramen homepage (${marker})`);
    }
  }
  if (indexRoute.includes("LandingPage")) {
    failures.push("src/routes/index.tsx must not render the Higgsfield template LandingPage");
  }
  if (indexRoute.includes("ScrollScrub")) {
    failures.push("src/routes/index.tsx must not mount ScrollScrub on the public homepage");
  }
}

const appRoute = read("src/routes/app.tsx");
if (appRoute != null) {
  if (!appRoute.includes('createFileRoute("/app")')) {
    failures.push('src/routes/app.tsx must define the legacy /app route');
  }
  if (!appRoute.includes("redirect")) {
    failures.push("src/routes/app.tsx must redirect away from the generator scaffold");
  }
  if (appRoute.includes("CustomTemplate") || appRoute.includes("previewMode")) {
    failures.push("src/routes/app.tsx must not render CustomTemplate or previewMode");
  }
}

const customLayout = read("src/layouts/custom.tsx");
if (customLayout != null) {
  for (const marker of ['id: "generations"', 'mode="generations"', "<UserGenerations demo", "<PromptBox.Root"]) {
    if (!customLayout.includes(marker)) {
      failures.push(`src/layouts/custom.tsx must keep the generations workspace recipe (${marker})`);
    }
  }
}

const catalog = read("src/content/catalog.ts");
if (catalog != null && !catalog.includes("T.I.R.A. // RIFT")) {
  failures.push("src/content/catalog.ts must keep the T.I.R.A. // RIFT series lockup");
}

for (const asset of [
  "public/assets/hero/cosmic-horizon.jpg",
  "public/assets/hero/cosmic-horizon-1024.jpg",
  "public/brand/og.png",
]) {
  if (!existsSync(join(root, asset))) {
    failures.push(`Missing required public asset: ${asset.replace(/^public\//, "")}`);
  }
}

const metaPath = join(root, "src/app-meta.json");
if (!existsSync(metaPath)) {
  failures.push("src/app-meta.json is required");
} else {
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  for (const field of ["og_title", "og_description", "favicon_url", "og_image_url"]) {
    if (typeof meta[field] !== "string" || meta[field].trim() === "") {
      failures.push(`src/app-meta.json must define ${field}`);
    }
  }
  if (
    meta.marketplace_cover_url != null &&
    typeof meta.marketplace_cover_url !== "string"
  ) {
    failures.push("src/app-meta.json marketplace_cover_url must be a string or null");
  }
}

const kataraRoute = read("src/routes/host.tsx");
if (kataraRoute != null && !kataraRoute.includes("KataraHost")) {
  failures.push("src/routes/host.tsx must render KataraHost");
}

if (failures.length > 0) {
  console.error("Cosmic Ramen site contract is not satisfied:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Cosmic Ramen site contract check passed.");
