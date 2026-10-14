import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { VesselGlyph } from "@/components/site/ramen-vessels";
import { flavorBowls, pillarBowls, sectionFor, sections, studio, type Bowl } from "@/content/catalog";

const menuMore = [
  { label: "Katara", href: "/host" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Join the Noodle Drop", href: "/#kitchen" },
  { label: "YouTube channel", href: studio.youtube, external: true },
];

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
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const active = flavorBowls.some((bowl) => currentFor(pathname, bowl.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        <span className="site-menu-index">{bowl.number}</span>
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
      document.querySelectorAll<HTMLElement>(".skip-link, .site-nav, #content, .site-footer"),
    );
    for (const element of background) element.inert = true;
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
              <a
                aria-current={item.external ? undefined : currentFor(pathname, item.href)}
                href={item.href}
                onClick={close}
                {...(item.external ? { rel: "noreferrer", target: "_blank" } : {})}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
