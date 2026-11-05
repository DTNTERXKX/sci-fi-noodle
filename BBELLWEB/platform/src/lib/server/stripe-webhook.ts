import "server-only";

import type Stripe from "stripe";

import { getStripe, snapshotFromSubscription } from "./stripe";
import { upsertUserFromStripe } from "./users";

async function emailForCustomer(customerId: string): Promise<string | null> {
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  return customer.email ?? null;
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripe();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email =
      session.customer_email ??
      (typeof session.customer_details?.email === "string" ? session.customer_details.email : null);
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;

    let resolvedEmail = email;
    if (!resolvedEmail && customerId) {
      resolvedEmail = await emailForCustomer(customerId);
    }
    if (!resolvedEmail || !subscriptionId) return;

    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    });
    const snapshot = snapshotFromSubscription(sub);
    await upsertUserFromStripe(resolvedEmail, snapshot);
    return;
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const email = await emailForCustomer(customerId);
    if (!email) return;
    const snapshot = snapshotFromSubscription(sub);
    await upsertUserFromStripe(email, snapshot);
  }
}
