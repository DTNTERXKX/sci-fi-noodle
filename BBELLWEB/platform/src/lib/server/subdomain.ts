import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "./db";
import { sites } from "./schema";

export function slugifySubdomain(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length >= 3 ? base : "site";
}

export async function allocateUniqueSubdomain(name: string): Promise<string> {
  const db = getDb();
  let candidate = slugifySubdomain(name);
  let suffix = 0;
  for (;;) {
    const rows = await db.select({ id: sites.id }).from(sites).where(eq(sites.subdomain, candidate)).limit(1);
    if (rows.length === 0) return candidate;
    suffix += 1;
    candidate = `${slugifySubdomain(name).slice(0, 40)}-${suffix}`;
  }
}
