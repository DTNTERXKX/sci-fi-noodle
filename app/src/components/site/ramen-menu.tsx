import { useId, type CSSProperties } from "react";

import { RamenVessel } from "@/components/site/ramen-vessels";
import { bowls, copyString, copyStrings, segmentCopy, type Bowl } from "@/content/catalog";

function BowlCard({ bowl, index }: { bowl: Bowl; index: number }) {
  const headingId = useId();
  const action = bowl.role === "pillar" ? `Enter ${bowl.short}` : `Taste ${bowl.short}`;
  return (
    <li data-bowl={bowl.id} data-reveal data-role={bowl.role} style={{ "--i": index } as CSSProperties}>
      <article aria-labelledby={headingId} className="bowl-card">
        <div className="bowl-card-figure">
          <RamenVessel bowl={bowl.id} />
        </div>
        <div className="bowl-card-copy">
          <p className="bowl-card-number">
            <span className="bowl-card-stamp">{bowl.number} //</span>
            <span className="bowl-card-role">{bowl.role === "pillar" ? "Pillar" : "Flavor"}</span>
          </p>
          <h3 id={headingId}>{bowl.name}</h3>
          <p className="bowl-card-category">{bowl.category}</p>
          <p className="bowl-card-tagline">{bowl.tagline}</p>
          <p className="bowl-card-description">{bowl.description}</p>
          <a className="cta-bowl" href={bowl.href}>
            {action}
            <span className="sr-only">, {bowl.category}</span>
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="M2 8h11M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </article>
    </li>
  );
}

/** The Cosmic Ramen menu board: three pillars and three flavors, each served in its own vessel. */
export function RamenMenu({ id }: { id: string }) {
  const menu = segmentCopy("home.menu");
  const board = copyStrings(menu, "board");
  const legend = copyStrings(menu, "legend");
  return (
    <section aria-labelledby={`${id}-title`} className="ramen-menu" id={id} tabIndex={-1}>
      <header className="ramen-menu-head" data-reveal>
        <p className="ramen-menu-board">
          {board.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <h2 id={`${id}-title`}>{copyString(menu, "header")}</h2>
        <p className="ramen-menu-lede">{copyString(menu, "subtitle")}</p>
        <ul className="ramen-legend">
          {legend.map((line, index) => (
            <li data-role={index === 0 ? "pillar" : "flavor"} key={line}>
              {line}
            </li>
          ))}
        </ul>
      </header>
      <ol className="ramen-bowls">
        {bowls.map((bowl, index) => (
          <BowlCard bowl={bowl} index={index} key={bowl.id} />
        ))}
      </ol>
    </section>
  );
}
