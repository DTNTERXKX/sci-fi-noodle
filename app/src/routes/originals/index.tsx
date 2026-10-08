import { createFileRoute } from "@tanstack/react-router";

import { EnterBracket } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { universes } from "@/content/catalog";

export const Route = createFileRoute("/originals/")({
  head: () => ({
    meta: [
      { title: "Original Universes | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Independent science-fiction worlds from SCI-FI NOODLES. Each universe keeps its own story, rules, and look.",
      },
    ],
  }),
  component: OriginalsPage,
});

function OriginalsPage() {
  return (
    <SiteFrame
      lede="Independent science-fiction worlds. Each one has its own story, rules, characters, and visual identity."
      title="Original universes"
    >
      <div className="universe-split page-block">
        {universes.map((universe) => (
          <article key={universe.slug}>
            <img alt="" src={universe.image} />
            <div>
              <p className="meta-line">{universe.status}</p>
              <h2>{universe.title}</h2>
              <p>{universe.premise}</p>
              <EnterBracket href={`/originals/${universe.slug}`} />
            </div>
          </article>
        ))}
      </div>
    </SiteFrame>
  );
}
