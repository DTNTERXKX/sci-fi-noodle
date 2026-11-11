import { createFileRoute } from "@tanstack/react-router";

import { ContactAddressText } from "@/components/site/contact-address";
import { SiteFrame } from "@/components/site/site-frame";
import { pageMeta } from "@/content/catalog";
import { copyString, segmentCopy } from "@/content/site-file";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => {
    const page = pageMeta("page.privacy");
    return seoHead({ path: "/privacy", title: page.title, description: page.description });
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  const page = pageMeta("page.privacy");
  const email = copyString(segmentCopy("page.contact"), "email");
  return (
    <SiteFrame lede={page.subtitle} title={page.header}>
      <article className="legal-copy">
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph}>
            <ContactAddressText address={email} text={paragraph} />
          </p>
        ))}
      </article>
    </SiteFrame>
  );
}
