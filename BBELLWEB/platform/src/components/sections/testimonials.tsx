import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type TestimonialsSection = Extract<SiteSection, { type: "testimonials" }>;

export function TestimonialsSectionView({
  section,
  brand,
}: {
  section: TestimonialsSection;
  brand: SiteBrand;
}) {
  if (section.items.length === 0) return null;

  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <ul className={`mt-6 ${section.variant === "a" ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}`}>
        {section.items.map((item) => (
          <li key={item.name + item.quote.slice(0, 20)} className="rounded-xl border p-4" style={{ borderColor: `${brand.palette.text}18` }}>
            <p className="text-sm italic opacity-90">&ldquo;{item.quote}&rdquo;</p>
            <p className="mt-3 text-sm font-semibold">{item.name}</p>
            {item.role ? <p className="text-xs opacity-70">{item.role}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
