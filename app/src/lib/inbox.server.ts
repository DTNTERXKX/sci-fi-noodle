import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

type SqlStatement = {
  get(...params: unknown[]): { id: number } | null;
  run(...params: unknown[]): void;
};

type SqlDatabase = {
  exec(sql: string): void;
  query(sql: string): SqlStatement;
};

const globalStore = globalThis as typeof globalThis & {
  __inboxDb?: SqlDatabase;
  __inboxOpening?: Promise<SqlDatabase>;
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`;

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

function findAppRoot() {
  const starts = [process.cwd(), fileURLToPath(new URL(".", import.meta.url))];
  for (const start of starts) {
    let dir = start;
    for (let hop = 0; hop < 6; hop += 1) {
      if (existsSync(resolve(dir, "src", "content", "catalog.ts"))) return dir;
      const parent = resolve(dir, "..");
      if (parent === dir) break;
      dir = parent;
    }
  }
  return process.cwd();
}

export function inboxDbPath() {
  return resolve(findAppRoot(), "data", "inbox.sqlite");
}

function wrapStatements(db: {
  exec(sql: string): void;
  query(sql: string): {
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): void;
  };
}): SqlDatabase {
  return {
    exec(sql) {
      db.exec(sql);
    },
    query(sql) {
      const statement = db.query(sql);
      return {
        get: (...params) => (statement.get(...params) as { id: number } | null | undefined) ?? null,
        run: (...params) => {
          statement.run(...params);
        },
      };
    },
  };
}

async function openDatabase(path: string): Promise<SqlDatabase> {
  const runtime = globalThis as typeof globalThis & { Bun?: unknown };
  if (runtime.Bun) {
    const specifier = ["bun", "sqlite"].join(":");
    const sqlite = (await import(specifier)) as typeof import("bun:sqlite");
    const db = new sqlite.Database(path);
    return wrapStatements({
      exec: (sql) => db.exec(sql),
      query: (sql) => db.query(sql),
    });
  }
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(path);
  return wrapStatements({
    exec: (sql) => {
      db.exec(sql);
    },
    query: (sql) => db.prepare(sql),
  });
}

function database() {
  if (globalStore.__inboxDb) return Promise.resolve(globalStore.__inboxDb);
  if (!globalStore.__inboxOpening) {
    const path = inboxDbPath();
    mkdirSync(resolve(path, ".."), { recursive: true });
    globalStore.__inboxOpening = openDatabase(path)
      .then((db) => {
        db.exec(SCHEMA);
        globalStore.__inboxDb = db;
        return db;
      })
      .catch((error: unknown) => {
        globalStore.__inboxOpening = undefined;
        throw error;
      });
  }
  return globalStore.__inboxOpening;
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
    const db = await database();
    db.query("INSERT INTO submissions (kind, name, email, note, created_at) VALUES (?, ?, ?, ?, ?)").run(
      row.kind,
      row.name,
      row.email,
      row.note,
      new Date().toISOString(),
    );
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Inbox save failed", error instanceof Error ? error.name : "");
    return jsonResponse({ ok: false, error: "unavailable" }, 500);
  }
}
