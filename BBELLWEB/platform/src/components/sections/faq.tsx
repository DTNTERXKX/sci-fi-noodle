import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type FaqSection = Extract<SiteSection, { type: "faq" }>;

export function FaqSectionView({ section, brand }: { section: FaqSection; brand: SiteBrand }) {
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <dl className="mt-6 max-w-3xl space-y-4">
        {section.items.map((item) => (
          <div key={item.q} className="border-b pb-4" style={{ borderColor: `${brand.palette.text}15` }}>
            <dt className="font-semibold">{item.q}</dt>
            <dd className="mt-1 text-sm opacity-85">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
