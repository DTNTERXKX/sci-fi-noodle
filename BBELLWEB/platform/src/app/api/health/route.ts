import { NextResponse } from "next/server";

import { assertProductionReady } from "@/lib/server/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = assertProductionReady();
  if (!readiness.ok) {
    return NextResponse.json(
      {
        status: "degraded",
        missing: readiness.missing,
      },
      { status: 503 },
    );
  }

  let database: "ok" | "error" | "skipped" = "skipped";
  if (process.env.DATABASE_URL) {
    try {
      const { sql } = await import("drizzle-orm");
      const { getDb } = await import("@/lib/server/db");
      const db = getDb();
      await db.execute(sql`select 1`);
      database = "ok";
    } catch {
      database = "error";
    }
  }

  const ok = database !== "error";
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      database,
      env: process.env.NODE_ENV ?? "unknown",
    },
    { status: ok ? 200 : 503 },
  );
}
