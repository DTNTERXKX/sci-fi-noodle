import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type BeforeAfterSection = Extract<SiteSection, { type: "beforeAfter" }>;

export function BeforeAfterSectionView({
  section,
  brand,
}: {
  section: BeforeAfterSection;
  brand: SiteBrand;
}) {
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <ul className="mt-6 space-y-6">
        {section.pairs.map((pair, i) => (
          <li key={i} className={`grid gap-3 ${section.variant === "a" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            <div className="rounded-lg p-4 text-center text-sm" style={{ backgroundColor: `${brand.palette.text}10` }}>Before</div>
            <div className="rounded-lg p-4 text-center text-sm" style={{ backgroundColor: `${brand.palette.primary}18` }}>After</div>
            {pair.caption ? <p className="sm:col-span-2 text-sm opacity-80">{pair.caption}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
