import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import type { SiteSpecV2 } from "@/lib/site-schema";
import { getPlanLimits, type PlanId } from "@/lib/plans";

import { getDb } from "./db";
import { siteVersions, sites, type Site, type User } from "./schema";
import { allocateUniqueSubdomain } from "./subdomain";

export async function countSitesForUser(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sites)
    .where(eq(sites.userId, userId));
  return rows[0]?.count ?? 0;
}

export async function listSitesForUser(userId: string): Promise<Site[]> {
  const db = getDb();
  return db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.updatedAt));
}

export async function createSiteWithVersion(input: {
  user: User;
  name: string;
  spec: SiteSpecV2;
  source: "ai_build" | "ai_edit" | "user_edit" | "refresh";
  note?: string;
}): Promise<{ site: Site; versionId: string }> {
  if (!input.user.plan) {
    throw new Error("User has no plan.");
  }
  const limits = getPlanLimits(input.user.plan as PlanId);
  const count = await countSitesForUser(input.user.id);
  if (count >= limits.sites) {
    throw new Error(`Site limit reached (${limits.sites}). Upgrade your plan to add more sites.`);
  }

  const db = getDb();
  const subdomain = await allocateUniqueSubdomain(input.name);

  const insertedSite = await db
    .insert(sites)
    .values({
      userId: input.user.id,
      name: input.name.trim(),
      subdomain,
    })
    .returning();

  const site = insertedSite[0]!;

  const insertedVersion = await db
    .insert(siteVersions)
    .values({
      siteId: site.id,
      spec: input.spec,
      source: input.source,
      note: input.note ?? null,
    })
    .returning();

  const version = insertedVersion[0]!;

  const updated = await db
    .update(sites)
    .set({
      currentVersionId: version.id,
      updatedAt: new Date(),
    })
    .where(eq(sites.id, site.id))
    .returning();

  return { site: updated[0]!, versionId: version.id };
}
