import { createFileRoute } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";
import { pageMeta } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => {
    const page = pageMeta("page.terms");
    return seoHead({ path: "/terms", title: page.title, description: page.description });
  },
  component: TermsPage,
});

function TermsPage() {
  const page = pageMeta("page.terms");
  return (
    <SiteFrame lede={page.subtitle} title={page.header}>
      <article className="legal-copy">
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </SiteFrame>
  );
}
