import { useLocation, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { KataraHost, MODES, type KataraMode } from "./katara-host";

const OPEN_EVENT = "katara:open";
const PHONE = "(max-width: 760px)";

/** Opens the site-wide Katara dock from anywhere on the page. */
export function openKataraDock() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/** Plain same-origin page links become client-side navigations, so a reply in progress survives the trip. */
function useClientSideLinks(active: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
      const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
      if (samePage && url.hash) return;
      event.preventDefault();
      void router.navigate({ href: `${url.pathname}${url.search}${url.hash}` });
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [active, router]);
}

export function KataraDock() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const onHostPage = pathname === "/host";
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<KataraMode>("chill");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);
  const panelId = useId();
  const titleId = useId();

  const show = useCallback(() => {
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setMounted(true);
    setOpen(true);
  }, []);

  const hide = useCallback((returnFocus = true) => {
    restoreFocusRef.current = returnFocus;
    setOpen(false);
  }, []);

  useClientSideLinks(mounted);

  useEffect(() => {
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, [show]);

  useEffect(() => {
    if (onHostPage) hide(false);
  }, [onHostPage, hide]);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      return () => cancelAnimationFrame(frame);
    }
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const opener = openerRef.current;
    (opener?.isConnected ? opener : launcherRef.current)?.focus({ preventScroll: true });
  }, [open]);

  const onPanelKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    hide();
  };

  const onFollowLink = useCallback(() => {
    if (window.matchMedia(PHONE).matches) hide(false);
  }, [hide]);

  const look = MODES[mode];

  return (
    <div className="katara-dock" data-mode={mode} data-open={open ? "true" : "false"}>
      {onHostPage ? null : (
        <button
          aria-controls={mounted ? panelId : undefined}
          aria-expanded={open}
          className="katara-launcher"
          onClick={() => (open ? hide() : show())}
          ref={launcherRef}
          type="button"
        >
          <span className="katara-launcher-face">
            <img alt="" height={44} src={look.face} width={44} />
          </span>
          <span className="katara-launcher-label">{open ? "Close Katara" : "Ask Katara"}</span>
        </button>
      )}
      {mounted ? (
        <section
          aria-labelledby={titleId}
          className="katara-panel"
          hidden={!open || onHostPage}
          id={panelId}
          onKeyDown={onPanelKey}
          role="dialog"
        >
          <header className="katara-panel-head">
            <div>
              <p className="katara-panel-kicker">Cosmic Ramen // Host</p>
              <h2 id={titleId}>Ask Katara</h2>
            </div>
            <a className="katara-panel-page" href="/host">
              Full page
            </a>
            <button aria-label="Close Katara" className="katara-panel-close" onClick={() => hide()} type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
          <KataraHost
            initialMode={mode}
            inputRef={inputRef}
            onFollowLink={onFollowLink}
            onModeChange={setMode}
            variant="dock"
          />
        </section>
      ) : null}
    </div>
  );
}
