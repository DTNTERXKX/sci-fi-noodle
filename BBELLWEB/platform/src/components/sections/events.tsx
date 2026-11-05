import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type EventsSection = Extract<SiteSection, { type: "events" }>;

export function EventsSectionView({ section, brand }: { section: EventsSection; brand: SiteBrand }) {
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <ul className="mt-6 space-y-4">
        {section.items.map((item) => (
          <li key={item.title + item.date} className="flex flex-col gap-1 border-l-4 pl-4 sm:flex-row sm:items-start sm:gap-6" style={{ borderColor: brand.palette.accent }}>
            <time className="shrink-0 text-sm font-semibold opacity-80">{item.date}</time>
            <div>
              <p className="font-semibold">{item.title}</p>
              {item.description ? <p className="text-sm opacity-85">{item.description}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
