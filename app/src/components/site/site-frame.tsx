import type { ReactNode } from "react";

import {
  classics,
  flavorBowls,
  nextSectionAfter,
  pillarBowls,
  studio,
  universes,
  type Bowl,
  type Section,
} from "@/content/catalog";
import { RamenVessel } from "@/components/site/ramen-vessels";
import { RevealWatcher } from "@/components/site/reveal";
import { SiteHeader, usePathname } from "@/components/site/site-header";

export function SiteNav() {
  return <SiteHeader />;
}

function FooterBowls({ label, items }: { label: string; items: Bowl[] }) {
  return (
    <div>
      <p className="footer-label">{label}</p>
      <ul>
        {items.map((bowl) => (
          <li data-bowl={bowl.id} key={bowl.id}>
            <a href={bowl.href}>
              <span className="footer-flavor">{bowl.name}</span>
              {bowl.category}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const nowShowing = [
    ...universes.map((item) => ({ href: `/originals/${item.slug}`, title: item.title })),
    ...classics.slice(0, 1).map((item) => ({ href: `/public-domain/${item.slug}`, title: item.title })),
    { href: "/atmospheres", title: "Neo-Osaka Rain" },
  ];
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img alt="" height={72} src="/brand/logo.jpg" width={72} />
        <p className="footer-name">{studio.name}</p>
        <p className="footer-menu">{studio.menu}</p>
        <p>{studio.line}</p>
        <a className="cta-top" href="#top">
          Back to top
        </a>
      </div>
      <nav aria-label="Sitemap" className="footer-map">
        <FooterBowls items={pillarBowls} label="Pillars" />
        <FooterBowls items={flavorBowls} label="Flavors" />
        <div>
          <p className="footer-label">Studio</p>
          <ul>
            <li>
              <a href="/watch">Watch everything</a>
            </li>
            <li>
              <a href="/host">Katara</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
            <li>
              <a href="/#kitchen">The Noodle Drop</a>
            </li>
            <li>
              <a href={studio.youtube} rel="noreferrer" target="_blank">
                YouTube
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="footer-label">Now showing</p>
          <ul>
            {nowShowing.map((item) => (
              <li key={item.href + item.title}>
                <a href={item.href}>{item.title}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="footer-label">Rights</p>
          <ul>
            <li>
              <a href="/privacy">Privacy</a>
            </li>
            <li>
              <a href="/terms">Terms</a>
            </li>
            <li>
              <a href="/rights">Copyright and rights</a>
            </li>
          </ul>
        </div>
      </nav>
      <p className="footer-legal">
        © {studio.year} {studio.owner}. All rights reserved. SCI-FI NOODLES is the
        channel. Each series keeps its own story.
      </p>
    </footer>
  );
}

/** Header, one landmark `main#content`, and the footer. Pages with a full-bleed hero compose inside this directly. */
export function SiteShell({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <>
      <SiteHeader />
      <main className={className} id="content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <RevealWatcher pathname={pathname} />
    </>
  );
}

export function NextShelf({ section, label = "Next on the menu" }: { section?: Section; label?: string }) {
  const pathname = usePathname();
  const next = section ?? nextSectionAfter(pathname);
  return (
    <aside aria-label={label} className="next-shelf" data-bowl={next.bowl} data-reveal>
      <p className="kicker">{label}</p>
      <a className="cta-nextup" href={next.href}>
        {next.flavor ? <span className="cta-nextup-flavor">{next.flavor}</span> : null}
        <strong>{next.label}</strong>
        <span>{next.promise}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="M2 8h11M9 4l4 4-4 4" />
        </svg>
      </a>
    </aside>
  );
}

export function SiteFrame({
  title,
  lede,
  crumb,
  bowl,
  children,
  after,
}: {
  title: string;
  lede: string;
  crumb?: { href: string; label: string };
  /** Brands the page with a bowl: its menu number, name, and palette. */
  bowl?: Bowl;
  children: ReactNode;
  after?: ReactNode;
}) {
  return (
    <SiteShell>
      <div className="page-main" data-bowl={bowl?.id}>
        <header className="page-hero" data-vessel={bowl ? "true" : undefined}>
          {bowl ? (
            <div className="page-vessel">
              <RamenVessel bowl={bowl.id} />
            </div>
          ) : null}
          {crumb ? (
            <nav aria-label="Breadcrumb" className="crumb">
              <a className="cta-back" href={crumb.href}>
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path d="M10 3L5 8l5 5" />
                </svg>
                {crumb.label}
              </a>
            </nav>
          ) : null}
          {bowl ? (
            <p className="bowl-kicker">
              <span>{bowl.number} //</span> {bowl.name}
            </p>
          ) : null}
          <h1>{title}</h1>
          {bowl ? <p className="bowl-tagline">{bowl.tagline}</p> : null}
          <p>{lede}</p>
        </header>
        {children}
        {after}
        <NextShelf />
      </div>
    </SiteShell>
  );
}

export function NoodleRule() {
  return (
    <svg aria-hidden="true" className="noodle-rule" viewBox="0 0 1200 48">
      <path d="M0 30 C 180 30, 220 8, 400 18 S 620 42, 780 16 S 980 8, 1200 24" />
    </svg>
  );
}
