import { useMemo, useState } from "react";

import { pillars, watchLibrary, youtubeFor, type PillarId } from "@/content/catalog";
import { WatchMark } from "@/components/site/ctas";

const filters: { id: "all" | PillarId; label: string }[] = [
  { id: "all", label: "All" },
  ...pillars.map((pillar) => ({ id: pillar.id, label: pillar.title })),
];

export function WatchBoard() {
  const library = useMemo(() => watchLibrary(), []);
  const [pillar, setPillar] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "title">("featured");

  const visible = library
    .filter((item) => (pillar === "all" ? true : item.pillar === pillar))
    .filter((item) => {
      const haystack = `${item.title} ${item.hook} ${item.kind}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => {
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
            placeholder="Title, hook, shelf"
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
      <div className="filter-row" role="group" aria-label="Filter by shelf">
        {filters.map((filter) => (
          <button
            aria-pressed={pillar === filter.id}
            className="filter-key"
            key={filter.id}
            onClick={() => setPillar(filter.id)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="empty-shelf">Nothing on this shelf matches. Try another word, or clear the filter.</p>
      ) : (
        <ul className="watch-list">
          {visible.map((item) => (
            <li key={item.slug}>
              <a className="watch-still" href={item.href}>
                <img alt="" src={item.image} />
              </a>
              <div>
                <p className="meta-line">
                  {item.kind} · {item.runtime} · {item.date}
                </p>
                <h2>
                  <a href={item.href}>{item.title}</a>
                </h2>
                <p>{item.hook}</p>
              </div>
              <WatchMark href={youtubeFor(item.title)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
