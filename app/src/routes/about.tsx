import { createFileRoute } from "@tanstack/react-router";

import { SignalLink } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { copyString, pageMeta, segmentLocked, studio } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => {
    const page = pageMeta("page.about");
    return seoHead({ path: "/about", title: page.title, description: page.description });
  },
  component: AboutPage,
});

function AboutPage() {
  const page = pageMeta("page.about");
  const image = copyString(segmentLocked("page.about"), "image") || "/brand/logo.jpg";
  return (
    <SiteFrame lede={page.subtitle} title={page.header}>
      <div className="about-grid">
        <img alt="SCI-FI NOODLES mark, a cosmic bowl of noodles" src={image} />
        <div>
          {page.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>{studio.signoff}</p>
          <SignalLink href="/contact">{page.cta}</SignalLink>
        </div>
      </div>
    </SiteFrame>
  );
}
