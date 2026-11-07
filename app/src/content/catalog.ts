import { buildCatalog, explicitWatchTitle, realWatchHref, watchTitleKey, type DerivedCatalog } from "./from-segments";
import {
  copyString,
  copyStrings,
  liveArray,
  liveObject,
  loadSiteSegments,
  pageMeta,
  segmentCopy,
  segmentLocked,
} from "./site-file";

export { copyString, copyStrings, loadSiteSegments, pageMeta, segmentCopy, segmentLocked };

/**
 * Visitor-facing catalog. Titles, dates, descriptions, and social URLs are read
 * from site-segments.json on each access. Local dev re-reads the file from disk.
 * A production build embeds that same JSON. failedTakes and the checked live
 * YouTube map stay in this file.
 */
export type Studio = {
  name: string;
  line: string;
  menu: string;
  signoff: string;
  owner: string;
  youtube: string;
};

export type StudioSocial = { id: string; label: string; href: string };

let derivedCache: { file: ReturnType<typeof loadSiteSegments>; value: DerivedCatalog } | null = null;

function derived(): DerivedCatalog {
  const file = loadSiteSegments();
  if (derivedCache?.file === file) return derivedCache.value;
  const value = buildCatalog(youtubeFor);
  derivedCache = { file, value };
  return value;
}

export const studio: Studio = liveObject(() => derived().studio);

/** Studio social accounts. Header menu and footer render these with platform marks. */
export const studioSocials: StudioSocial[] = liveArray(() => derived().studioSocials);

/** Where a production comes from. Every catalog entry has exactly one. */
export type PillarId = "originals" | "public-domain" | "lab";

/** How a production feels. Entries carry zero or more, across every pillar. */
export type FlavorId = "quantum-fire" | "nebula-miso" | "zero-g";

export type BowlId = "black-hole" | "timewarp" | "quantum-fire" | "nebula-miso" | "zero-g" | "cyberpunk";

export const pillarIds: PillarId[] = ["originals", "public-domain", "lab"];
export const flavorIds: FlavorId[] = ["quantum-fire", "nebula-miso", "zero-g"];

export function isPillarId(value: unknown): value is PillarId {
  return typeof value === "string" && (pillarIds as string[]).includes(value);
}

export function isFlavorId(value: unknown): value is FlavorId {
  return typeof value === "string" && (flavorIds as string[]).includes(value);
}

export type Bowl = {
  id: BowlId;
  number: string;
  /** Full menu name, e.g. "Black Hole Tonkotsu". */
  name: string;
  /** Short flavor name used in navigation, e.g. "Black Hole". */
  short: string;
  /** Plain category the bowl stands for. */
  category: string;
  /** Shorter category for tight navigation. */
  navLabel: string;
  tagline: string;
  description: string;
  href: string;
} & ({ role: "pillar"; pillar: PillarId } | { role: "flavor"; flavor: FlavorId });

/** The Cosmic Ramen menu, in menu order. */
export const bowls: Bowl[] = liveArray(() => derived().bowls);

export const pillarBowls: Array<Bowl & { role: "pillar" }> = liveArray(() =>
  derived().bowls.filter((bowl): bowl is Bowl & { role: "pillar" } => bowl.role === "pillar"),
);
export const flavorBowls: Array<Bowl & { role: "flavor" }> = liveArray(() =>
  derived().bowls.filter((bowl): bowl is Bowl & { role: "flavor" } => bowl.role === "flavor"),
);

export function pillarBowl(id: PillarId) {
  return pillarBowls.find((bowl) => bowl.pillar === id) as Bowl & { role: "pillar" };
}

export function flavorBowl(id: FlavorId) {
  return flavorBowls.find((bowl) => bowl.flavor === id) as Bowl & { role: "flavor" };
}

/** The bowl a title card wears: its first flavor, or its pillar when it has none. */
export function cardBowl(flavors: FlavorId[], pillar: PillarId): BowlId {
  return flavors[0] ? flavorBowl(flavors[0]).id : pillarBowl(pillar).id;
}

/** Page title in the menu pattern, e.g. "Black Hole Tonkotsu // Original Universes | SCI-FI NOODLES". */
export function bowlTitle(bowl: Bowl) {
  return `${bowl.name} // ${bowl.category} | SCI-FI NOODLES`;
}

export type ShelfItem = {
  slug: string;
  title: string;
  pillar: PillarId;
  flavors: FlavorId[];
  kind: string;
  hook: string;
  runtime: string;
  date: string;
  image: string;
  imageAlt?: string;
  featured?: boolean;
  href: string;
};

export type Universe = {
  slug: string;
  title: string;
  logline: string;
  premise: string;
  status: string;
  image: string;
  imageAlt?: string;
  flavors: FlavorId[];
  episodes: {
    slug: string;
    title: string;
    hook: string;
    runtime: string;
    date: string;
    image?: string;
    imageAlt?: string;
  }[];
};

export const universes: Universe[] = liveArray(() => derived().universes);

export type Classic = {
  slug: string;
  title: string;
  hook: string;
  source: string;
  creator: string;
  published: string;
  rights: string;
  image: string;
  imageAlt?: string;
  runtime: string;
  date: string;
  flavors: FlavorId[];
  episodes: {
    slug: string;
    title: string;
    hook: string;
    runtime: string;
    date: string;
    image?: string;
    imageAlt?: string;
  }[];
};

export type DocEntry = {
  slug: string;
  title: string;
  hook: string;
  runtime: string;
  date: string;
  image: string;
  imageAlt?: string;
  flavors: FlavorId[];
};

export type ShortEntry = DocEntry;

export type LabEntry = {
  slug: string;
  flavors: FlavorId[];
  title: string;
  category: string;
  date: string;
  image: string;
  imageAlt?: string;
  paragraphs: string[];
};

export const classics: Classic[] = liveArray(() => derived().classics);

export type Atmosphere = {
  slug: string;
  title: string;
  hook: string;
  runtime: string;
  date: string;
  image: string;
  imageAlt?: string;
  place?: string;
  episode?: string;
  featured?: boolean;
  flavors: FlavorId[];
};

export const atmospheres: Atmosphere[] = liveArray(() => derived().atmospheres);

export const docs: DocEntry[] = liveArray(() => derived().docs);

export const shorts: ShortEntry[] = liveArray(() => derived().shorts);

// Clips on /lab/failed-noodles; files are /assets/failed-noodles/<slug>.mp4 + .jpg poster.
export const failedTakes = [
  { slug: "tira-wrong-battleship", project: "T.I.R.A. // RIFT", title: "The wrong battleship", width: 854, height: 480, wrong: "Our alien battleship is a kilometre-long slab with stalactite spires. This take flew in a flat wedge cruiser nobody designed, copied from a bad start frame." },
  { slug: "tira-synced-grunts", project: "T.I.R.A. // RIFT", title: "The boy band", width: 854, height: 480, wrong: "The breach worked on the terrace. Inside, Amara turned to face the camera, three grunts hovered in perfect sync, and the scout ship vanished." },
  { slug: "tira-wrong-room", project: "T.I.R.A. // RIFT", title: "Wrong apartment", width: 854, height: 480, wrong: "Better fight, wrong room. The reference image of the great room got dropped in a trim, so the model designed a new apartment." },
  { slug: "tira-bus-reversed", project: "T.I.R.A. // RIFT", title: "The bus turned around", width: 854, height: 480, wrong: "The bus is pinned in one lane, nose north. The camera turned around and the bus came with it: reversed and on the wrong side of the street." },
  { slug: "tira-guideway-intact", project: "T.I.R.A. // RIFT", title: "A bridge with no hole", width: 854, height: 480, wrong: "A span of guideway just fell on this bus. The guideway above it never got the gap, so the broken piece came from nowhere." },
  { slug: "tira-rescue-vanishes", project: "T.I.R.A. // RIFT", title: "Where did the rescue go?", width: 854, height: 480, wrong: "We asked for a wider angle. The model cut to a quiet riverwalk copied from the location image. The bus, the girder and the hero were gone." },
  { slug: "tira-helmet-swap", project: "T.I.R.A. // RIFT", title: "New helmet, same shot", width: 854, height: 480, wrong: "Amara's helmet changed design inside one clip. The full helmet became a smaller open-face cap." },
  { slug: "tira-bare-arms", project: "T.I.R.A. // RIFT", title: "No sleeves, no voice", width: 854, height: 480, wrong: "The prompt went out without a description of her voice, so the model picked one. Her flight suit also lost its sleeves." },
  { slug: "commit-one-four", project: "Frankenstein: The Commit", title: "One-four", width: 1280, height: 732, wrong: "The narrator read \"1:04\" as \"one-four.\" A clock on the page is not a clock in the mouth." },
  { slug: "commit-lips-move", project: "Frankenstein: The Commit", title: "The borrowed mouth", width: 1280, height: 732, wrong: "The pronunciation got fixed, and then Victor mouthed the off-screen narrator's lines. The model gave the voice to the only face in the room." },
  { slug: "bluff-stepped-1", project: "Bluff City Immune", title: "Stop-start motion", width: 1120, height: 480, wrong: "Stepped motion with freezes: hold, snap, settle. It looked limited, not cinematic." },
  { slug: "bluff-stepped-6", project: "Bluff City Immune", title: "Stop-start, again", width: 1120, height: 480, wrong: "Same stepped motion, a different shot. It moves like a slideshow that wants to be a film." },
  { slug: "katara-reads-filename", project: "Katara, behind the scenes", title: "She read the label", width: 544, height: 960, wrong: "Katara read a filename out loud. The model voiced a label from the prompt's reference list as if it were her line." },
  { slug: "katara-invented-words", project: "Katara, behind the scenes", title: "X-Men are saying cheese", width: 544, height: 960, wrong: "Two short lines in a 10-second clip. The model filled the silence with nonsense of its own: \"X-Men are saying cheese.\"" },
  { slug: "katara-invented-words-2", project: "Katara, behind the scenes", title: "She stays quiet. She did not.", width: 544, height: 960, wrong: "We wrote \"she stays quiet\" into the prompt. The model talked through the gap anyway." },
  { slug: "katara-phone-tripod", project: "Katara, behind the scenes", title: "The phone on the tripod", width: 544, height: 960, wrong: "The prompt described the camera as a phone on a tripod. So the model put a phone on a tripod in front of her." },
  { slug: "katara-grey-band", project: "Katara, behind the scenes", title: "Where the room ends", width: 544, height: 960, wrong: "A grey band behind her lower half, where the room just stops. The flaw was in the start frame, so the take inherited it." },
  { slug: "katara-bass-noise", project: "Katara, behind the scenes", title: "That is not a bass", width: 544, height: 960, wrong: "Her hands play and noise comes out. We measured it: no notes in the bass register at all." },
  { slug: "katara-fish-bass", project: "Katara, behind the scenes", title: "Bass, the fish", width: 544, height: 960, wrong: "She plays fine this time, then says \"bass\" like the fish." },
];

export const labEntries: LabEntry[] = liveArray(() => derived().labEntries);

export function watchLibrary(): ShelfItem[] {
  const fromUniverses: ShelfItem[] = universes.flatMap((universe) =>
    universe.episodes.map((episode) => ({
      slug: `${universe.slug}-${episode.slug}`,
      title: `${universe.title}: ${episode.title}`,
      pillar: "originals" as const,
      flavors: universe.flavors,
      kind: "Original",
      hook: episode.hook,
      runtime: episode.runtime,
      date: episode.date,
      image: episode.image || universe.image,
      imageAlt: episode.imageAlt || universe.imageAlt,
      href: `/originals/${universe.slug}`,
    })),
  );
  const fromClassics: ShelfItem[] = classics.flatMap((item) => {
    const main: ShelfItem = {
      slug: item.slug,
      title: item.title,
      pillar: "public-domain",
      flavors: item.flavors,
      kind: "Classic",
      hook: item.hook,
      runtime: item.runtime,
      date: item.date,
      image: item.image,
      imageAlt: item.imageAlt,
      featured: item.slug === "the-commit",
      href: `/public-domain/${item.slug}`,
    };
    const episodes: ShelfItem[] = item.episodes.map((episode) => ({
      slug: `${item.slug}-${episode.slug}`,
      title: `${item.title}: ${episode.title}`,
      pillar: "public-domain",
      flavors: item.flavors,
      kind: "Classic",
      hook: episode.hook,
      runtime: episode.runtime,
      date: episode.date,
      image: episode.image || item.image,
      imageAlt: episode.imageAlt || item.imageAlt,
      href: `/public-domain/${item.slug}`,
    }));
    return [main, ...episodes];
  });
  const fromDocs: ShelfItem[] = docs.map((item) => ({
    slug: item.slug,
    title: item.title,
    pillar: "originals" as const,
    flavors: item.flavors,
    kind: "Doc",
    hook: item.hook,
    runtime: item.runtime,
    date: item.date,
    image: item.image,
    imageAlt: item.imageAlt,
    href: "/docs",
  }));
  const fromAir: ShelfItem[] = atmospheres.map((item) => ({
    slug: item.slug,
    title: item.title,
    pillar: "originals" as const,
    flavors: item.flavors,
    kind: "Ambience",
    hook: item.hook,
    runtime: item.runtime,
    date: item.date,
    image: item.image,
    imageAlt: item.imageAlt,
    featured: item.featured,
    href: "/atmospheres",
  }));
  const fromShorts: ShelfItem[] = shorts.map((item) => ({
    slug: item.slug,
    title: item.title,
    pillar: "originals" as const,
    flavors: item.flavors,
    kind: "Short",
    hook: item.hook,
    runtime: item.runtime,
    date: item.date,
    image: item.image,
    imageAlt: item.imageAlt,
    href: "/shorts",
  }));
  const fromLab: ShelfItem[] = labEntries.map((item) => ({
    slug: item.slug,
    title: item.title,
    pillar: "lab" as const,
    flavors: item.flavors,
    kind: "Lab",
    hook: item.paragraphs[0],
    runtime: "Read",
    date: item.date,
    image: item.image,
    href: `/lab/${item.slug}`,
  }));
  return [...fromClassics, ...fromUniverses, ...fromDocs, ...fromAir, ...fromShorts, ...fromLab];
}

/** Narrow a list by pillar and flavor. Either filter may be omitted. */
export function filterShelf(items: ShelfItem[], filter: { pillar?: PillarId; flavor?: FlavorId }) {
  return items.filter(
    (item) =>
      (!filter.pillar || item.pillar === filter.pillar) && (!filter.flavor || item.flavors.includes(filter.flavor)),
  );
}

/** How many items carry each flavor. */
export function flavorCounts(items: { flavors: FlavorId[] }[]): Record<FlavorId, number> {
  const counts: Record<FlavorId, number> = { "quantum-fire": 0, "nebula-miso": 0, "zero-g": 0 };
  for (const item of items) for (const flavor of item.flavors) counts[flavor] += 1;
  return counts;
}

// Direct links already checked on the channel. A title with no real video here, and none in
// site-segments.json, has no visitor YouTube href. Search URLs are not a fallback.
const liveVideos: Record<string, string> = {
  "T.I.R.A. // RIFT The Key Awakens": "https://www.youtube.com/watch?v=buCKa4pm0Rw",
  "Neo-Osaka Rain": "https://www.youtube.com/watch?v=G-YEM6LOE8Y",
  "The Stranger Part 1": "https://www.youtube.com/shorts/15IGDVeL080",
  "The Stranger Part 2": "https://www.youtube.com/shorts/uu762gNCTXY",
  "Iron Beats Wood: Rise of the Ironclad": "https://www.youtube.com/watch?v=sY7_WU6iOz0",
  "Bluff City Immune EP01 · In and Out": "https://youtube.com/shorts/bi-EmlOjDhA",
};

const liveVideoByTitle = new Map<string, string>();
for (const [title, href] of Object.entries(liveVideos)) {
  const real = realWatchHref(href);
  if (real) liveVideoByTitle.set(watchTitleKey(title), real);
}

/** Real watch or Shorts URL for a title, from site-segments.json first, then the checked live map. */
export function youtubeFor(title: string): string | undefined {
  return explicitWatchTitle(title) ?? liveVideoByTitle.get(watchTitleKey(title));
}

const releaseMonths: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** A calendar date on or before today (UTC) is out. "Coming soon" and any other wording is not. */
export function isReleased(date: string) {
  const match = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/.exec(date.trim());
  if (!match) return false;
  const month = releaseMonths[match[1]];
  if (month === undefined) return false;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Date.UTC(Number(match[3]), month, Number(match[2])) <= today;
}

export type Section = {
  id: string;
  label: string;
  /** Menu flavor name shown above the label, when the section is a bowl. */
  flavor?: string;
  bowl?: BowlId;
  href: string;
  promise: string;
};

/** Reading order of the site. Drives the menu, the footer, and each page's "next shelf". */
export const sections: Section[] = liveArray(() => derived().sections);

export function sectionFor(pathname: string): Section | undefined {
  return sections.find((section) => pathname === section.href || pathname.startsWith(`${section.href}/`));
}

export function nextSectionAfter(pathname: string): Section {
  const current = sections.findIndex((section) => section === sectionFor(pathname));
  return sections[(current + 1) % sections.length];
}

/** Previous and next items in a list, wrapping around. Returns only `next` when the list has two items. */
export function neighbours<T>(items: T[], index: number): { previous?: T; next?: T } {
  if (items.length < 2 || index < 0) return {};
  const next = items[(index + 1) % items.length];
  const previous = items[(index - 1 + items.length) % items.length];
  return items.length === 2 ? { next } : { previous, next };
}

export type Feature = {
  slug: string;
  bowl: BowlId;
  kicker: string;
  title: string;
  logline: string;
  meta: string[];
  image: string;
  imageAlt: string;
  href: string;
  detailsLabel: string;
  watchHref: string;
  /** Premiere of the video this card's Watch control points at. */
  date: string;
};

export const features: Feature[] = liveArray(() => derived().features);
