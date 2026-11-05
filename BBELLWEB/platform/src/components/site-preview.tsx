"use client";

import { useMemo, useState } from "react";

import type { GeneratedSiteV1, SiteSpecV2 } from "@/lib/site-schema";
import { migrateV1toV2, normalizeSiteSpec } from "@/lib/site-schema";

import { SitePage } from "./site-page";

export function SitePreview({ site }: { site: GeneratedSiteV1 | SiteSpecV2 }) {
  const spec = useMemo(() => normalizeSiteSpec(site), [site]);
  const [slug, setSlug] = useState("/");
  const page = spec.pages.find((p) => p.slug === slug) ?? spec.pages[0]!;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
      <SitePage spec={spec} page={page} onNavigate={setSlug} />
    </div>
  );
}

export { migrateV1toV2 };
