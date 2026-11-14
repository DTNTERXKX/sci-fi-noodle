import { beforeAll, expect, test } from "bun:test";

import { createInboxResponse, setInboxDatabaseForTests } from "../src/lib/inbox.server";

type Row = { kind: string; name: string; email: string; note: string; created_at: string };
const rows: Row[] = [];

// In-memory stand-in for the D1 binding (env.DB): records the INSERT the module runs.
const fakeDb = {
  prepare(sql: string) {
    if (!sql.startsWith("INSERT INTO submissions")) throw new Error(`unexpected SQL: ${sql}`);
    return {
      bind(...params: unknown[]) {
        return {
          run: async () => {
            const [kind, name, email, note, created_at] = params as string[];
            rows.push({ kind, name, email, note, created_at });
            return {};
          },
        };
      },
    };
  },
};

beforeAll(() => setInboxDatabaseForTests(fakeDb));

function stamp() {
  return `inbox-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

async function post(body: unknown) {
  return createInboxResponse(
    new Request("http://127.0.0.1/api/inbox", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function stored(email: string) {
  const row = rows.find((item) => item.email === email);
  return row ? { kind: row.kind, name: row.name, email: row.email, note: row.note } : null;
}

function forget(email: string) {
  for (let i = rows.length - 1; i >= 0; i -= 1) if (rows[i].email === email) rows.splice(i, 1);
}

test("a join address is stored and a bad address is refused", async () => {
  const email = stamp();
  const saved = await post({ kind: "join", email: `  ${email.toUpperCase()}  ` });
  expect(saved.status).toBe(200);
  expect(await saved.json()).toEqual({ ok: true });
  expect(stored(email)).toEqual({ kind: "join", name: "", email, note: "" });

  const refused = await post({ kind: "join", email: "not-an-email" });
  expect(refused.status).toBe(400);
  expect(await refused.json()).toEqual({ ok: false, error: "bad_request" });
  forget(email);
});

test("a contact note is stored with the fields the form already sends", async () => {
  const email = stamp();
  const saved = await post({
    kind: "contact",
    name: "  Noodle Guest  ",
    email: `  ${email}  `,
    note: "  We want a partnership conversation about the shop.  ",
  });
  expect(saved.status).toBe(200);
  expect(stored(email)).toEqual({
    kind: "contact",
    name: "Noodle Guest",
    email,
    note: "We want a partnership conversation about the shop.",
  });

  const shortNote = await post({ kind: "contact", name: "Noodle Guest", email, note: "too short" });
  expect(shortNote.status).toBe(400);
  forget(email);
});

test("without a D1 binding the save reports unavailable", async () => {
  setInboxDatabaseForTests(null);
  const response = await post({ kind: "join", email: stamp() });
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
  setInboxDatabaseForTests(fakeDb);
});
