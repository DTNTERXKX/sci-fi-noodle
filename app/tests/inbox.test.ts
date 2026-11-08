import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";

import { createInboxResponse, inboxDbPath } from "../src/lib/inbox.server";

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
  const db = new Database(inboxDbPath(), { readonly: true });
  try {
    return db.query("SELECT kind, name, email, note FROM submissions WHERE email = ?").get(email) as
      | { kind: string; name: string; email: string; note: string }
      | null;
  } finally {
    db.close();
  }
}

function forget(email: string) {
  const db = new Database(inboxDbPath());
  try {
    db.query("DELETE FROM submissions WHERE email = ?").run(email);
  } finally {
    db.close();
  }
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
