import { useEffect } from "react";

/** Fades `[data-reveal]` sections in once as they enter the viewport. Content stays visible without JS or with reduced motion. */
export function RevealWatcher({ pathname }: { pathname: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    for (const target of targets) {
      const box = target.getBoundingClientRect();
      if (box.top < window.innerHeight) target.classList.add("is-revealed");
      else observer.observe(target);
    }
    root.classList.add("reveal-on");
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
