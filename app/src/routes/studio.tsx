import { createFileRoute } from "@tanstack/react-router";

import { StudioBlueprint } from "@/components/site/studio-blueprint";
import { SiteHeader } from "@/components/site/site-header";
import {
  STUDIO_BLUEPRINT,
  STUDIO_BOOK,
  STUDIO_BUSINESS_ADDRESS,
  STUDIO_FAQ,
  STUDIO_FOOTER,
  STUDIO_GUARANTEE,
  STUDIO_LINKS,
  STUDIO_NAV,
  STUDIO_PAGE,
  STUDIO_PRODUCTS,
  STUDIO_SETUP,
} from "@/content/studio-page";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/studio")({
  head: () =>
    seoHead({
      path: "/studio",
      title: STUDIO_PAGE.title,
      description: STUDIO_PAGE.description,
    }),
  component: StudioPage,
});

function StudioPage() {
  return (
    <>
      <SiteHeader />
      <main className="studio-main" id="content" tabIndex={-1}>
        <section className="studio-hero" aria-labelledby="studio-title">
          <img
            alt={STUDIO_PAGE.coverAlt}
            className="studio-cover"
            height={1280}
            src="/assets/studio/ocm-cover-800x1280.jpg"
            width={800}
          />
          <div>
            <p className="kicker">{STUDIO_PAGE.kicker}</p>
            <h1 id="studio-title">{STUDIO_PAGE.headline}</h1>
            <p className="studio-lede">{STUDIO_PAGE.lede}</p>
            <nav aria-label="On this page" className="studio-jump">
              {STUDIO_NAV.map((item) => (
                <a href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section className="studio-section" id="blueprint" aria-labelledby="blueprint-title">
          <p className="kicker">{STUDIO_BLUEPRINT.kicker}</p>
          <h2 id="blueprint-title">{STUDIO_BLUEPRINT.headline}</h2>
          <p className="studio-lede">{STUDIO_BLUEPRINT.intro}</p>
          <StudioBlueprint />
        </section>

        <section className="studio-section studio-book" id="book" aria-labelledby="book-title">
          <div>
            <p className="kicker">{STUDIO_BOOK.author}</p>
            <h2 id="book-title">{STUDIO_BOOK.headline}</h2>
            {STUDIO_BOOK.blurb.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="studio-note">{STUDIO_BOOK.formats}</p>
            <a className="cta-join studio-buy" href={STUDIO_LINKS.amazon} rel="noreferrer" target="_blank">
              {STUDIO_BOOK.cta}
            </a>
          </div>
        </section>

        <section className="studio-section" id="kit" aria-labelledby="kit-title">
          <p className="kicker">Digital kit</p>
          <h2 id="kit-title">Prompt Pack and Studio-in-a-Box</h2>
          <div className="studio-products">
            {STUDIO_PRODUCTS.map((product) => (
              <article className="studio-product" key={product.id}>
                <p className="kicker">{product.name}</p>
                <p className="studio-price">{product.price}</p>
                <h3>{product.headline}</h3>
                <p>{product.sub}</p>
                <ul>
                  {product.inside.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {product.note ? <p className="studio-note">{product.note}</p> : null}
                <p className="studio-note">{STUDIO_GUARANTEE.kit}</p>
                <a className="cta-join studio-buy" href={product.href} rel="noreferrer" target="_blank">
                  {product.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="studio-section" id="setup" aria-labelledby="setup-title">
          <p className="kicker">Done-with-you</p>
          <h2 id="setup-title">{STUDIO_SETUP.headline}</h2>
          <p className="studio-lede">{STUDIO_SETUP.intro}</p>
          <div className="studio-products">
            {STUDIO_SETUP.tiers.map((tier) => (
              <article className="studio-product" key={tier.id}>
                <p className="kicker">{tier.name}</p>
                <p className="studio-price">{tier.price}</p>
                <p>{tier.sub}</p>
                {tier.note ? <p className="studio-note">{tier.note}</p> : null}
                <p className="studio-note">{STUDIO_GUARANTEE.setup}</p>
                <a className="cta-join studio-buy" href={STUDIO_LINKS.booking} rel="noreferrer" target="_blank">
                  {tier.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="studio-section" id="faq" aria-labelledby="faq-title">
          <p className="kicker">FAQ</p>
          <h2 id="faq-title">Questions</h2>
          <div className="studio-faq">
            {STUDIO_FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="studio-section" id="guarantee" aria-labelledby="guarantee-title">
          <p className="kicker">{STUDIO_GUARANTEE.headline}</p>
          <h2 id="guarantee-title">Kits and setup</h2>
          <div className="studio-panel">
            <p>
              <strong>Kits:</strong> {STUDIO_GUARANTEE.kit}
            </p>
            <p>
              <strong>Done-with-you:</strong> {STUDIO_GUARANTEE.setup}
            </p>
          </div>
        </section>
      </main>

      <footer className="studio-footer">
        <p>{STUDIO_FOOTER.byline}</p>
        <p>{STUDIO_FOOTER.ai}</p>
        <p>{STUDIO_FOOTER.rights}</p>
        <p>{STUDIO_BUSINESS_ADDRESS}</p>
        <nav aria-label="Legal">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </footer>
    </>
  );
}
