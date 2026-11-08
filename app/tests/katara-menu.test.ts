import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "bun:test";

import { createKataraTalkResponse, kataraDbPath } from "../src/lib/katara.server";

const appRoot = resolve(import.meta.dir, "..");
const shippedVoices = ["katara_chill.mp3", "katara_crunk.mp3", "katara_glam.mp3"].map((name) =>
  resolve(appRoot, "public", "voices", name),
);

async function ask(message: string, mode: "chill" | "crunk" | "glam" = "chill") {
  const response = await createKataraTalkResponse(
    new Request("http://127.0.0.1/api/katara/talk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, mode, history: [{ role: "user", content: "ignored" }] }),
    }),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  return (await response.json()) as { ok: boolean; reply: string; voice: string | null; voiceNote: string | null };
}

test("answers from sqlite and plays the locked chill voice", async () => {
  const payload = await ask("Where can I watch Neo-Osaka Rain?");
  expect(payload.ok).toBe(true);
  expect(payload.reply.startsWith("Hey bestie.")).toBe(true);
  expect(payload.reply).toContain("[Neo-Osaka Rain](/atmospheres)");
  expect(payload.reply).toContain("https://www.youtube.com/watch?v=G-YEM6LOE8Y");
  expect(payload.voice).toBe("/voices/katara_chill.mp3");
  expect(payload.voiceNote).toBeNull();
  expect(existsSync(kataraDbPath())).toBe(true);

  const hashes = shippedVoices.map((file) => createHash("sha256").update(readFileSync(file)).digest("hex"));
  for (const hash of hashes) expect(hash).toMatch(/^[a-f0-9]{64}$/);
  expect(new Set(hashes).size).toBe(shippedVoices.length);
});

test("frankenstein uses the stored video url and never a youtube search", async () => {
  const payload = await ask("When is Frankenstein: The Commit?");
  expect(payload.reply).toContain("https://youtu.be/8bp4f2vml6A");
  expect(payload.reply.toLowerCase()).not.toContain("not live yet");
  expect(payload.reply).not.toContain("youtube.com/results");
  expect(payload.reply).not.toContain("search_query");
});

test("a future title is not given a made-up youtube url", async () => {
  const payload = await ask("When is The Ball Crashers?");
  expect(payload.reply).toContain("Nov 13, 2026");
  expect(payload.reply.toLowerCase()).toContain("not live yet");
  expect(payload.reply).not.toContain("youtube.com");
  expect(payload.reply).not.toContain("youtu.be");
});

test("a released title with no video is not handed a youtube search", async () => {
  const payload = await ask("Where is Failed noodles?");
  expect(payload.reply.toLowerCase()).toContain("failed noodles");
  expect(payload.reply).not.toContain("youtube.com/results");
  expect(payload.reply).not.toContain("search_query");
  expect(payload.reply).not.toContain("youtu.be");
});

test("an unknown question points at the menu", async () => {
  const payload = await ask("How many moons does the shop cat have?", "crunk");
  expect(payload.reply.startsWith("YOOO!")).toBe(true);
  expect(payload.reply).toContain("[Watch](/watch)");
  expect(payload.reply).not.toContain("youtube.com");
  expect(payload.voice).toBe("/voices/katara_crunk.mp3");
});

test("the answer module does not call openai, elevenlabs, or musetalk", async () => {
  const source = await Bun.file(new URL("../src/lib/katara.server.ts", import.meta.url)).text();
  const host = await Bun.file(new URL("../src/components/site/katara-host.tsx", import.meta.url)).text();
  for (const text of [source, host]) {
    expect(text.toLowerCase()).not.toContain("openai");
    expect(text.toLowerCase()).not.toContain("elevenlabs");
    expect(text.toLowerCase()).not.toContain("musetalk");
    expect(text).not.toContain("api.openai.com");
  }
});
