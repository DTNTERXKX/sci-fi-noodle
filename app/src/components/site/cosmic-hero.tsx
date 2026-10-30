import { pillarBowls, studio } from "@/content/catalog";

const plateAlt =
  "A man in a rose-colored jacket sits in a chair on a reflective observation deck, facing a giant ringed planet through a tall arched window.";

/** Homepage title sequence: the observation deck plate with the wordmark, orbit, and pillar row drawn live on top. */
export function CosmicHero({ menuId }: { menuId: string }) {
  return (
    <section aria-labelledby="cosmic-title" className="cosmic-hero">
      <div className="cosmic-stage">
        <img
          alt={plateAlt}
          className="cosmic-plate"
          decoding="async"
          fetchPriority="high"
          height={1152}
          sizes="100vw"
          src="/assets/hero/cosmic-horizon.jpg"
          srcSet="/assets/hero/cosmic-horizon-1024.jpg 1024w, /assets/hero/cosmic-horizon.jpg 2048w"
          width={2048}
        />
        <span aria-hidden="true" className="cosmic-drift" />
        <span aria-hidden="true" className="cosmic-planet-light" />
        <span aria-hidden="true" className="cosmic-shade" />
      </div>

      <p aria-hidden="true" className="cosmic-micro cosmic-micro-left">
        <span>Bigger</span>
        <span>Worlds</span>
        <span>Better</span>
        <span>Noodles</span>
      </p>
      <p aria-hidden="true" className="cosmic-micro cosmic-micro-right">
        <span>Space</span>
        <span>Science</span>
        <span>Stories</span>
        <span>You</span>
      </p>

      <div className="cosmic-head">
        <div className="cosmic-kicker-lockup">
          <img
            alt=""
            aria-hidden="true"
            className="cosmic-mark"
            decoding="async"
            height={819}
            src="/brand/cosmic-bowl.png"
            width={819}
          />
          <p className="cosmic-kicker">{studio.menu}</p>
        </div>
        <h1 className="cosmic-wordmark" id="cosmic-title">
          <svg aria-hidden="true" className="cosmic-orbit" preserveAspectRatio="none" viewBox="0 0 1000 200">
            <ellipse cx="500" cy="100" rx="497" ry="96" vectorEffect="non-scaling-stroke" />
          </svg>
          <span aria-hidden="true" className="cosmic-glint" />
          <span aria-hidden="true" className="cosmic-moon" />
          <span className="cosmic-wordmark-text">{studio.name}</span>
        </h1>
        <nav aria-label="Pillars" className="cosmic-pillars">
          {pillarBowls.map((bowl) => (
            <a data-bowl={bowl.id} href={bowl.href} key={bowl.id}>
              <span aria-hidden="true" className="cosmic-pillar-mark" />
              <span className="cosmic-pillar-flavor">{bowl.short}</span>
              <span className="cosmic-pillar-category">{bowl.category}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="cosmic-foot">
        <p className="cosmic-tagline">{studio.line}</p>
        <a className="cta-choose-flavor" href={`#${menuId}`}>
          Choose your flavor
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M8 2v11M4 9l4 4 4-4" />
          </svg>
        </a>
      </div>
    </section>
  );
}
