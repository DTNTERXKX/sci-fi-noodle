import type { ReactNode } from "react";

import type { BowlId } from "@/content/catalog";

export function DetailHero({
  bowl,
  trail,
  kicker,
  title,
  logline,
  meta,
  image,
  imageAlt,
  actions,
}: {
  bowl?: BowlId;
  trail: { href: string; label: string };
  kicker: string;
  title: string;
  logline: string;
  meta: string[];
  image: string;
  imageAlt: string;
  actions: ReactNode;
}) {
  return (
    <header className="detail-hero" data-bowl={bowl}>
      <div className="detail-stage">
        <img alt={imageAlt} src={image} />
        <span aria-hidden="true" className="cine-vignette" />
        <span aria-hidden="true" className="cine-grain" />
      </div>
      <div className="detail-copy">
        <nav aria-label="Breadcrumb" className="detail-trail">
          <ol>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a className="cta-back" href={trail.href}>
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path d="M10 3L5 8l5 5" />
                </svg>
                {trail.label}
              </a>
            </li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <p className="detail-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="detail-logline">{logline}</p>
        <p className="detail-meta">
          {meta.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </p>
        <div className="detail-actions">{actions}</div>
      </div>
    </header>
  );
}

type Sibling = { href: string; title: string; image?: string };

export function TitleNav({ label, previous, next }: { label: string; previous?: Sibling; next?: Sibling }) {
  if (!previous && !next) return null;
  return (
    <nav aria-label={label} className="title-nav" data-reveal>
      {previous ? <TitleNavLink direction="previous" item={previous} /> : <span />}
      {next ? <TitleNavLink direction="next" item={next} /> : null}
    </nav>
  );
}

function TitleNavLink({ direction, item }: { direction: "previous" | "next"; item: Sibling }) {
  return (
    <a className="cta-title-nav" data-direction={direction} href={item.href} rel={direction === "next" ? "next" : "prev"}>
      {item.image ? <img alt="" loading="lazy" src={item.image} /> : null}
      <span>
        <span className="cta-title-nav-label">{direction === "next" ? "Next" : "Previous"}</span>
        <strong>{item.title}</strong>
      </span>
      <svg aria-hidden="true" viewBox="0 0 16 16">
        <path d={direction === "next" ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"} />
      </svg>
    </a>
  );
}
