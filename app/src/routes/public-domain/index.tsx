import { createFileRoute } from "@tanstack/react-router";

import { EnterBracket } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { classics } from "@/content/catalog";

export const Route = createFileRoute("/public-domain/")({
  head: () => ({
    meta: [
      { title: "Public Domain | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Public-domain science fiction, horror, and adventure retold by SCI-FI NOODLES, with the source and the rights note on every project.",
      },
    ],
  }),
  component: PublicDomainPage,
});

function PublicDomainPage() {
  return (
    <SiteFrame
      lede="Adaptations with a named source. Public-domain status still depends on country, edition, and translation."
      title="Public domain"
    >
      <ul className="classic-grid">
        {classics.map((item) => (
          <li key={item.slug}>
            <img alt="" src={item.image} />
            <p className="meta-line">
              {item.creator}, {item.published}
            </p>
            <h2>{item.title}</h2>
            <p>{item.hook}</p>
            <EnterBracket href={`/public-domain/${item.slug}`} />
          </li>
        ))}
      </ul>
    </SiteFrame>
  );
}
