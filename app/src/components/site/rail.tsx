import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import type { BowlId } from "@/content/catalog";

export type RailItem = {
  key: string;
  href: string;
  title: string;
  kicker: string;
  hook: string;
  image: string;
  bowl?: BowlId;
};

export function Rail({
  title,
  lede,
  seeAll,
  items,
  bowl,
}: {
  bowl?: BowlId;
  title: string;
  lede?: string;
  seeAll?: { href: string; label: string };
  items: RailItem[];
}) {
  const trackId = useId();
  const headingId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const start = track.scrollLeft <= 4;
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      setEdges((prior) => (prior.start === start && prior.end === end ? prior : { start, end }));
    };
    measure();
    track.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      track.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  function page(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: still ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby={headingId} className="rail" data-bowl={bowl} data-reveal>
      <div className="rail-head">
        <div>
          <h2 id={headingId}>{title}</h2>
          {lede ? <p>{lede}</p> : null}
        </div>
        <div className="rail-controls">
          {seeAll ? (
            <a className="cta-rail-all" href={seeAll.href}>
              {seeAll.label}
            </a>
          ) : null}
          <RailArrow controls={trackId} direction={-1} disabled={edges.start} label={`Scroll ${title} back`} onClick={() => page(-1)} />
          <RailArrow controls={trackId} direction={1} disabled={edges.end} label={`Scroll ${title} forward`} onClick={() => page(1)} />
        </div>
      </div>
      <ul className="rail-track" id={trackId} ref={trackRef}>
        {items.map((item) => (
          <li className="rail-card" data-bowl={item.bowl} key={item.key}>
            <a href={item.href}>
              <span className="rail-card-still">
                <img alt="" loading="lazy" src={item.image} />
              </span>
              <span className="rail-card-body">
                <span className="rail-card-kicker">{item.kicker}</span>
                <strong>{item.title}</strong>
                <span className="rail-card-hook">{item.hook}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RailArrow({
  controls,
  direction,
  disabled,
  label,
  onClick,
}: {
  controls: string;
  direction: 1 | -1;
  disabled: boolean;
  label: string;
  onClick: () => void;
}): ReactNode {
  return (
    <button aria-controls={controls} aria-label={label} className="rail-arrow" disabled={disabled} onClick={onClick} type="button">
      <svg aria-hidden="true" viewBox="0 0 16 16">
        <path d={direction === 1 ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"} />
      </svg>
    </button>
  );
}
