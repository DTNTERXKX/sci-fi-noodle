import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type CtaSection = Extract<SiteSection, { type: "cta" }>;

export function CtaSectionView({ section, brand }: { section: CtaSection; brand: SiteBrand }) {
  const align = section.variant === "b" ? "text-left" : "text-center";
  return (
    <section className={`${sectionPad(section.variant)} ${align}`} style={{ backgroundColor: brand.palette.primary, color: "#ffffff" }}>
      <h2 className="text-2xl font-bold" style={{ ...headingFont(brand), color: "#ffffff" }}>{section.headline}</h2>
      {section.subhead ? <p className="mt-2 opacity-90">{section.subhead}</p> : null}
      <span className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold" style={{ color: brand.palette.primary }}>
        {section.button}
      </span>
    </section>
  );
}
