import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EnterBracket } from "@/components/site/ctas";
import { FilterStatus, FlavorChips, ShelfList } from "@/components/site/flavor-filter";
import { SiteFrame } from "@/components/site/site-frame";
import {
  bowlTitle,
  cardBowl,
  filterShelf,
  isFlavorId,
  pillarBowl,
  universes,
  watchLibrary,
  type FlavorId,
} from "@/content/catalog";

const bowl = pillarBowl("originals");

export const Route = createFileRoute("/originals/")({
  validateSearch: (search: Record<string, unknown>): { flavor?: FlavorId } => ({
    flavor: isFlavorId(search.flavor) ? search.flavor : undefined,
  }),
  head: () => ({
    meta: [
      { title: bowlTitle(bowl) },
      { name: "description", content: `${bowl.tagline} ${bowl.description}` },
    ],
  }),
  component: OriginalsPage,
});

function OriginalsPage() {
  const { flavor } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const items = filterShelf(watchLibrary(), { pillar: "originals" });
  const visible = filterShelf(items, { flavor });

  return (
    <SiteFrame
      bowl={bowl}
      lede="The flagship bowl. Independent science-fiction worlds, each with its own story, rules, characters, and look, plus the original docs, shorts, and ambience made in the same kitchen."
      title={bowl.category}
    >
      <div className="universe-split page-block">
        {universes.map((universe) => (
          <article data-bowl={cardBowl(universe.flavors, "originals")} key={universe.slug}>
            <img alt={universe.imageAlt ?? ""} src={universe.image} />
            <div>
              <p className="meta-line">{universe.status}</p>
              <h2>{universe.title}</h2>
              <p>{universe.premise}</p>
              <EnterBracket href={`/originals/${universe.slug}`} title={universe.title} />
            </div>
          </article>
        ))}
      </div>
      <section aria-labelledby="originals-board-title" className="pillar-board">
        <div className="pillar-board-head">
          <h2 id="originals-board-title">Everything in this bowl</h2>
          <p>Episodes, docs, shorts, and ambience. Narrow it by flavor.</p>
        </div>
        <FlavorChips
          active={flavor}
          items={items}
          onSelect={(value) => navigate({ search: { flavor: value }, replace: true, resetScroll: false })}
        />
        <FilterStatus count={visible.length} flavor={flavor} pillar="originals" />
        <ShelfList empty="No titles in this flavor yet. Try another." items={visible} titleAs="h3" />
      </section>
    </SiteFrame>
  );
}
