import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_AGENCY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}

/** Call from health check and critical paths; throws in production when required keys are missing. */
export function assertProductionReady(): { ok: true } | { ok: false; missing: string[] } {
  const env = getServerEnv();
  if (env.NODE_ENV !== "production") {
    return { ok: true };
  }

  const required = [
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_STARTER",
    "STRIPE_PRICE_PRO",
    "STRIPE_PRICE_AGENCY",
    "OPENAI_API_KEY",
    "SESSION_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ] as const;

  const missing = required.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  if (missing.length > 0) {
    return { ok: false, missing: [...missing] };
  }

  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32) {
    return { ok: false, missing: ["SESSION_SECRET (min 32 characters)"] };
  }

  return { ok: true };
}
