import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { VesselGlyph } from "@/components/site/ramen-vessels";
import { flavorBowls, pillarBowls, sectionFor, sections, studio, studioSocials, type Bowl } from "@/content/catalog";

const menuMore = [
  { label: "Katara", href: "/host" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Join the Noodle Drop", href: "/#kitchen" },
];

function SocialMark({ id }: { id: (typeof studioSocials)[number]["id"] }) {
  return (
    <svg aria-hidden="true" className="social-mark" height="16" viewBox="0 0 24 24" width="16">
      {socialGlyph(id)}
    </svg>
  );
}

function socialGlyph(id: (typeof studioSocials)[number]["id"]): ReactNode {
  if (id === "higgsfield" || id === "higgsfield-affiliate") {
    return <path d="M12 1.4 14.2 9.8 22.6 12 14.2 14.2 12 22.6 9.8 14.2 1.4 12 9.8 9.8Z" fill="currentColor" />;
  }
  if (id === "tiktok") {
    return (
      <path
        d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
        fill="currentColor"
      />
    );
  }
  if (id === "x") {
    return (
      <path
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
        fill="currentColor"
      />
    );
  }
  if (id === "instagram") {
    return (
      <>
        <rect fill="none" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="3" />
        <circle cx="12" cy="12" fill="none" r="4.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.4" cy="6.6" fill="currentColor" r="1.15" />
      </>
    );
  }
  if (id === "youtube") {
    return (
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
        fill="currentColor"
        fillRule="evenodd"
      />
    );
  }
  return (
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="currentColor"
    />
  );
}

export function SocialLink({
  social,
  onClick,
}: {
  social: (typeof studioSocials)[number];
  onClick?: () => void;
}) {
  return (
    <a href={social.href} onClick={onClick} rel="noreferrer" target="_blank">
      <SocialMark id={social.id} />
      {social.label}
    </a>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function usePathname() {
  return useRouterState({ select: (state) => state.location.pathname });
}

function currentFor(pathname: string, href: string): "page" | "true" | undefined {
  if (pathname === href) return "page";
  return sectionFor(pathname)?.href === href ? "true" : undefined;
}

function BrandLockup() {
  return (
    <a aria-label={`${studio.name} home`} className="brand-lockup" href="/">
      <img alt="" height={52} src="/brand/logo.jpg" width={52} />
      <span className="brand-words">
        <span className="brand-name">{studio.name}</span>
        <span className="brand-menu">{studio.menu}</span>
      </span>
    </a>
  );
}

function FlavorsMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [openPath, setOpenPath] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const active = flavorBowls.some((bowl) => currentFor(pathname, bowl.href));

  if (openPath !== pathname) {
    setOpenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const onPointer = (event: PointerEvent) => {
      if (root && !root.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (root && event.relatedTarget instanceof Node && !root.contains(event.relatedTarget)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    root?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  return (
    <div className="flavors-menu" ref={rootRef}>
      <button
        aria-controls="flavors-panel"
        aria-expanded={open}
        className="flavors-toggle"
        data-active={active ? "true" : "false"}
        onClick={() => setOpen((value) => !value)}
        ref={toggleRef}
        type="button"
      >
        <span className="nav-flavor">Flavors</span>
        <span className="nav-category">
          Across every pillar
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </button>
      <div className="flavors-panel" data-open={open ? "true" : "false"} hidden={!open} id="flavors-panel">
        <p className="flavors-panel-label">Choose a flavor</p>
        <ul>
          {flavorBowls.map((bowl) => (
            <li key={bowl.id}>
              <a aria-current={currentFor(pathname, bowl.href)} data-bowl={bowl.id} href={bowl.href}>
                <VesselGlyph bowl={bowl.id} className="flavors-panel-glyph" />
                <span className="flavors-panel-number">{bowl.number} //</span>
                <strong>{bowl.name}</strong>
                <em>{bowl.category}</em>
              </a>
            </li>
          ))}
        </ul>
        <a className="cta-flavors-all" href="/watch">
          Every flavor on the Watch board
        </a>
      </div>
    </div>
  );
}

function MenuBowl({ bowl, index, pathname }: { bowl: Bowl; index: number; pathname: string }) {
  return (
    <li style={{ "--i": index } as CSSProperties}>
      <a aria-current={currentFor(pathname, bowl.href)} data-bowl={bowl.id} href={bowl.href}>
        <span className="site-menu-index">
          <VesselGlyph bowl={bowl.id} className="site-menu-glyph" />
          {bowl.number}
        </span>
        <span className="site-menu-flavor">{bowl.name}</span>
        <strong>{bowl.category}</strong>
        <em>{bowl.tagline}</em>
      </a>
    </li>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [openPath, setOpenPath] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > (isHome ? window.innerHeight * 0.6 : 24));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  if (openPath !== pathname) {
    setOpenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const toggle = toggleRef.current;
    const body = document.body;
    const priorOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    const background = Array.from(
      document.querySelectorAll<HTMLElement>(".skip-link, .site-nav, #content, .site-footer, .katara-dock"),
    );
    for (const element of background) element.inert = true;
    document.documentElement.dataset.siteMenu = "open";
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = priorOverflow;
      for (const element of background) element.inert = false;
      delete document.documentElement.dataset.siteMenu;
      toggle?.focus();
    };
  }, [open]);

  const watch = sections[0];
  const close = () => setOpen(false);

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header
        className="site-nav"
        data-hero={isHome ? "true" : "false"}
        data-scrolled={scrolled ? "true" : "false"}
        id="top"
      >
        <BrandLockup />
        <nav aria-label="Primary" className="site-nav-links">
          {pillarBowls.map((bowl) => (
            <a aria-current={currentFor(pathname, bowl.href)} data-bowl={bowl.id} href={bowl.href} key={bowl.id}>
              <span className="nav-flavor">{bowl.short}</span>
              <span className="nav-category">{bowl.navLabel}</span>
            </a>
          ))}
          <FlavorsMenu pathname={pathname} />
        </nav>
        <a aria-current={currentFor(pathname, watch.href)} className="cta-header-watch" href={watch.href}>
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M4 2.5v11l9-5.5z" />
          </svg>
          Watch
        </a>
        <button
          aria-controls="site-menu"
          aria-expanded={open}
          className="menu-toggle"
          onClick={() => setOpen(true)}
          ref={toggleRef}
          type="button"
        >
          <span aria-hidden="true" className="menu-toggle-bars">
            <i />
            <i />
          </span>
          Menu
        </button>
      </header>

      <div
        aria-label="Site menu"
        aria-modal="true"
        className="site-menu"
        data-open={open ? "true" : "false"}
        id="site-menu"
        inert={!open}
        ref={panelRef}
        role="dialog"
      >
        <div className="site-menu-top">
          <BrandLockup />
          <button className="menu-close" data-autofocus onClick={close} type="button">
            Close
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        <a aria-current={currentFor(pathname, watch.href)} className="cta-menu-watch" href={watch.href} onClick={close}>
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M4 2.5v11l9-5.5z" />
          </svg>
          Watch the whole menu
        </a>
        <nav aria-label="Site" className="site-menu-nav">
          <p className="site-menu-label">Pillars</p>
          <ol>
            {pillarBowls.map((bowl, index) => (
              <MenuBowl bowl={bowl} index={index} key={bowl.id} pathname={pathname} />
            ))}
          </ol>
          <p className="site-menu-label">Flavors, across every pillar</p>
          <ol>
            {flavorBowls.map((bowl, index) => (
              <MenuBowl bowl={bowl} index={index + 3} key={bowl.id} pathname={pathname} />
            ))}
          </ol>
        </nav>
        <ul className="site-menu-secondary">
          {menuMore.map((item) => (
            <li key={item.href}>
              <a aria-current={currentFor(pathname, item.href)} href={item.href} onClick={close}>
                {item.label}
              </a>
            </li>
          ))}
          {studioSocials.map((social) => (
            <li key={social.id}>
              <SocialLink onClick={close} social={social} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
