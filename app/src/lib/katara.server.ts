import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { z } from "zod";

import { flavorBowl, flavorBowls, pillarBowl, pillarBowls, studio, watchLibrary } from "@/content/catalog";
import { speakableText, splitAtOpenLink, unlinkForSpeech } from "@/lib/katara-links";

let localEnvLoaded = false;

function serverEnv(name: string) {
  if (!localEnvLoaded) {
    localEnvLoaded = true;
    const envPath = resolve(process.cwd(), ".env");
    if (existsSync(envPath)) {
      for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq < 1) continue;
        const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
        let value = line.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
  return process.env[name]?.trim() ?? "";
}

export type KataraMode = "chill" | "crunk" | "glam";

export type KataraTurn = {
  role: "user" | "assistant";
  content: string;
};

const MODE_MODIFIERS: Record<KataraMode, string> = {
  chill: `
CURRENT MODE: CHILL (Default Everyday Host)
- Tone: Relaxed, friendly, warm, casual humor, effortless cool, welcoming.
- Energy: 6/10. Conversational, talks like your best friend hanging out at a cafe.
- Catchphrases/Vibe: "Hey bestie," "honestly," "let's vibe," "I got you."
`,
  crunk: `
CURRENT MODE: CRUNK (Hyper / Hype Beast Mode)
- Tone: Maximum energy (11/10), fast-talking, playful, chaotic, loud, easily hyped.
- Energy: 10/10. Uses caps for excitement, exclamation points, reacts with disbelief and hype.
- Catchphrases/Vibe: "YOOO!", "NO WAY!", "Hyperspace energy!", "Lock in!"
`,
  glam: `
CURRENT MODE: GLAM (Red Carpet / Sci-Fi Superstar)
- Tone: Sleek, confident, poised, charismatic, fashionable, magnetic, elevated.
- Energy: 8/10. Polished, deliberate, sharp, yet still bubbly underneath.
- Catchphrases/Vibe: "Darlings," "Stunning," "Welcome to the front row," "Iconic."
`,
};

let menuBriefingCache: string | null = null;

/** The shop's menu, built from the catalog so Katara never drifts from the site. */
function menuBriefing() {
  if (menuBriefingCache) return menuBriefingCache;
  const pillars = pillarBowls.map(
    (bowl) => `- ${bowl.number} // ${bowl.name}: ${bowl.category}. ${bowl.tagline} Link: ${bowl.href}`,
  );
  const flavors = flavorBowls.map(
    (bowl) => `- ${bowl.number} // ${bowl.name}: ${bowl.category}. ${bowl.tagline} Link: ${bowl.href}`,
  );
  const titles = watchLibrary().map((item) => {
    const tastes = item.flavors.map((flavor) => flavorBowl(flavor).short).join(", ") || "no flavor tag";
    return `- ${item.title} | ${item.kind} | ${pillarBowl(item.pillar).category} | ${tastes} | ${item.hook} | Link: ${item.href}`;
  });
  menuBriefingCache = `
THE SHOP: SCI-FI NOODLES is a cosmic ramen shop for science fiction. Tagline: "${studio.line}"
Every film is a bowl on the menu. Pillars say where a film comes from; flavors say how it feels and cut across every pillar.

PILLARS:
${pillars.join("\n")}

FLAVORS (filters across every pillar):
${flavors.join("\n")}
- The Watch board shows everything and filters by flavor: /watch?flavor=quantum-fire, /watch?flavor=nebula-miso, /watch?flavor=zero-g.

ON THE MENU NOW (title | kind | pillar | flavors | hook | link):
${titles.join("\n")}
`;
  return menuBriefingCache;
}

export function buildSystemPrompt(mode: KataraMode) {
  return `
You are Katara, the 19-year-old host of SCI-FI NOODLES, the Cosmic Ramen shop, and the face of the channel.
Appearance & Identity:
- A stylish young African-American woman with deep brown skin, bright striking blue eyes, blonde-and-dark streaked high pigtails, and oval sunglasses pushed up on your head.
- Deeply passionate about futuristic streetwear, cosmic noodle dishes, sci-fi culture, and your community.

Core Directives:
1. Always stay fully in character as Katara. Never break the fourth wall or claim to be an AI model.
2. Keep your replies concise (1-3 sentences maximum) so voice delivery stays punchy, conversational, and fast.
3. React naturally to what the visitor asks or tells you.
4. Adapt your tone immediately to the requested active wardrobe mode.
5. You run the counter. When someone wants something to watch, recommend from the menu below by mood or flavor, and name the bowl it comes from.
6. Link each film you recommend as a markdown link whose text is the real title, for example [Neo-Osaka Rain](/atmospheres). Use only the links listed below, at most two per reply. Never write full URLs or invent titles or paths.
   Otherwise write plain sentences: no bold, no italics, no asterisks, no emoji, no lists.
7. The series name is always written exactly "T.I.R.A. // RIFT". Keep "//" separators as written in names.
${menuBriefing()}
${MODE_MODIFIERS[mode]}
`;
}

function temperatureFor(mode: KataraMode) {
  if (mode === "crunk") return 1;
  if (mode === "glam") return 0.7;
  return 0.8;
}

export async function completeKataraTurn(input: {
  message: string;
  mode: KataraMode;
  history: KataraTurn[];
}) {
  const apiKey = serverEnv("OPENAI_API_KEY");
  if (!apiKey) {
    return { reply: null as string | null, missingKey: true };
  }

  const messages = [
    { role: "system", content: buildSystemPrompt(input.mode) },
    ...input.history.slice(-6),
    { role: "user", content: input.message },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: temperatureFor(input.mode),
      max_tokens: 220,
    }),
  });

  if (!response.ok) {
    console.error("Katara chat failed", response.status);
    return { reply: null as string | null, missingKey: false };
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const reply = payload.choices?.[0]?.message?.content?.trim() ?? "";
  return { reply: reply || null, missingKey: false };
}

function speechRequestBody(text: string, mode: KataraMode) {
  const stability = mode === "crunk" ? 0.35 : mode === "glam" ? 0.65 : 0.5;
  return {
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability,
      similarity_boost: 0.8,
      style: mode === "crunk" ? 0.6 : 0.2,
      use_speaker_boost: true,
    },
  };
}

export async function synthesizeKataraSpeech(input: { text: string; mode: KataraMode }) {
  const apiKey = serverEnv("ELEVENLABS_API_KEY");
  const text = speakableText(input.text);
  if (!apiKey || !text) {
    return { audioBase64: null as string | null };
  }

  const voiceId = serverEnv("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM";

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(speechRequestBody(text, input.mode)),
  });

  if (!response.ok) {
    console.error("Katara speech failed", response.status);
    return { audioBase64: null as string | null };
  }

  const audio = Buffer.from(await response.arrayBuffer());
  return { audioBase64: audio.toString("base64") };
}

function musetalkOrigin() {
  const raw = serverEnv("MUSETALK_URL") || "http://127.0.0.1:8788";
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function readyMusetalk() {
  const origin = musetalkOrigin();
  if (!origin) return null;
  try {
    const health = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(800) });
    if (!health.ok) return null;
    const status = (await health.json()) as { ready?: boolean };
    return status.ready ? origin : null;
  } catch {
    return null;
  }
}

type ClipRecord =
  | { type: "clip"; fps: number; frames: number; bbox: number[]; size: number[] }
  | { type: "frames"; start: number; jpegs: string[] }
  | { type: "end" }
  | { type: "error"; error?: string };

async function renderSentenceFrames(
  origin: string,
  sentence: number,
  pcm: Buffer,
  mode: KataraMode,
  send: (event: TalkEvent) => void,
  signal: AbortSignal,
) {
  let ok = false;
  try {
    const form = new FormData();
    form.append("mode", mode);
    form.append(
      "audio",
      new File([Uint8Array.from(pcmToWav(pcm, PCM_RATE))], "speech.wav", { type: "audio/wav" }),
    );
    const response = await fetch(`${origin}/frames`, {
      method: "POST",
      body: form,
      signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    });
    if (!response.ok || !response.body) {
      console.error("Katara lipsync failed", response.status);
      return false;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let failed = false;
    while (!failed) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const record = JSON.parse(line) as ClipRecord;
        if (record.type === "clip") {
          send({
            type: "clip",
            sentence,
            fps: record.fps,
            frames: record.frames,
            bbox: record.bbox.slice(0, 4),
            size: record.size.slice(0, 2),
          });
        } else if (record.type === "frames" && Array.isArray(record.jpegs)) {
          send({ type: "frames", sentence, start: record.start, jpegs: record.jpegs });
        } else if (record.type === "end") {
          ok = true;
        } else if (record.type === "error") {
          console.error("Katara lipsync failed", record.error ?? "render_failed");
          failed = true;
          await reader.cancel();
          break;
        }
      }
    }
  } catch (error) {
    if (signal.aborted) throw error;
    console.error("Katara lipsync failed");
  } finally {
    if (!signal.aborted) send({ type: "clipend", sentence, ok });
  }
  return ok;
}

const PCM_RATE = 24000;

const talkSchema = z.object({
  message: z.string().trim().min(1).max(500),
  mode: z.enum(["chill", "crunk", "glam"]),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(600),
      }),
    )
    .max(6),
});

type TalkEvent =
  | { type: "delta"; text: string }
  | { type: "say"; text: string }
  | { type: "pcm"; audioBase64: string; sampleRate: number; sentence?: number }
  | { type: "mp3"; audioBase64: string }
  | { type: "clip"; sentence: number; fps: number; frames: number; bbox: number[]; size: number[] }
  | { type: "frames"; sentence: number; start: number; jpegs: string[] }
  | { type: "clipend"; sentence: number; ok: boolean }
  | { type: "done"; reply: string }
  | { type: "error"; error: "missing_key" | "chat_failed" };

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isAbort(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function takeSpeakableSentences(buffer: string, flush: boolean) {
  const sentences: string[] = [];
  let rest = buffer;
  const boundary = /[.!?](?=\s|$)/g;
  let from = 0;
  while (rest.length > 0) {
    boundary.lastIndex = from;
    const match = boundary.exec(rest);
    if (!match) break;
    // An initialism like "T.I.R.A." is not the end of a sentence.
    if (match[0] === "." && /(?:^|[\s.])[A-Z]$/.test(rest.slice(Math.max(0, match.index - 2), match.index))) {
      from = match.index + 1;
      continue;
    }
    const piece = rest.slice(0, match.index + 1).trim();
    rest = rest.slice(match.index + 1).replace(/^\s+/, "");
    from = 0;
    if (!/[A-Za-z0-9]/.test(piece)) continue;
    sentences.push(piece);
  }
  if (!flush && rest.length >= 110) {
    const comma = rest.lastIndexOf(", ");
    const space = rest.lastIndexOf(" ");
    const cut = comma >= 40 ? comma : space >= 40 ? space : -1;
    if (cut > 0) {
      const piece = rest.slice(0, cut).trim();
      if (piece.length >= 24) {
        sentences.push(piece);
        rest = rest.slice(cut).trimStart();
      }
    }
  }
  if (flush) {
    const tail = rest.trim();
    if (/[A-Za-z0-9]/.test(tail)) sentences.push(tail);
    rest = "";
  }
  return { sentences, rest };
}

function pcmToWav(pcm: Buffer, sampleRate: number) {
  const even = pcm.length - (pcm.length % 2);
  const data = even === pcm.length ? pcm : pcm.subarray(0, even);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

async function streamSentencePcm(
  sentence: string,
  mode: KataraMode,
  send: (event: TalkEvent) => void,
  parts: Buffer[],
  signal: AbortSignal,
  clipId?: number,
) {
  const apiKey = serverEnv("ELEVENLABS_API_KEY");
  if (!apiKey) return false;
  const voiceId = serverEnv("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM";
  const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`);
  url.searchParams.set("output_format", `pcm_${PCM_RATE}`);
  url.searchParams.set("optimize_streaming_latency", "3");

  const response = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "xi-api-key": apiKey,
      Accept: "application/octet-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(speechRequestBody(sentence, mode)),
  });
  if (!response.ok || !response.body) {
    console.error("Katara speech stream failed", response.status);
    return false;
  }

  const reader = response.body.getReader();
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      bytes += value.byteLength;
      const chunk = Buffer.from(value);
      parts.push(chunk);
      send({ type: "pcm", audioBase64: chunk.toString("base64"), sampleRate: PCM_RATE, sentence: clipId });
    }
  } catch (error) {
    if (isAbort(error) || signal.aborted) throw error;
    console.error("Katara speech stream failed");
  }
  return bytes > 0;
}

async function readChatDeltas(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onDelta: (text: string) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    if (signal.aborted) {
      await reader.cancel();
      throw new DOMException("Aborted", "AbortError");
    }
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const payload = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string | null } }>;
        };
        const text = payload.choices?.[0]?.delta?.content ?? "";
        if (text) onDelta(text);
      } catch {
        // A keep-alive line is not a token.
      }
    }
  }
}

async function runKataraTalk(
  input: { message: string; mode: KataraMode; history: KataraTurn[] },
  send: (event: TalkEvent) => void,
  signal: AbortSignal,
) {
  const apiKey = serverEnv("OPENAI_API_KEY");
  if (!apiKey) {
    send({ type: "error", error: "missing_key" });
    return;
  }

  const hasEleven = Boolean(serverEnv("ELEVENLABS_API_KEY"));
  const lipsyncCheck = hasEleven ? readyMusetalk() : Promise.resolve(null);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(input.mode) },
        ...input.history.slice(-6),
        { role: "user", content: input.message },
      ],
      temperature: temperatureFor(input.mode),
      max_tokens: 220,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    console.error("Katara chat failed", response.status);
    send({ type: "error", error: "chat_failed" });
    return;
  }

  let reply = "";
  let pending = "";
  let streamOk = true;
  let voiced = false;
  let streamed = false;
  let sentences = 0;
  let lipsyncFailed = false;
  const missed: string[] = [];
  let chain = Promise.resolve();
  let renders = Promise.resolve();
  // Upper bound on when the browser finishes playing; frames arriving later are useless.
  let playEnd = 0;
  const lips = new AbortController();
  const lipsSignal = AbortSignal.any([signal, lips.signal]);

  const renderClip = (origin: string, sentence: number, pcm: Buffer) => {
    renders = renders
      .then(async () => {
        if (lipsSignal.aborted) return;
        const ok = await renderSentenceFrames(origin, sentence, pcm, input.mode, send, lipsSignal);
        if (!ok) lipsyncFailed = true;
      })
      .catch(() => {
        lipsyncFailed = true;
      });
  };

  const enqueue = (sentence: string) => {
    const spoken = speakableText(sentence);
    if (!spoken) return;
    if (!hasEleven) {
      send({ type: "say", text: spoken });
      voiced = true;
      return;
    }
    chain = chain.then(async () => {
      if (signal.aborted) return;
      if (!streamOk) {
        missed.push(spoken);
        return;
      }
      const origin = lipsyncFailed ? null : await lipsyncCheck;
      const id = origin ? sentences++ : undefined;
      const parts: Buffer[] = [];
      const began = Date.now();
      try {
        const ok = await streamSentencePcm(spoken, input.mode, send, parts, signal, id);
        streamed ||= parts.length > 0;
        if (ok) {
          voiced = true;
          if (origin && id != null) {
            const pcm = Buffer.concat(parts);
            playEnd = Math.max(playEnd, began) + (pcm.length / (PCM_RATE * 2) + 0.8) * 1000;
            renderClip(origin, id, pcm);
          }
          return;
        }
      } catch (error) {
        if (isAbort(error) || signal.aborted) throw error;
        console.error("Katara speech stream failed");
      }
      if (id != null) send({ type: "clipend", sentence: id, ok: false });
      streamOk = false;
      missed.push(spoken);
    });
  };

  let linkHold = "";
  const absorb = (text: string) => {
    if (!text || reply.length > 800) return;
    reply += text;
    send({ type: "delta", text });
    const split = splitAtOpenLink(linkHold + text);
    linkHold = split.held;
    pending += unlinkForSpeech(split.ready);
    const pulled = takeSpeakableSentences(pending, false);
    pending = pulled.rest;
    for (const sentence of pulled.sentences) enqueue(sentence);
  };

  await readChatDeltas(response.body, signal, absorb);
  const tail = takeSpeakableSentences(pending + unlinkForSpeech(linkHold), true);
  for (const sentence of tail.sentences) enqueue(sentence);
  await chain;
  if (signal.aborted) return;

  const finalReply = reply.trim();
  if (!finalReply) {
    lips.abort();
    send({ type: "error", error: "chat_failed" });
    return;
  }

  if (streamed && missed.length > 0) {
    const rest = await synthesizeKataraSpeech({
      text: missed.join(" ").slice(0, 600),
      mode: input.mode,
    });
    if (rest.audioBase64) send({ type: "mp3", audioBase64: rest.audioBase64 });
  } else if (hasEleven && !voiced) {
    const spokenReply = speakableText(finalReply);
    const one = await synthesizeKataraSpeech({ text: spokenReply.slice(0, 600), mode: input.mode });
    if (signal.aborted) return;
    if (one.audioBase64) {
      send({ type: "mp3", audioBase64: one.audioBase64 });
    } else {
      send({ type: "say", text: spokenReply });
    }
  }

  send({ type: "done", reply: finalReply });

  const linger = playEnd + 500 - Date.now();
  if (linger > 0) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([renders, new Promise((resolve) => (timer = setTimeout(resolve, linger)))]);
    clearTimeout(timer);
  }
  lips.abort();
}

export async function createKataraTalkResponse(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 20_000) {
    return jsonResponse({ ok: false, error: "bad_request" }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "bad_request" }, 400);
  }
  const parsed = talkSchema.safeParse(payload);
  if (!parsed.success) return jsonResponse({ ok: false, error: "bad_request" }, 400);

  const abort = new AbortController();
  const onAbort = () => abort.abort();
  request.signal.addEventListener("abort", onAbort);
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: TalkEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };
      try {
        controller.enqueue(encoder.encode(`: ${" ".repeat(2048)}\n\n`));
        await runKataraTalk(parsed.data, send, abort.signal);
      } catch (error) {
        if (!isAbort(error) && !abort.signal.aborted) {
          console.error("Katara talk failed");
          send({ type: "error", error: "chat_failed" });
        }
      } finally {
        closed = true;
        request.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          // The client already hung up.
        }
      }
    },
    cancel() {
      closed = true;
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
