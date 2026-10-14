import type { ScrollScrubScene, ScrollScrubTheme } from "@/components/scroll-scrub/scroll-scrub";
import { ExploreOrbit, WatchMark } from "@/components/site/ctas";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#00E8FF",
  background: "#05070C",
  ink: "#F3F6FA",
  muted: "#C7D5FF",
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    actions: (
      <>
        <WatchMark href="/watch" title="everything" />
        <ExploreOrbit href="/originals" title="the original universes" />
      </>
    ),
    align: "left",
    body: "Original worlds, reimagined classics, and strange futures.",
    clip: "/assets/world/scene-01.mp4",
    id: "studio",
    kicker: "Different Flavors. Infinite Universes.",
    label: "Studio",
    mobileClip: "/assets/world/scene-01-mobile.mp4",
    mobileObjectPosition: "50% 100%",
    mobilePoster: "/assets/world/scene-01-mobile-poster.png",
    objectPosition: "50% 100%",
    poster: "/assets/world/scene-01-poster.png",
    scroll: 4.6,
    title: "SCI-FI NOODLES",
  },
];
