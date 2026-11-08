import type { ReactNode } from "react";

import { realWatchHref } from "@/content/from-segments";

/** A watch control. A real video URL is a link. A search URL, or no URL, is the disabled Coming Soon control. */
export function WatchAnchor({
  className,
  href,
  released = true,
  children,
  soon,
}: {
  className: string;
  href?: string;
  released?: boolean;
  children: ReactNode;
  soon: ReactNode;
}) {
  const target = released ? realWatchHref(href) : undefined;
  if (!target) {
    return (
      <button className={className} disabled type="button">
        {soon}
      </button>
    );
  }
  return (
    <a className={className} href={target} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

export function WatchMark({ href, title, released = true }: { href?: string; title?: string; released?: boolean }) {
  return (
    <WatchAnchor
      className="cta-watch"
      href={href}
      released={released}
      soon={<span>Coming Soon!</span>}
    >
      <span>
        Watch
        {title ? <i className="sr-only"> {title} on YouTube</i> : null}
      </span>
    </WatchAnchor>
  );
}

export function ExploreOrbit({ href, title }: { href: string; title?: string }) {
  return (
    <a className="cta-explore" href={href}>
      Explore
      {title ? <span className="sr-only"> {title}</span> : null}
    </a>
  );
}

export function EnterBracket({ href, title }: { href: string; title?: string }) {
  return (
    <a className="cta-enter" href={href}>
      <i aria-hidden="true" />
      Enter
      {title ? <span className="sr-only"> {title}</span> : null}
      <i aria-hidden="true" />
    </a>
  );
}

export function SignalLink({ href, children }: { href: string; children: string }) {
  const external = href.startsWith("http");
  return (
    <a
      className="cta-signal"
      href={href}
      {...(external ? { rel: "noreferrer", target: "_blank" } : {})}
    >
      {children}
    </a>
  );
}
