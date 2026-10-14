import { useEffect, useState } from "react";

import type { Feature } from "@/content/catalog";

const SLIDE_MS = 8000;

export function FeatureHero({ features, id }: { features: Feature[]; id: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCanPlay(!still.matches);
    sync();
    still.addEventListener("change", sync);
    return () => still.removeEventListener("change", sync);
  }, []);

  const playing = canPlay && !paused && !held;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % features.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, playing, features.length]);

  const feature = features[active];

  return (
    <section
      aria-label="Now showing"
      aria-roledescription="carousel"
      className="feature-hero"
      data-playing={playing ? "true" : "false"}
      id={id}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
      }}
      onFocus={() => setHeld(true)}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      tabIndex={-1}
    >
      <div className="feature-stage">
        {features.map((item, index) => (
          <figure
            aria-hidden={index !== active}
            className="feature-slide"
            data-active={index === active ? "true" : "false"}
            key={item.slug}
          >
            <img alt={index === active ? item.imageAlt : ""} src={item.image} />
          </figure>
        ))}
        <span aria-hidden="true" className="cine-vignette" />
        <span aria-hidden="true" className="cine-grain" />
        <span aria-hidden="true" className="cine-letterbox" />
      </div>

      <div
        aria-live={playing ? "off" : "polite"}
        aria-roledescription="slide"
        aria-label={`${active + 1} of ${features.length}`}
        className="feature-copy"
        data-bowl={feature.bowl}
        key={feature.slug}
        role="group"
      >
        <p className="feature-kicker">{feature.kicker}</p>
        <h2>{feature.title}</h2>
        <p className="feature-logline">{feature.logline}</p>
        <p className="feature-meta">
          {feature.meta.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </p>
        <div className="feature-actions">
          <a className="cta-feature-watch" href={feature.watchHref} rel="noreferrer" target="_blank">
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
            Watch now
            <span className="sr-only">, {feature.title} on YouTube</span>
          </a>
          <a className="cta-feature-details" href={feature.href}>
            {feature.detailsLabel}
            <span className="sr-only">, {feature.title}</span>
          </a>
        </div>
      </div>

      <div className="feature-reel">
        <ol aria-label="Choose a feature">
          {features.map((item, index) => (
            <li key={item.slug}>
              <button
                aria-current={index === active ? "true" : undefined}
                className="feature-pick"
                onClick={() => setActive(index)}
                type="button"
              >
                <span className="feature-pick-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="feature-pick-title">{item.title}</span>
                <span aria-hidden="true" className="feature-pick-bar">
                  <i style={{ animationDuration: `${SLIDE_MS}ms` }} />
                </span>
              </button>
            </li>
          ))}
        </ol>
        {canPlay ? (
          <button
            aria-label={paused ? "Play the feature reel" : "Pause the feature reel"}
            className="feature-pause"
            onClick={() => setPaused((value) => !value)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16">
              {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 3h3v10H4zM9 3h3v10H9z" />}
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}
