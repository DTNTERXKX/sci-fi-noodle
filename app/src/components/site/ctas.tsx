export function WatchMark({ href, title }: { href: string; title?: string }) {
  const external = href.startsWith("http");
  return (
    <a
      className="cta-watch"
      href={href}
      {...(external ? { rel: "noreferrer", target: "_blank" } : {})}
    >
      <span>
        Watch
        {title ? <i className="sr-only"> {title}{external ? " on YouTube" : ""}</i> : null}
      </span>
    </a>
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
