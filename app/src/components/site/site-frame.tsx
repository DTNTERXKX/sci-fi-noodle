import type { ReactNode } from "react";

import { studio } from "@/content/catalog";

const links = [
  ["Watch", "/watch"],
  ["Originals", "/originals"],
  ["Public Domain", "/public-domain"],
  ["Docs", "/docs"],
  ["Atmospheres", "/atmospheres"],
  ["Lab", "/lab"],
  ["Katara", "/host"],
  ["About", "/about"],
] as const;

export function SiteNav() {
  return (
    <header className="site-nav">
      <a className="brand-lockup" href="/">
        <img alt="SCI-FI NOODLES" height={52} src="/brand/logo.jpg" width={52} />
      </a>
      <details className="nav-drawer">
        <summary>Menu</summary>
        <nav aria-label="Primary">
          {links.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>
      </details>
      <a className="nav-join" href="/#kitchen">
        Join
      </a>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img alt="" height={72} src="/brand/logo.jpg" width={72} />
        <p>{studio.line}</p>
        <p className="signoff">{studio.signoff}</p>
      </div>
      <div>
        <p className="footer-label">Shelves</p>
        <a href="/watch">Watch</a>
        <a href="/originals">Originals</a>
        <a href="/public-domain">Public Domain</a>
        <a href="/docs">Docs</a>
        <a href="/atmospheres">Atmospheres</a>
        <a href="/shorts">Shorts</a>
        <a href="/lab">The Lab</a>
      </div>
      <div>
        <p className="footer-label">Studio</p>
        <a href="/host">Katara</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href={studio.youtube} rel="noreferrer" target="_blank">
          YouTube
        </a>
        <a href="/#kitchen">The Noodle Drop</a>
      </div>
      <div>
        <p className="footer-label">Rights</p>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/rights">Copyright and rights</a>
      </div>
      <p className="footer-legal">
        © {studio.year} {studio.owner}. All rights reserved. SCI-FI NOODLES is the
        channel. Each series keeps its own story.
      </p>
    </footer>
  );
}

export function SiteFrame({
  title,
  lede,
  crumb,
  children,
}: {
  title: string;
  lede: string;
  crumb?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main className="page-main">
        <header className="page-hero">
          {crumb ? (
            <p className="crumb">
              <a href={crumb.href}>{crumb.label}</a>
              <span aria-hidden="true"> / </span>
              <span>{title}</span>
            </p>
          ) : null}
          <h1>{title}</h1>
          <p>{lede}</p>
        </header>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function NoodleRule() {
  return (
    <svg aria-hidden="true" className="noodle-rule" viewBox="0 0 1200 48">
      <path d="M0 30 C 180 30, 220 8, 400 18 S 620 42, 780 16 S 980 8, 1200 24" />
    </svg>
  );
}
