import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type ContactSection = Extract<SiteSection, { type: "contact" }>;

export function ContactSectionView({ section, brand }: { section: ContactSection; brand: SiteBrand }) {
  return (
    <section className={sectionPad(section.variant)} style={{ backgroundColor: `${brand.palette.primary}0d` }}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <div className={`mt-4 ${section.variant === "c" ? "md:grid md:grid-cols-2 md:gap-8" : "max-w-xl"}`}>
        <div className="space-y-2 text-sm">
          <p>{section.email}</p>
          {section.phone ? <p>{section.phone}</p> : null}
          {section.address ? <p>{section.address}</p> : null}
        </div>
        {section.formEnabled ? (
          <div className="mt-6 space-y-3 md:mt-0" aria-label="Contact form preview">
            <div className="w-full rounded-lg border px-3 py-2 text-sm opacity-60">Your name</div>
            <div className="w-full rounded-lg border px-3 py-2 text-sm opacity-60">Email</div>
            <div className="w-full rounded-lg border px-3 py-2 text-sm opacity-60">Message</div>
            <span className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: brand.palette.primary }}>
              Send message
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
