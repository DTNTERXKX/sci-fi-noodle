"use client";

import { SitePreview } from "@/components/site-preview";
import type { SiteSpecV2 } from "@/lib/site-schema";

export function FixturePreviewGrid({ fixtures }: { fixtures: { name: string; spec: SiteSpecV2 }[] }) {
  return (
    <div className="space-y-12">
      {fixtures.map(({ name, spec }) => (
        <section key={name}>
          <h2 className="mb-3 text-lg font-semibold">{name}</h2>
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="w-full max-w-[375px] shrink-0">
              <p className="mb-1 text-xs text-slate-600">375px</p>
              <div className="w-[375px] max-w-full overflow-x-hidden">
                <SitePreview site={spec} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs text-slate-600">1280px</p>
              <div className="w-full max-w-[1280px] overflow-x-hidden">
                <SitePreview site={spec} />
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
