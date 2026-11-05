import { NextResponse } from "next/server";
import { z } from "zod";

import { siteSpecV2Schema } from "@/lib/site-schema";
import { HttpError, requireUser } from "@/lib/server/auth";
import { createSiteWithVersion, listSitesForUser } from "@/lib/server/sites";

const postSchema = z.object({
  name: z.string().min(1).max(120),
  spec: siteSpecV2Schema,
  note: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const sites = await listSitesForUser(user.id);
    return NextResponse.json({
      sites: sites.map((s) => ({
        id: s.id,
        name: s.name,
        subdomain: s.subdomain,
        status: s.status,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to load sites.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = postSchema.parse(await request.json());
    const { site } = await createSiteWithVersion({
      user,
      name: body.name,
      spec: body.spec,
      source: "ai_build",
      note: body.note,
    });
    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        subdomain: site.subdomain,
        status: site.status,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to save site.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
