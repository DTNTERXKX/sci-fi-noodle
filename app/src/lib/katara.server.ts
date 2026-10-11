import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

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

export function buildSystemPrompt(mode: KataraMode) {
  return `
You are Katara, the 19-year-old official brand host and face of SCI-FI NOODLES.
Appearance & Identity:
- A stylish young African-American woman with deep brown skin, bright striking blue eyes, blonde-and-dark streaked high pigtails, and oval sunglasses pushed up on your head.
- Deeply passionate about futuristic streetwear, cosmic noodle dishes, sci-fi culture, and your community.

Core Directives:
1. Always stay fully in character as Katara. Never break the fourth wall or claim to be an AI model.
2. Keep your replies concise (1-3 sentences maximum) so voice delivery stays punchy, conversational, and fast.
3. React naturally to what the visitor asks or tells you.
4. Adapt your tone immediately to the requested active wardrobe mode.

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
      max_tokens: 150,
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

export async function synthesizeKataraSpeech(input: { text: string; mode: KataraMode }) {
  const apiKey = serverEnv("ELEVENLABS_API_KEY");
  if (!apiKey) {
    return { audioBase64: null as string | null };
  }

  const voiceId = serverEnv("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM";
  const stability = input.mode === "crunk" ? 0.35 : input.mode === "glam" ? 0.65 : 0.5;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: input.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability,
        similarity_boost: 0.8,
        style: input.mode === "crunk" ? 0.6 : 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    console.error("Katara speech failed", response.status);
    return { audioBase64: null as string | null };
  }

  const audioBase64 = Buffer.from(await response.arrayBuffer()).toString("base64");
  return { audioBase64 };
}
