import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type TeamSection = Extract<SiteSection, { type: "team" }>;

export function TeamSectionView({ section, brand }: { section: TeamSection; brand: SiteBrand }) {
  if (section.members.length === 0) return null;
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.members.map((m) => (
          <li key={m.name} className="rounded-xl border p-4" style={{ borderColor: `${brand.palette.text}18` }}>
            <p className="font-semibold">{m.name}</p>
            <p className="text-sm opacity-75">{m.role}</p>
            {m.bio ? <p className="mt-2 text-sm opacity-85">{m.bio}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
