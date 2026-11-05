import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { AboutSectionView } from "./about";
import { AnnouncementSectionView } from "./announcement";
import { BeforeAfterSectionView } from "./before-after";
import { BlogListSectionView } from "./blog-list";
import { ContactSectionView } from "./contact";
import { CtaSectionView } from "./cta";
import { EventsSectionView } from "./events";
import { FaqSectionView } from "./faq";
import { FeaturesSectionView } from "./features";
import { GallerySectionView } from "./gallery";
import { HeroSectionView } from "./hero";
import { HoursSectionView } from "./hours";
import { LogosSectionView } from "./logos";
import { MenuSectionView } from "./menu";
import { PricingSectionView } from "./pricing";
import { ServicesSectionView } from "./services";
import { TeamSectionView } from "./team";
import { TestimonialsSectionView } from "./testimonials";

export function SectionRenderer({ section, brand }: { section: SiteSection; brand: SiteBrand }) {
  switch (section.type) {
    case "hero":
      return <HeroSectionView section={section} brand={brand} />;
    case "features":
      return <FeaturesSectionView section={section} brand={brand} />;
    case "services":
      return <ServicesSectionView section={section} brand={brand} />;
    case "about":
      return <AboutSectionView section={section} brand={brand} />;
    case "gallery":
      return <GallerySectionView section={section} brand={brand} />;
    case "testimonials":
      return <TestimonialsSectionView section={section} brand={brand} />;
    case "pricing":
      return <PricingSectionView section={section} brand={brand} />;
    case "faq":
      return <FaqSectionView section={section} brand={brand} />;
    case "hours":
      return <HoursSectionView section={section} brand={brand} />;
    case "contact":
      return <ContactSectionView section={section} brand={brand} />;
    case "cta":
      return <CtaSectionView section={section} brand={brand} />;
    case "team":
      return <TeamSectionView section={section} brand={brand} />;
    case "logos":
      return <LogosSectionView section={section} brand={brand} />;
    case "menu":
      return <MenuSectionView section={section} brand={brand} />;
    case "events":
      return <EventsSectionView section={section} brand={brand} />;
    case "beforeAfter":
      return <BeforeAfterSectionView section={section} brand={brand} />;
    case "blogList":
      return <BlogListSectionView section={section} brand={brand} />;
    case "announcement":
      return <AnnouncementSectionView section={section} brand={brand} />;
    default:
      return null;
  }
}
