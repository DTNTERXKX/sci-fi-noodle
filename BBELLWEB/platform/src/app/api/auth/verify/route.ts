import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { COOKIE, MAX_AGE_SEC, signAccessEmail } from "@/lib/session";
import { fetchActiveSubscriptionForEmail } from "@/lib/server/stripe";
import { getUserByEmail, upsertUserFromStripe, userHasStudioAccess } from "@/lib/server/users";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const { email } = bodySchema.parse(await request.json());
    const normalized = email.trim().toLowerCase();

    let user = await getUserByEmail(normalized);
    if (!user || !userHasStudioAccess(user)) {
      const snapshot = await fetchActiveSubscriptionForEmail(normalized);
      if (!snapshot || snapshot.status === "canceled" || !snapshot.plan) {
        return NextResponse.json(
          { error: "No active subscription found for this email." },
          { status: 403 },
        );
      }
      user = await upsertUserFromStripe(normalized, snapshot);
    }

    if (!userHasStudioAccess(user)) {
      return NextResponse.json(
        { error: "No active subscription found for this email." },
        { status: 403 },
      );
    }

    const token = signAccessEmail(normalized);
    const jar = await cookies();
    jar.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SEC,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    if (message.includes("DATABASE_URL")) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
