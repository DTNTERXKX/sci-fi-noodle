import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type FeaturesSection = Extract<SiteSection, { type: "features" }>;

export function FeaturesSectionView({ section, brand }: { section: FeaturesSection; brand: SiteBrand }) {
  const grid =
    section.variant === "c"
      ? "grid-cols-1 sm:grid-cols-3"
      : section.variant === "b"
        ? "grid-cols-1"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className={sectionPad(section.variant)}>
      {section.title ? (
        <h2 className="mb-6 text-2xl font-semibold" style={headingFont(brand)}>
          {section.title}
        </h2>
      ) : null}
      <ul className={`grid gap-4 ${grid}`}>
        {section.items.map((item) => (
          <li
            key={item.title}
            className="rounded-xl border p-4"
            style={{ borderColor: `${brand.palette.text}22` }}
          >
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm opacity-85">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
