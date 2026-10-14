import {
  cardBowl,
  flavorBowl,
  flavorBowls,
  flavorCounts,
  pillarBowl,
  pillarBowls,
  youtubeFor,
  type BowlId,
  type FlavorId,
  type PillarId,
  type ShelfItem,
} from "@/content/catalog";
import { WatchMark } from "@/components/site/ctas";
import { VesselGlyph } from "@/components/site/ramen-vessels";

type ChipOption<T extends string> = { id: T; label: string; sub: string; count: number; bowl: BowlId };

function ChipGroup<T extends string>({
  label,
  allLabel,
  total,
  options,
  active,
  onSelect,
}: {
  label: string;
  allLabel: string;
  total: number;
  options: ChipOption<T>[];
  active?: T;
  onSelect: (value: T | undefined) => void;
}) {
  return (
    <div aria-label={label} className="flavor-chips" role="group">
      <button aria-pressed={!active} className="flavor-chip" onClick={() => onSelect(undefined)} type="button">
        <span className="flavor-chip-name">{allLabel}</span>
        <span className="flavor-chip-count">{total}</span>
      </button>
      {options.map((option) => (
        <button
          aria-pressed={active === option.id}
          className="flavor-chip"
          data-bowl={option.bowl}
          disabled={option.count === 0 && active !== option.id}
          key={option.id}
          onClick={() => onSelect(option.id)}
          type="button"
        >
          <VesselGlyph bowl={option.bowl} className="flavor-chip-glyph" />
          <span className="flavor-chip-name">{option.label}</span>
          <span className="flavor-chip-sub">{option.sub}</span>
          <span className="flavor-chip-count">
            {option.count}
            <span className="sr-only"> {option.count === 1 ? "title" : "titles"}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Flavor filter chips. Counts come from the list being filtered, so empty flavors show as unavailable. */
export function FlavorChips({
  items,
  active,
  onSelect,
}: {
  items: { flavors: FlavorId[] }[];
  active?: FlavorId;
  onSelect: (flavor: FlavorId | undefined) => void;
}) {
  const counts = flavorCounts(items);
  return (
    <ChipGroup
      active={active}
      allLabel="All flavors"
      label="Filter by flavor"
      onSelect={onSelect}
      options={flavorBowls.map((bowl) => ({
        id: bowl.flavor,
        label: bowl.short,
        sub: bowl.category,
        count: counts[bowl.flavor],
        bowl: bowl.id,
      }))}
      total={items.length}
    />
  );
}

export function PillarChips({
  items,
  active,
  onSelect,
}: {
  items: ShelfItem[];
  active?: PillarId;
  onSelect: (pillar: PillarId | undefined) => void;
}) {
  return (
    <ChipGroup
      active={active}
      allLabel="All pillars"
      label="Filter by pillar"
      onSelect={onSelect}
      options={pillarBowls.map((bowl) => ({
        id: bowl.pillar,
        label: bowl.short,
        sub: bowl.category,
        count: items.filter((item) => item.pillar === bowl.pillar).length,
        bowl: bowl.id,
      }))}
      total={items.length}
    />
  );
}

export function FilterStatus({ count, flavor, pillar }: { count: number; flavor?: FlavorId; pillar?: PillarId }) {
  const parts = [pillar ? pillarBowl(pillar).category : null, flavor ? flavorBowl(flavor).name : null].filter(Boolean);
  return (
    <p aria-live="polite" className="filter-status">
      {count} {count === 1 ? "title" : "titles"}
      {parts.length > 0 ? ` in ${parts.join(" // ")}` : " on the menu"}
    </p>
  );
}

/** Rows of titles with their pillar and flavor badges. */
export function ShelfList({
  items,
  empty,
  titleAs: Title = "h2",
  tint = "flavor",
}: {
  items: ShelfItem[];
  empty: string;
  titleAs?: "h2" | "h3";
  /** Which identity colors each row. Flavor pages pass "pillar", since every row shares their flavor. */
  tint?: "flavor" | "pillar";
}) {
  if (items.length === 0) return <p className="empty-shelf">{empty}</p>;
  return (
    <ul className="watch-list">
      {items.map((item) => {
        const pillar = pillarBowl(item.pillar);
        return (
          <li data-bowl={tint === "pillar" ? pillar.id : cardBowl(item.flavors, item.pillar)} key={item.slug}>
            <a className="watch-still" href={item.href}>
              <img alt={item.imageAlt ?? ""} src={item.image} />
            </a>
            <div>
              <p className="meta-line">
                {item.kind} · {item.runtime} · {item.date}
              </p>
              <Title>
                <a href={item.href}>{item.title}</a>
              </Title>
              <p>{item.hook}</p>
              <ul aria-label="Pillar and flavors" className="bowl-badges">
                <li className="bowl-badge" data-bowl={pillar.id}>
                  {pillar.short}
                </li>
                {item.flavors.map((flavor) => {
                  const bowl = flavorBowl(flavor);
                  return (
                    <li className="bowl-badge" data-bowl={bowl.id} key={flavor}>
                      {bowl.short}
                    </li>
                  );
                })}
              </ul>
            </div>
            <WatchMark href={youtubeFor(item.title)} title={item.title} />
          </li>
        );
      })}
    </ul>
  );
}
