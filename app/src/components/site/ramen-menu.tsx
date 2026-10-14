import { useId, type CSSProperties } from "react";

import { RamenVessel } from "@/components/site/ramen-vessels";
import { bowls, studio, type Bowl } from "@/content/catalog";

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
  return (
    <section aria-labelledby={`${id}-title`} className="ramen-menu" id={id} tabIndex={-1}>
      <header className="ramen-menu-head" data-reveal>
        <p className="ramen-menu-board">
          <span>{studio.menu}</span>
          <span>The Cosmic Ramen Menu</span>
        </p>
        <h2 id={`${id}-title`}>Choose your flavor // Explore the multiverse</h2>
        <p className="ramen-menu-lede">
          Three pillars tell you where a film comes from. Three flavors tell you how it feels, and they run across every
          pillar. Order by either.
        </p>
        <ul className="ramen-legend">
          <li data-role="pillar">Pillar // where it comes from</li>
          <li data-role="flavor">Flavor // how it feels</li>
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
