import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type HoursSection = Extract<SiteSection, { type: "hours" }>;

export function HoursSectionView({ section, brand }: { section: HoursSection; brand: SiteBrand }) {
  return (
    <section className={`${sectionPad(section.variant)} ${section.variant === "c" ? "md:grid md:grid-cols-2 md:gap-8" : ""}`}>
      <div>
        <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
        <p className="mt-2 text-sm opacity-85">{section.address}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {section.days.map((day) => (
            <li key={day.label} className="flex justify-between gap-4 border-b py-1" style={{ borderColor: `${brand.palette.text}12` }}>
              <span>{day.label}</span>
              <span className="opacity-80">{day.hours}</span>
            </li>
          ))}
        </ul>
      </div>
      {section.variant !== "a" ? (
        <div className="mt-6 min-h-[140px] rounded-xl md:mt-0" style={{ backgroundColor: `${brand.palette.accent}22` }} aria-hidden />
      ) : null}
    </section>
  );
}
