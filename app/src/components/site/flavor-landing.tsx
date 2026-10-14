import { filterShelf, flavorBowl, watchLibrary, type FlavorId, type PillarId } from "@/content/catalog";
import { FilterStatus, PillarChips, ShelfList } from "@/components/site/flavor-filter";
import { SiteFrame } from "@/components/site/site-frame";

/** A flavor's own page: every title with that flavor, from every pillar. */
export function FlavorLanding({
  flavor,
  pillar,
  lede,
  onPillar,
}: {
  flavor: FlavorId;
  pillar?: PillarId;
  lede: string;
  onPillar: (pillar: PillarId | undefined) => void;
}) {
  const bowl = flavorBowl(flavor);
  const items = filterShelf(watchLibrary(), { flavor });
  const visible = filterShelf(items, { pillar });

  return (
    <SiteFrame bowl={bowl} lede={lede} title={bowl.category}>
      <section aria-labelledby="flavor-board-title" className="pillar-board">
        <div className="pillar-board-head">
          <h2 id="flavor-board-title">{bowl.short} across every pillar</h2>
          <p>{bowl.description}</p>
        </div>
        <div className="filter-stack">
          <p className="filter-legend">Pillar // where it comes from</p>
          <PillarChips active={pillar} items={items} onSelect={onPillar} />
        </div>
        <FilterStatus count={visible.length} flavor={flavor} pillar={pillar} />
        <ShelfList
          empty={`No ${bowl.short} titles in this pillar yet. Try another pillar.`}
          items={visible}
          titleAs="h3"
        />
        <a className="cta-flavor-board" data-bowl={bowl.id} href={`/watch?flavor=${flavor}`}>
          Open {bowl.short} on the Watch board
        </a>
      </section>
    </SiteFrame>
  );
}
