import "server-only";

import Stripe from "stripe";

import type { PlanId } from "@/lib/plans";
import { planIdFromStripePriceId, stripePriceEnvKey } from "@/lib/plans";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  return new Stripe(key);
}

export function priceIdForPlan(planId: PlanId): string {
  const priceId = process.env[stripePriceEnvKey(planId)];
  if (!priceId?.startsWith("price_")) {
    throw new Error(`Set ${stripePriceEnvKey(planId)} to your Stripe Price ID.`);
  }
  return priceId;
}

export function isDfyPriceId(priceId: string): boolean {
  const dfy = process.env.STRIPE_PRICE_DFY;
  return Boolean(dfy && dfy === priceId);
}

export type StripeSubscriptionSnapshot = {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: PlanId | null;
  addonDfy: boolean;
  status: "active" | "past_due" | "canceled";
};

export function mapStripeSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status,
): "active" | "past_due" | "canceled" {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "past_due";
  return "canceled";
}

export function snapshotFromSubscription(sub: Stripe.Subscription): StripeSubscriptionSnapshot {
  let plan: PlanId | null = null;
  let addonDfy = false;
  for (const item of sub.items.data) {
    const priceId = item.price.id;
    if (isDfyPriceId(priceId)) {
      addonDfy = true;
      continue;
    }
    const mapped = planIdFromStripePriceId(priceId);
    if (mapped) plan = mapped;
  }
  const metaPlan = sub.metadata?.plan_id;
  if (!plan && (metaPlan === "starter" || metaPlan === "pro" || metaPlan === "agency")) {
    plan = metaPlan;
  }
  return {
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    plan,
    addonDfy,
    status: mapStripeSubscriptionStatus(sub.status),
  };
}

export async function fetchActiveSubscriptionForEmail(
  email: string,
): Promise<StripeSubscriptionSnapshot | null> {
  const stripe = getStripe();
  const customers = await stripe.customers.list({ email, limit: 5 });
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
      expand: ["data.items.data.price"],
    });
    const preferred =
      subs.data.find((s) => s.status === "active" || s.status === "trialing") ??
      subs.data.find((s) => s.status === "past_due") ??
      subs.data[0];
    if (preferred) {
      return snapshotFromSubscription(preferred);
    }
  }
  return null;
}
