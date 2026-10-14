import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const modeSchema = z.enum(["chill", "crunk", "glam"]);

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(600),
});

export const chatKatara = createServerFn({ method: "POST" })
  .validator(
    z.object({
      message: z.string().trim().min(1).max(500),
      mode: modeSchema,
      history: z.array(turnSchema).max(6),
    }),
  )
  .handler(async ({ data }) => {
    const { completeKataraTurn } = await import("../katara.server");
    const result = await completeKataraTurn(data);
    if (result.missingKey) {
      return { ok: false as const, error: "missing_key" as const };
    }
    if (!result.reply) {
      return { ok: false as const, error: "chat_failed" as const };
    }
    return { ok: true as const, reply: result.reply, mode: data.mode };
  });

export const speakKatara = createServerFn({ method: "POST" })
  .validator(
    z.object({
      text: z.string().trim().min(1).max(600),
      mode: modeSchema,
    }),
  )
  .handler(async ({ data }) => {
    const { synthesizeKataraSpeech } = await import("../katara.server");
    const result = await synthesizeKataraSpeech(data);
    return { audioBase64: result.audioBase64 };
  });
