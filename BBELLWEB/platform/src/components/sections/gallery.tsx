import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type GallerySection = Extract<SiteSection, { type: "gallery" }>;

export function GallerySectionView({ section, brand }: { section: GallerySection; brand: SiteBrand }) {
  const cols = section.variant === "c" ? "grid-cols-2 sm:grid-cols-3" : section.variant === "b" ? "grid-cols-1" : "grid-cols-2";
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      {section.images.length === 0 ? (
        <p className="mt-4 text-sm opacity-60">Gallery images will appear here.</p>
      ) : (
        <ul className={`mt-6 grid gap-3 ${cols}`}>
          {section.images.map((img) => (
            <li key={img.url} className="overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="h-36 w-full object-cover sm:h-44" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
