import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { sectionPad } from "./brand-vars";

type LogosSection = Extract<SiteSection, { type: "logos" }>;

export function LogosSectionView({ section, brand }: { section: LogosSection; brand: SiteBrand }) {
  return (
    <section className={`${sectionPad(section.variant)} text-center`}>
      {section.title ? <p className="text-sm font-medium uppercase tracking-wide opacity-70">{section.title}</p> : null}
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-4">
        {section.logos.map((logo) => (
          <li key={logo.name} className="rounded-lg border px-4 py-2 text-sm font-medium" style={{ borderColor: `${brand.palette.text}20` }}>
            {logo.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
