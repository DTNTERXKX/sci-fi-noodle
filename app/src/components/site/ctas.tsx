export function WatchMark({ href }: { href: string }) {
  const external = href.startsWith("http");
  return (
    <a
      className="cta-watch"
      href={href}
      {...(external ? { rel: "noreferrer", target: "_blank" } : {})}
    >
      <span>Watch</span>
    </a>
  );
}

export function ExploreOrbit({ href }: { href: string }) {
  return (
    <a className="cta-explore" href={href}>
      Explore
    </a>
  );
}

export function EnterBracket({ href }: { href: string }) {
  return (
    <a className="cta-enter" href={href}>
      <i aria-hidden="true" />
      Enter
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
