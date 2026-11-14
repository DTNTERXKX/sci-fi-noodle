import { z } from "zod";

const emailSchema = z.string().trim().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

const inboxSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("join"),
    email: emailSchema,
  }),
  z.object({
    kind: z.literal("contact"),
    name: z.string().trim().min(2).max(200),
    email: emailSchema,
    note: z.string().trim().min(12).max(4000),
  }),
]);

type D1Like = {
  prepare(sql: string): { bind(...params: unknown[]): { run(): Promise<unknown> } };
};

// Cloudflare D1 binding (env.DB), read through the Workers runtime module.
// The specifier is built at runtime so the Node/Vite build doesn't resolve it.
let testDatabase: D1Like | null = null;

// Tests inject an in-memory stand-in for the D1 binding.
export function setInboxDatabaseForTests(db: D1Like | null) {
  testDatabase = db;
}

async function inboxDatabase(): Promise<D1Like | null> {
  if (testDatabase) return testDatabase;
  try {
    const specifier = ["cloudflare", "workers"].join(":");
    const mod = (await import(specifier)) as { env?: { DB?: D1Like } };
    return mod.env?.DB ?? null;
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function createInboxResponse(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 20_000) return jsonResponse({ ok: false, error: "bad_request" }, 413);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "bad_request" }, 400);
  }

  const parsed = inboxSchema.safeParse(payload);
  if (!parsed.success) return jsonResponse({ ok: false, error: "bad_request" }, 400);

  const row =
    parsed.data.kind === "join"
      ? { kind: "join", name: "", email: parsed.data.email.toLowerCase(), note: "" }
      : parsed.data;

  try {
    const db = await inboxDatabase();
    if (!db) throw new Error("DB binding missing");
    await db
      .prepare("INSERT INTO submissions (kind, name, email, note, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(row.kind, row.name, row.email, row.note, new Date().toISOString())
      .run();
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Inbox save failed", error instanceof Error ? error.name : "");
    return jsonResponse({ ok: false, error: "unavailable" }, 500);
  }
}
