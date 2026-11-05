import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type HeroSection = Extract<SiteSection, { type: "hero" }>;

export function HeroSectionView({ section, brand }: { section: HeroSection; brand: SiteBrand }) {
  const layout =
    section.variant === "b"
      ? "text-center items-center"
      : section.variant === "c"
        ? "md:flex-row-reverse md:items-center md:justify-between gap-8"
        : "md:items-center";

  return (
    <section className={`${sectionPad(section.variant)} flex flex-col ${layout}`}>
      <div className={section.variant === "c" ? "md:max-w-[55%]" : "max-w-2xl"}>
        <h1 className="text-3xl font-bold sm:text-4xl" style={headingFont(brand)}>
          {section.headline}
        </h1>
        <p className="mt-3 text-base opacity-90 sm:text-lg">{section.subhead}</p>
        <span
          className="mt-6 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: brand.palette.primary }}
        >
          {section.cta}
        </span>
      </div>
      {section.variant === "c" ? (
        <div
          className="mt-6 h-40 w-full max-w-md rounded-2xl md:mt-0 md:h-52"
          style={{ backgroundColor: `${brand.palette.accent}33` }}
        />
      ) : null}
    </section>
  );
}
