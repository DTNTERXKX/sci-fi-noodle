import { useMemo, useState } from "react";

import { filterShelf, watchLibrary, type FlavorId, type PillarId } from "@/content/catalog";
import { FilterStatus, FlavorChips, PillarChips, ShelfList } from "@/components/site/flavor-filter";

export function WatchBoard({
  pillar,
  flavor,
  onPillar,
  onFlavor,
}: {
  pillar?: PillarId;
  flavor?: FlavorId;
  onPillar: (pillar: PillarId | undefined) => void;
  onFlavor: (flavor: FlavorId | undefined) => void;
}) {
  const library = useMemo(() => watchLibrary(), []);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "title">("featured");

  const searched = library.filter((item) => {
    const haystack = `${item.title} ${item.hook} ${item.kind}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const inPillar = filterShelf(searched, { pillar });
  const visible = filterShelf(inPillar, { flavor }).sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  return (
    <div className="watch-board">
      <div className="watch-controls">
        <div className="field">
          <label htmlFor="watch-search">Search</label>
          <input
            id="watch-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, hook, kind"
            type="search"
            value={query}
          />
        </div>
        <div className="field">
          <label htmlFor="watch-sort">Sort</label>
          <select id="watch-sort" onChange={(event) => setSort(event.target.value as "featured" | "title")} value={sort}>
            <option value="featured">Featured first</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>
      <div className="filter-stack">
        <p className="filter-legend">Pillar // where it comes from</p>
        <PillarChips active={pillar} items={filterShelf(searched, { flavor })} onSelect={onPillar} />
        <p className="filter-legend">Flavor // how it feels</p>
        <FlavorChips active={flavor} items={inPillar} onSelect={onFlavor} />
      </div>
      <FilterStatus count={visible.length} flavor={flavor} pillar={pillar} />
      <ShelfList empty="Nothing on the menu matches. Try another word, or clear a filter." items={visible} />
    </div>
  );
}
