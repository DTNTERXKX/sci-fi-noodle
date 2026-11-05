import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type AboutSection = Extract<SiteSection, { type: "about" }>;

export function AboutSectionView({ section, brand }: { section: AboutSection; brand: SiteBrand }) {
  return (
    <section className={`${sectionPad(section.variant)} ${section.variant === "c" ? "md:flex md:gap-10" : ""}`}>
      <div className={section.variant === "c" ? "md:w-1/2" : "max-w-3xl"}>
        <h2 className="text-2xl font-semibold" style={headingFont(brand)}>
          {section.title}
        </h2>
        <p className="mt-4 leading-relaxed opacity-90">{section.body}</p>
      </div>
      {section.variant === "c" ? (
        <div className="mt-6 h-48 flex-1 rounded-xl md:mt-0" style={{ backgroundColor: `${brand.palette.primary}18` }} />
      ) : null}
    </section>
  );
}
