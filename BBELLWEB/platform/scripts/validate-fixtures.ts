import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { siteSpecV2Schema } from "../src/lib/site-schema";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../src/fixtures");
const files = readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));

let failed = false;
for (const file of files) {
  const raw = JSON.parse(readFileSync(join(fixturesDir, file), "utf8"));
  const result = siteSpecV2Schema.safeParse(raw);
  if (!result.success) {
    failed = true;
    console.error(`FAIL ${file}:`, result.error.message);
  } else {
    console.log(`OK ${file} (${result.data.pages.length} pages)`);
  }
}

if (failed) process.exit(1);
