import { NextResponse } from "next/server";
import { z } from "zod";

import type { PlanId } from "@/lib/plans";
import { getStripe, priceIdForPlan } from "@/lib/server/stripe";

const bodySchema = z.object({
  planId: z.enum(["starter", "pro", "agency"]),
});

export async function POST(request: Request) {
  try {
    const { planId } = bodySchema.parse(await request.json());
    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceIdForPlan(planId as PlanId), quantity: 1 }],
      success_url: `${origin}/success?plan=${planId}`,
      cancel_url: `${origin}/#pricing`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { plan_id: planId },
      },
      metadata: { plan_id: planId },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout URL missing." }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
