import { NextResponse } from "next/server";
import { z } from "zod";

import { HttpError, requireUser } from "@/lib/server/auth";
import { generateSiteFromBrief } from "@/lib/server/ai";

const bodySchema = z.object({
  brief: z.string().min(10).max(4000),
  businessName: z.string().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    await requireUser();
    const { brief, businessName } = bodySchema.parse(await request.json());
    const site = await generateSiteFromBrief({ brief, businessName });
    return NextResponse.json({ site });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
