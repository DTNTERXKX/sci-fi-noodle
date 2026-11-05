import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type MenuSection = Extract<SiteSection, { type: "menu" }>;

export function MenuSectionView({ section, brand }: { section: MenuSection; brand: SiteBrand }) {
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <div className={`mt-6 space-y-8 ${section.variant === "c" ? "md:columns-2 md:gap-8" : ""}`}>
        {section.categories.map((cat) => (
          <div key={cat.name}>
            <h3 className="text-lg font-semibold" style={{ color: brand.palette.primary }}>{cat.name}</h3>
            <ul className="mt-3 space-y-3">
              {cat.items.map((item) => (
                <li key={item.name} className="flex justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description ? <p className="opacity-75">{item.description}</p> : null}
                  </div>
                  <span className="shrink-0 font-medium">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
