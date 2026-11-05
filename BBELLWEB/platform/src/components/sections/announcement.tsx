import type { SiteBrand, SiteSection } from "@/lib/site-schema";

type AnnouncementSection = Extract<SiteSection, { type: "announcement" }>;

export function AnnouncementSectionView({
  section,
  brand,
}: {
  section: AnnouncementSection;
  brand: SiteBrand;
}) {
  return (
    <div
      className="px-4 py-3 text-center text-sm sm:px-6"
      style={{ backgroundColor: brand.palette.accent, color: brand.palette.bg }}
    >
      <span>{section.message}</span>
      {section.linkLabel && section.linkUrl ? (
        <a href={section.linkUrl} className="ml-2 font-semibold underline">
          {section.linkLabel}
        </a>
      ) : null}
    </div>
  );
}
