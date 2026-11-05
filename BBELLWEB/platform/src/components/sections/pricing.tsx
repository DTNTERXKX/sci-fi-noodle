import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type PricingSection = Extract<SiteSection, { type: "pricing" }>;

export function PricingSectionView({ section, brand }: { section: PricingSection; brand: SiteBrand }) {
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <ul className={`mt-6 grid gap-4 ${section.variant === "c" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {section.items.map((item) => (
          <li key={item.name} className="rounded-xl border p-5" style={{ borderColor: brand.palette.primary }}>
            <h3 className="font-semibold">{item.name}</h3>
            <p className="mt-2 text-2xl font-bold" style={{ color: brand.palette.primary }}>{item.price}</p>
            <p className="mt-2 text-sm opacity-85">{item.details}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
