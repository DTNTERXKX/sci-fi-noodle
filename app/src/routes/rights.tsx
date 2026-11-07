import { createFileRoute } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";
import { pageMeta } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/rights")({
  head: () => {
    const page = pageMeta("page.rights");
    return seoHead({ path: "/rights", title: page.title, description: page.description });
  },
  component: RightsPage,
});

function RightsPage() {
  const page = pageMeta("page.rights");
  return (
    <SiteFrame lede={page.subtitle} title={page.header}>
      <article className="legal-copy">
        <p>Before a film is labeled public domain, the studio checks:</p>
        <ul>
          {page.checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </SiteFrame>
  );
}
