import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { realWatchHref } from "@/content/from-segments";
import {
  flavorBowls,
  isReleased,
  pillarBowls,
  studio,
  universes,
  watchLibrary,
  youtubeFor,
  type ShelfItem,
} from "@/content/catalog";

export type KataraMode = "chill" | "crunk" | "glam";

const VOICE_FILES: Record<KataraMode, string> = {
  chill: "katara_chill.mp3",
  crunk: "katara_crunk.mp3",
  glam: "katara_glam.mp3",
};

const MODE_LABEL: Record<KataraMode, string> = {
  chill: "Chill",
  crunk: "Crunk",
  glam: "Glam",
};

const GREETING_REPLY: Record<KataraMode, string> = {
  chill: "Hey bestie. Welcome to SCI-FI NOODLES. I'm Katara. Tell me a flavor or a title and I'll pour you a bowl.",
  crunk: "YOOO! Welcome in. I'm Katara. Name a bowl and lock in.",
  glam: "Darlings. Welcome to the counter. I'm Katara. Tell me the mood and I'll find your bowl.",
};

const GREETING =
  /^(?:hi|hey|hello|yo|hiya|howdy|sup|greetings|welcome|hi there|hey there|hello there|hi katara|hey katara|hello katara|good morning|good afternoon|good evening|good night|good day|how are you|how are you doing|hows it going|whats up|what is up|whats good)$/;

export function isKataraGreeting(question: string) {
  return GREETING.test(question);
}

type Seed = {
  intent: string;
  phrases: string[];
  weight: number;
  body: string;
};

type Stored = {
  intent: string;
  keywords: string;
  weight: number;
  body: string;
};

const talkSchema = z.object({
  message: z.string().trim().min(1).max(500),
  mode: z.enum(["chill", "crunk", "glam"]),
  history: z.unknown().optional(),
});

type SqlStatement<T> = {
  all(...params: unknown[]): T[];
  get(...params: unknown[]): T | null;
  run(...params: unknown[]): void;
};

type SqlDatabase = {
  exec(sql: string): void;
  query<T = Record<string, unknown>>(sql: string): SqlStatement<T>;
};

const globalStore = globalThis as typeof globalThis & {
  __kataraDb?: SqlDatabase;
  __kataraOpening?: Promise<SqlDatabase>;
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY,
    intent TEXT NOT NULL,
    keywords TEXT NOT NULL,
    weight INTEGER NOT NULL,
    body TEXT NOT NULL
  );
`;

function wrapStatements(db: {
  exec(sql: string): void;
  query(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): void;
  };
}): SqlDatabase {
  return {
    exec(sql) {
      db.exec(sql);
    },
    query<T>(sql: string): SqlStatement<T> {
      const statement = db.query(sql);
      return {
        all: (...params) => statement.all(...params) as T[],
        get: (...params) => (statement.get(...params) as T | null | undefined) ?? null,
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

let seededFingerprint = "";
let voicesReady = false;

export function normalizeQuestion(input: string) {
  return input
    .toLowerCase()
    .replace(/t\s*\.\s*i\s*\.\s*r\s*\.\s*a\s*\.?/g, "tira")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

export function kataraDbPath() {
  return resolve(findAppRoot(), "data", "katara.sqlite");
}

function studioVoicePath(mode: KataraMode) {
  return resolve(findAppRoot(), "..", "..", "UGC", "voices", VOICE_FILES[mode]);
}

function publicVoicePath(mode: KataraMode) {
  return resolve(findAppRoot(), "public", "voices", VOICE_FILES[mode]);
}

function link(title: string, href: string) {
  const safe = href.startsWith("/") && !href.startsWith("//") ? href : "/watch";
  return `[${title.replaceAll("[", "").replaceAll("]", "")}](${safe})`;
}

function titlePhrases(title: string) {
  const full = normalizeQuestion(title);
  const phrases = [full];
  const bare = full.replace(/^the /, "");
  if (bare !== full) phrases.push(bare);
  const splitAt = title.indexOf(":");
  if (splitAt > 0) {
    const head = normalizeQuestion(title.slice(0, splitAt));
    const tail = normalizeQuestion(title.slice(splitAt + 1));
    phrases.push(head, head.replace(/^the /, ""), tail, tail.replace(/^the /, ""));
  }
  return phrases.map((phrase) => phrase.trim()).filter((phrase) => phrase.length >= 4);
}

/** Sort key for the printed calendar date. Live versus coming soon uses isReleased (America/Chicago). */
function calendarUtc(date: string) {
  const match = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/.exec(date.trim());
  if (!match) return null;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(match[1]);
  if (month < 0) return null;
  return Date.UTC(Number(match[3]), month, Number(match[2]));
}

function liveUrl(title: string, date: string) {
  if (!isReleased(date)) return null;
  return realWatchHref(youtubeFor(title)) ?? null;
}

function titleBody(item: ShelfItem) {
  const linked = link(item.title, item.href);
  const live = liveUrl(item.title, item.date);
  const hook = item.hook && item.hook.length <= 110 ? ` ${item.hook}` : "";
  if (live) return `${linked} is on the counter.${hook} It is live at ${live}.`;
  if (isReleased(item.date)) return `${linked} is on the menu, dated ${item.date}.${hook}`;
  if (calendarUtc(item.date)) return `${linked} premieres ${item.date}. It is not live yet.`;
  return `${linked} is on the menu and not live yet.`;
}

function seriesBody(universe: (typeof universes)[number]) {
  const linked = link(universe.title, `/originals/${universe.slug}`);
  const live = universe.episodes.flatMap((episode) => {
    const title = `${universe.title}: ${episode.title}`;
    const url = liveUrl(title, episode.date);
    return url ? [`${episode.title} is live at ${url}`] : [];
  });
  const released = universe.episodes.filter((episode) => isReleased(episode.date));
  const tail = live.length
    ? `${live.join(". ")}.`
    : released.length
      ? "What is out so far is on the series page. There is no separate channel link on the menu."
      : "Nothing from it is live on the channel yet.";
  return `${linked}. ${universe.logline} ${universe.status}. ${tail}`;
}

function premiereBody(items: ShelfItem[]) {
  const upcoming = items
    .map((item) => ({ item, utc: calendarUtc(item.date) }))
    .filter((row): row is { item: ShelfItem; utc: number } => row.utc != null && !isReleased(row.item.date))
    .sort((a, b) => a.utc - b.utc || a.item.title.localeCompare(b.item.title));
  if (!upcoming.length) return `Nothing dated is waiting. The board is ${link("Watch", "/watch")}.`;
  const next = upcoming.filter((row) => row.utc === upcoming[0].utc).slice(0, 2);
  const named = next.map((row) => `${link(row.item.title, row.item.href)} on ${row.item.date}`).join(" and ");
  return `Next on the board: ${named}. Not live yet.`;
}

function buildSeed(): Stored[] {
  const drafts: Seed[] = [
    {
      intent: "shop",
      weight: 1,
      phrases: ["sci fi noodles", "cosmic ramen", "the menu", "what do you serve", "about the shop", "different flavors"],
      body: `SCI-FI NOODLES is a cosmic ramen shop. ${studio.line} Every film is a bowl. Pillars say where it comes from, flavors say how it feels. Start at ${link("Watch", "/watch")}.`,
    },
    {
      intent: "watch",
      weight: 2,
      phrases: ["how to watch", "how do i watch", "where do i watch", "where can i watch", "youtube", "your channel", "the channel"],
      body: `The whole menu is on ${link("Watch", "/watch")}. The channel is ${studio.youtube}.`,
    },
    {
      intent: "premiere",
      weight: 2,
      phrases: ["premiere", "next premiere", "whats next", "what is next", "coming soon", "release date", "when is the next"],
      body: premiereBody(watchLibrary()),
    },
    {
      intent: "host",
      weight: 2,
      phrases: ["who are you", "your name", "whats your name", "which mode", "chill mode", "crunk mode", "glam mode", "about katara", "chill", "crunk", "glam"],
      body: "I'm Katara. I run the counter in chill, crunk, or glam. Tell me a flavor or a title and I'll point you at the bowl.",
    },
    {
      intent: "fallback",
      weight: 0,
      phrases: [],
      body: `I don't have that on the pass. Point me at a flavor or a title, or open ${link("Watch", "/watch")}.`,
    },
  ];

  for (const bowl of pillarBowls) {
    drafts.push({
      intent: "bowl",
      weight: 3,
      phrases: [
        ...titlePhrases(bowl.name),
        normalizeQuestion(bowl.category),
        normalizeQuestion(bowl.short),
        bowl.id === "black-hole" ? "originals" : "",
        bowl.id === "timewarp" ? "public domain" : "",
        bowl.id === "cyberpunk" ? "the lab" : "",
      ],
      body: `${link(bowl.name, bowl.href)} is ${bowl.category}. ${bowl.tagline}`,
    });
  }

  for (const bowl of flavorBowls) {
    const sample = watchLibrary().find((item) => item.flavors.includes(bowl.flavor) && liveUrl(item.title, item.date));
    const board = link(bowl.name, `/watch?flavor=${bowl.flavor}`);
    const sampleLine = sample
      ? ` ${link(sample.title, sample.href)} is live at ${liveUrl(sample.title, sample.date)}.`
      : "";
    const mood =
      bowl.flavor === "quantum-fire"
        ? ["hype", "spicy", "action", "sci fi shorts", "shorts"]
        : bowl.flavor === "nebula-miso"
          ? ["documentaries", "documentary", "lore"]
          : ["asmr", "ambience", "atmosphere", "atmospheres", "something chill", "cozy", "calm", "relax"];
    drafts.push({
      intent: "flavor",
      weight: 3,
      phrases: [...titlePhrases(bowl.name), normalizeQuestion(bowl.short), normalizeQuestion(bowl.category), ...mood],
      body: `${bowl.name} is ${bowl.category}. ${bowl.tagline}${sampleLine} The board is ${board}.`,
    });
  }

  for (const universe of universes) {
    const extra = universe.slug === "tira-rift" ? ["amara", "amara kade", "dimension n"] : universe.slug === "the-stranger" ? ["cryo", "colony ship"] : ["bluff city", "whitehaven"];
    drafts.push({
      intent: "series",
      weight: 4,
      phrases: [...titlePhrases(universe.title), ...extra],
      body: seriesBody(universe),
    });
  }

  for (const item of watchLibrary()) {
    drafts.push({
      intent: "title",
      weight: 5,
      phrases: titlePhrases(item.title),
      body: titleBody(item),
    });
  }

  drafts.push(
    { intent: "mode", weight: 0, phrases: ["chill"], body: "Hey bestie. {body}" },
    { intent: "mode", weight: 0, phrases: ["crunk"], body: "YOOO! {body} Lock in!" },
    { intent: "mode", weight: 0, phrases: ["glam"], body: "Darlings. {body}" },
  );

  const facts = drafts.filter((row) => row.intent !== "mode");
  const owners = new Map<string, number[]>();
  facts.forEach((row, index) => {
    for (const phrase of new Set(row.phrases.filter((phrase) => phrase.length >= 4))) {
      const list = owners.get(phrase) ?? [];
      list.push(index);
      owners.set(phrase, list);
    }
  });

  const stored: Stored[] = facts.map((row, index) => {
    const phrases = [...new Set(row.phrases.filter((phrase) => phrase.length >= 4))].filter((phrase) => {
      const list = owners.get(phrase) ?? [];
      if (list.length <= 1) return true;
      const lightest = Math.min(...list.map((owner) => facts[owner].weight));
      const keeper = list.find((owner) => facts[owner].weight === lightest) ?? list[0];
      return row.weight === lightest && keeper === index;
    });
    return { intent: row.intent, keywords: phrases.join("|"), weight: row.weight, body: row.body };
  });

  for (const mode of drafts.filter((row) => row.intent === "mode")) {
    stored.push({ intent: "mode", keywords: mode.phrases[0] ?? "", weight: 0, body: mode.body });
  }
  return stored;
}

const seedRows = buildSeed();
const seedFingerprint = createHash("sha256").update(JSON.stringify(seedRows)).digest("hex").slice(0, 16);

function database() {
  if (globalStore.__kataraDb) return Promise.resolve(globalStore.__kataraDb);
  if (!globalStore.__kataraOpening) {
    const path = kataraDbPath();
    mkdirSync(resolve(path, ".."), { recursive: true });
    globalStore.__kataraOpening = openDatabase(path)
      .then((db) => {
        db.exec(SCHEMA);
        globalStore.__kataraDb = db;
        return db;
      })
      .catch((error: unknown) => {
        globalStore.__kataraOpening = undefined;
        throw error;
      });
  }
  return globalStore.__kataraOpening;
}

function writeSeed(db: SqlDatabase) {
  const insert = db.query("INSERT INTO answers (intent, keywords, weight, body) VALUES (?, ?, ?, ?)");
  const save = db.query(
    "INSERT INTO meta (key, value) VALUES ('seed', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec("DELETE FROM answers");
    for (const row of seedRows) insert.run(row.intent, row.keywords, row.weight, row.body);
    save.run(seedFingerprint);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

async function loadAnswers() {
  const db = await database();
  if (seededFingerprint !== seedFingerprint) {
    const current = db.query<{ value: string }>("SELECT value FROM meta WHERE key = 'seed'").get();
    if (current?.value !== seedFingerprint) writeSeed(db);
    seededFingerprint = seedFingerprint;
  }
  return db.query<Stored>("SELECT intent, keywords, weight, body FROM answers").all();
}

function scoreRow(question: string, row: Stored) {
  if (!row.keywords || row.intent === "mode" || row.intent === "fallback") return 0;
  let best = 0;
  for (const phrase of row.keywords.split("|")) {
    if (phrase.length >= 4 && question.includes(phrase)) best = Math.max(best, phrase.length * row.weight);
  }
  return best;
}

function ensureVoices() {
  if (voicesReady) return;
  voicesReady = true;
  const dir = resolve(findAppRoot(), "public", "voices");
  mkdirSync(dir, { recursive: true });
  for (const mode of Object.keys(VOICE_FILES) as KataraMode[]) {
    const source = studioVoicePath(mode);
    if (!existsSync(source)) continue;
    copyFileSync(source, publicVoicePath(mode));
  }
}

function voiceFor(mode: KataraMode) {
  ensureVoices();
  if (!existsSync(publicVoicePath(mode))) {
    return {
      voice: null as string | null,
      voiceNote: `No locked voice file for ${MODE_LABEL[mode]} is on this machine.`,
    };
  }
  return { voice: `/voices/${VOICE_FILES[mode]}`, voiceNote: null as string | null };
}

export async function answerKatara(message: string, mode: KataraMode) {
  const question = normalizeQuestion(message);
  if (isKataraGreeting(question)) {
    return {
      reply: GREETING_REPLY[mode],
      ...voiceFor(mode),
    };
  }
  const rows = await loadAnswers();
  let best: Stored | undefined;
  let bestScore = 0;
  for (const row of rows) {
    const score = scoreRow(question, row);
    if (score > bestScore || (score === bestScore && score > 0 && best && row.weight > best.weight)) {
      best = row;
      bestScore = score;
    }
  }
  const fact = bestScore > 0 && best ? best : rows.find((row) => row.intent === "fallback");
  const body = fact?.body ?? `Point me at a flavor or a title, or open ${link("Watch", "/watch")}.`;
  const template = rows.find((row) => row.intent === "mode" && row.keywords === mode)?.body ?? "{body}";
  return {
    reply: template.replace("{body}", body),
    ...voiceFor(mode),
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function createKataraTalkResponse(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 20_000) return jsonResponse({ ok: false, error: "bad_request" }, 413);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "bad_request" }, 400);
  }
  const parsed = talkSchema.safeParse(payload);
  if (!parsed.success) return jsonResponse({ ok: false, error: "bad_request" }, 400);

  try {
    const answer = await answerKatara(parsed.data.message, parsed.data.mode);
    return jsonResponse({ ok: true, ...answer });
  } catch (error) {
    console.error("Katara menu lookup failed", error instanceof Error ? error.name : "");
    return jsonResponse({ ok: false, error: "menu_unavailable" }, 500);
  }
}
