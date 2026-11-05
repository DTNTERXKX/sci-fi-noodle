import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type ServicesSection = Extract<SiteSection, { type: "services" }>;

export function ServicesSectionView({ section, brand }: { section: ServicesSection; brand: SiteBrand }) {
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>
        {section.title}
      </h2>
      <ul className={`mt-6 ${section.variant === "b" ? "divide-y" : "grid gap-4 sm:grid-cols-2"}`}>
        {section.items.map((item) => (
          <li key={item.name} className={section.variant === "b" ? "py-4" : "rounded-lg border p-4"} style={{ borderColor: `${brand.palette.text}18` }}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{item.name}</h3>
              {item.price ? <span className="text-sm font-medium" style={{ color: brand.palette.primary }}>{item.price}</span> : null}
            </div>
            <p className="mt-1 text-sm opacity-85">{item.blurb}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
