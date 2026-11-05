import "server-only";

import OpenAI from "openai";

import { generatedSiteSchemaV1, migrateV1toV2, type SiteSpecV2 } from "@/lib/site-schema";

export async function generateSiteFromBrief(input: {
  brief: string;
  businessName?: string;
}): Promise<SiteSpecV2> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You design small business websites for BBellWeb customers. Return JSON matching this shape:
{ "siteName", "tagline", "primaryColor" (hex), "sections": array of:
  { "type":"hero", "headline", "subhead", "cta" } |
  { "type":"features", "items":[{title,description}] } |
  { "type":"about", "title", "body" } |
  { "type":"contact", "title", "email", "phone?" }
}
Use professional, concise copy. primaryColor should be a tasteful teal or blue hex, not purple gradients.`,
      },
      {
        role: "user",
        content: `Business: ${input.businessName ?? "Customer site"}\nBrief:\n${input.brief}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Model returned no content.");
  }

  const v1 = generatedSiteSchemaV1.parse(JSON.parse(raw));
  return migrateV1toV2(v1);
}
