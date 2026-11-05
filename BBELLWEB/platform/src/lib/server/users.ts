import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "./db";
import { users, type User } from "./schema";
import type { StripeSubscriptionSnapshot } from "./stripe";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return rows[0];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

export async function upsertUserFromStripe(
  email: string,
  snapshot: StripeSubscriptionSnapshot,
): Promise<User> {
  const db = getDb();
  const normalized = normalizeEmail(email);
  const existing = await getUserByEmail(normalized);

  const plan = snapshot.status === "canceled" ? null : snapshot.plan;

  if (existing) {
    const updated = await db
      .update(users)
      .set({
        stripeCustomerId: snapshot.stripeCustomerId,
        plan,
        addonDfy: snapshot.addonDfy,
        status: snapshot.status,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated[0]!;
  }

  const inserted = await db
    .insert(users)
    .values({
      email: normalized,
      stripeCustomerId: snapshot.stripeCustomerId,
      plan,
      addonDfy: snapshot.addonDfy,
      status: snapshot.status,
    })
    .returning();
  return inserted[0]!;
}

export function userHasStudioAccess(user: User): boolean {
  return user.status === "active" && user.plan != null;
}
