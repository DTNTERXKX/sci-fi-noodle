export const studio = {
  name: "SCI-FI NOODLES",
  line: "Different Flavors. Infinite Universes.",
  menu: "COSMIC RAMEN // MENU 001",
  signoff: "Choose your flavor. Explore the multiverse.",
  owner: "NVESTED REALITY LLC",
  youtube: "https://www.youtube.com/results?search_query=SCI-FI+NOODLES",
} as const;

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
export const bowls: Bowl[] = [
  {
    id: "black-hole",
    number: "01",
    name: "Black Hole Tonkotsu",
    short: "Black Hole",
    category: "Original Universes",
    navLabel: "Original Universes",
    tagline: "Rich. Deep. Limitless.",
    description:
      "The flagship bowl. Original sci-fi films, original characters, expansive universes, serialized adventures, and exclusive SCI-FI NOODLES productions.",
    href: "/originals",
    role: "pillar",
    pillar: "originals",
  },
  {
    id: "timewarp",
    number: "02",
    name: "Timewarp Shoyu",
    short: "Timewarp",
    category: "Public Domain",
    navLabel: "Public Domain",
    tagline: "Classic Stories. New Dimensions.",
    description:
      "Classic science fiction reinvented through cinematic adaptations, modern reinterpretations, remixes, and documentaries inspired by public-domain works.",
    href: "/public-domain",
    role: "pillar",
    pillar: "public-domain",
  },
  {
    id: "quantum-fire",
    number: "03",
    name: "Quantum Fire Tantanmen",
    short: "Quantum Fire",
    category: "Sci-Fi Shorts",
    navLabel: "Sci-Fi Shorts",
    tagline: "Small Bites. Maximum Impact.",
    description:
      "Bite-sized science fiction, experimental concepts, plot twists, micro-films, and standalone cinematic encounters.",
    href: "/shorts",
    role: "flavor",
    flavor: "quantum-fire",
  },
  {
    id: "nebula-miso",
    number: "04",
    name: "Nebula Miso",
    short: "Nebula",
    category: "Documentaries & Lore",
    navLabel: "Documentaries",
    tagline: "A Universe Worth Exploring.",
    description:
      "Science fiction history, futuristic technology, artificial intelligence, space exploration, worldbuilding, and deep dives into fictional universes.",
    href: "/docs",
    role: "flavor",
    flavor: "nebula-miso",
  },
  {
    id: "zero-g",
    number: "05",
    name: "Zero-G Shio",
    short: "Zero-G",
    category: "ASMR & Ambience",
    navLabel: "ASMR & Ambience",
    tagline: "Float Beyond Reality.",
    description:
      "Immersive starship interiors, spacecraft engine hums, alien rainstorms, distant colonies, orbital observation lounges, and atmospheric relaxation videos.",
    href: "/atmospheres",
    role: "flavor",
    flavor: "zero-g",
  },
  {
    id: "cyberpunk",
    number: "06",
    name: "Cyberpunk Fusion",
    short: "Cyberpunk",
    category: "The Lab",
    navLabel: "The Lab",
    tagline: "Where Imagination Meets Innovation.",
    description:
      "Behind-the-scenes production, AI filmmaking experiments, filmmaking technology, creative tools, visual effects breakdowns, and experimental media.",
    href: "/lab",
    role: "pillar",
    pillar: "lab",
  },
];

export const pillarBowls = bowls.filter((bowl): bowl is Bowl & { role: "pillar" } => bowl.role === "pillar");
export const flavorBowls = bowls.filter((bowl): bowl is Bowl & { role: "flavor" } => bowl.role === "flavor");

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

const posterAlt = {
  tira: "T.I.R.A. // RIFT key art. A heroine in black armor stands on a wrecked bridge with a white robot behind her, a river skyline burning at sunset and warships in the sky.",
  commit: "A white robot sits alone at a lab bench at night, rain on tall windows glowing orange over the city, a laptop full of code in the foreground.",
  neoOsaka:
    "A cozy apartment at night: a cat asleep, a steaming bowl of noodles and a mug at a rain-streaked window over a neon city and an elevated train.",
} as const;

export type Universe = {
  slug: string;
  title: string;
  logline: string;
  premise: string;
  status: string;
  image: string;
  imageAlt?: string;
  flavors: FlavorId[];
  episodes: { slug: string; title: string; hook: string; runtime: string; date: string }[];
};

export const universes: Universe[] = [
  {
    slug: "tira-rift",
    title: "T.I.R.A. // RIFT",
    logline: "Memphis, 2099. A signal that should not exist.",
    premise:
      "Major Amara Kade follows a rift signal through a future Memphis. T.I.R.A. // RIFT keeps its own story, characters, and rules. The channel only shelves it.",
    status: "Season one in production",
    image: "/assets/stills/tira-poster.jpg",
    imageAlt: posterAlt.tira,
    flavors: [],
    episodes: [
      { slug: "the-key-awakens", title: "The Key Awakens", hook: "The first signal locks onto a name.", runtime: "4 min", date: "Oct 2, 2026" },
      { slug: "the-ball-crashers", title: "The Ball Crashers", hook: "A night out turns into a breach drill.", runtime: "4 min", date: "Oct 16, 2026" },
      { slug: "echoes-of-ngairo", title: "Echoes of Ngairo", hook: "The seed answers in someone else's voice.", runtime: "4 min", date: "Oct 30, 2026" },
      { slug: "the-undercity-breach", title: "The Undercity Breach", hook: "The street below the canopy opens.", runtime: "4 min", date: "Nov 13, 2026" },
      { slug: "titan-warning", title: "Titan Warning", hook: "A far alarm arrives on a local frequency.", runtime: "4 min", date: "Nov 27, 2026" },
    ],
  },
  {
    slug: "the-stranger",
    title: "The Stranger",
    logline: "He woke 212 years early. Someone had asked the ship for company.",
    premise:
      "A colonist comes out of sleep long before the colony does, and finds a request log with his name already in it. The Stranger is its own original universe.",
    status: "Shorts, then a compilation",
    image: "/assets/stills/stranger.png",
    flavors: ["quantum-fire"],
    episodes: [
      { slug: "part-1", title: "Part 1", hook: "The pod opens. The coffee maker is already warm.", runtime: "1 min", date: "Oct 5, 2026" },
      { slug: "part-2", title: "Part 2", hook: "Two mugs. One question.", runtime: "1 min", date: "Oct 12, 2026" },
      { slug: "compilation", title: "Parts 1 to 5", hook: "The full wake-up, cut as one film.", runtime: "6 min", date: "Dec 26, 2026" },
    ],
  },
];

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
};

export const classics: Classic[] = [
  {
    slug: "the-commit",
    title: "Frankenstein: The Commit",
    hook: "A lab ships an A.I. model release, then goes home.",
    source: "Frankenstein",
    creator: "Mary Shelley",
    published: "1818",
    rights: "Built from the 1818 text. Later films, illustrations, and translations are not the source.",
    image: "/assets/stills/commit-poster.jpg",
    imageAlt: posterAlt.commit,
    runtime: "5 min",
    date: "Oct 10, 2026",
    flavors: ["quantum-fire"],
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    hook: "The island has a user agreement now.",
    source: "The Island of Doctor Moreau",
    creator: "H. G. Wells",
    published: "1896",
    rights: "Built from the 1896 novel. Later screen versions are not the source.",
    image: "/assets/stills/atmosphere.png",
    runtime: "5 min",
    date: "Oct 17, 2026",
    flavors: ["quantum-fire"],
  },
  {
    slug: "the-alert",
    title: "The Alert",
    hook: "8:47 p.m. Every phone in town buzzes at once.",
    source: "The War of the Worlds",
    creator: "H. G. Wells",
    published: "1898",
    rights: "Built from the 1898 novel. The 1938 broadcast and later films are not the source.",
    image: "/assets/stills/docs.png",
    runtime: "6 min",
    date: "Oct 30, 2026",
    flavors: ["quantum-fire"],
  },
  {
    slug: "universal-robots",
    title: "Universal Robots",
    hook: "The factory ships people-shaped tools. The tools read the manual.",
    source: "R.U.R.",
    creator: "Karel Capek",
    published: "1920",
    rights: "Public-domain status can change by translation. This project uses the 1920 play, not later adaptations.",
    image: "/assets/stills/lab.png",
    runtime: "5 min",
    date: "Nov 7, 2026",
    flavors: [],
  },
  {
    slug: "glass-city",
    title: "Glass City",
    hook: "A city where the walls are the paperwork.",
    source: "We",
    creator: "Yevgeny Zamyatin",
    published: "1924",
    rights: "Only the 1924 Zilboorg translation is treated as the source. Other translations stay out.",
    image: "/assets/stills/docs.png",
    runtime: "8 min",
    date: "Nov 18, 2026",
    flavors: [],
  },
  {
    slug: "the-other-maria",
    title: "The Other Maria",
    hook: "A city builds a saint, then asks her to clock in.",
    source: "Metropolis",
    creator: "Thea von Harbou",
    published: "1925",
    rights: "Built from the 1925 novel. The 1927 film is still protected in many countries and is not used.",
    image: "/assets/stills/tira.png",
    runtime: "5 min",
    date: "Nov 21, 2026",
    flavors: [],
  },
  {
    slug: "the-plateau",
    title: "The Plateau",
    hook: "The map ends. The animals did not.",
    source: "The Lost World",
    creator: "Arthur Conan Doyle",
    published: "1912",
    rights: "Built from the 1912 novel, not later film dinosaurs or character designs.",
    image: "/assets/stills/atmosphere.png",
    runtime: "5 min",
    date: "Dec 5, 2026",
    flavors: [],
  },
  {
    slug: "air-factory",
    title: "Air Factory",
    hook: "Mars runs out of breath on a schedule.",
    source: "A Princess of Mars",
    creator: "Edgar Rice Burroughs",
    published: "1912",
    rights: "Built from the 1912 novel. Names and marks that are still trademarked are avoided.",
    image: "/assets/stills/docs.png",
    runtime: "5 min",
    date: "Dec 12, 2026",
    flavors: [],
  },
  {
    slug: "802701",
    title: "802,701",
    hook: "The night shift that keeps the future running.",
    source: "The Time Machine",
    creator: "H. G. Wells",
    published: "1895",
    rights: "Built from the 1895 novel. Later films are not the source.",
    image: "/assets/stills/commit.png",
    runtime: "6 min",
    date: "Dec 29, 2026",
    flavors: [],
  },
];

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

export const atmospheres: Atmosphere[] = [
  {
    slug: "neo-osaka-rain",
    title: "Neo-Osaka Rain",
    hook: "An immersive rain and steam soundscape. Rain on the glass, steam off the noodles, a cat asleep by the window.",
    runtime: "2 hr",
    date: "Dec 27, 2026",
    image: "/assets/stills/neo-osaka-rain.jpg",
    imageAlt: posterAlt.neoOsaka,
    place: "NEO OSAKA 2187",
    episode: "EP01 // Rain on Glass",
    featured: true,
    flavors: ["zero-g"],
  },
  { slug: "pod-bay-117", title: "Pod Bay 117", hook: "Coolant hum, frost ticking, one amber light.", runtime: "2 hr", date: "Oct 11, 2026", image: "/assets/stills/stranger.png", flavors: ["zero-g"] },
  { slug: "observation-rain", title: "Observation Rain", hook: "A ringed planet and weather on the glass.", runtime: "2 hr", date: "Oct 25, 2026", image: "/assets/stills/atmosphere.png", flavors: ["zero-g"] },
  { slug: "freighter-night", title: "Freighter Night Shift", hook: "A coffee bulb, and a radio check every twenty minutes.", runtime: "2 hr", date: "Nov 8, 2026", image: "/assets/stills/atmosphere.png", flavors: ["zero-g"] },
];

export const docs = [
  { slug: "the-archon-files", title: "The Archon Files", hook: "A superintelligence, told in coffee rings and redactions.", runtime: "10 min", date: "Nov 2026", image: "/assets/stills/docs.png", flavors: ["nebula-miso"] as FlavorId[] },
  { slug: "cities-of-2150", title: "Cities of 2150", hook: "Five rooftops. Facts labeled. Guesses labeled.", runtime: "12 min", date: "Nov 2026", image: "/assets/stills/docs.png", flavors: ["nebula-miso"] as FlavorId[] },
  { slug: "the-last-5-billion-years", title: "The Last 5 Billion Years", hook: "Earth's future, deadpan, one era at a time.", runtime: "9 min", date: "Dec 2026", image: "/assets/stills/docs.png", flavors: ["nebula-miso"] as FlavorId[] },
];

export const shorts = [
  { slug: "the-sky-broke", title: "The Sky Broke", hook: "A crack in a blue afternoon. The crossing guard keeps waving.", runtime: "45 sec", date: "Oct 19, 2026", image: "/assets/stills/docs.png", flavors: ["quantum-fire"] as FlavorId[] },
  { slug: "ten-seconds", title: "10 Seconds to Impact", hook: "One cracked watch. He finishes the sandwich.", runtime: "30 sec", date: "Nov 2, 2026", image: "/assets/stills/commit.png", flavors: ["quantum-fire"] as FlavorId[] },
  { slug: "one-tree", title: "One Tree, One Million Years", hook: "A rope swing, an acorn, and the knot that stays.", runtime: "60 sec", date: "Nov 23, 2026", image: "/assets/stills/atmosphere.png", flavors: ["quantum-fire"] as FlavorId[] },
];

export const labEntries = [
  {
    slug: "how-a-shot-is-cooked",
    flavors: ["nebula-miso"] as FlavorId[],
    title: "How a shot is cooked",
    category: "Process",
    date: "Oct 5, 2026",
    image: "/assets/stills/lab.png",
    paragraphs: [
      "A SCI-FI NOODLES shot starts as a sentence with a clock in it. Then a place. Then one object the camera can actually find.",
      "The picture is built before the motion. A street, a pod, a lab table. Characters and props are drawn against that same place so the world does not change its mind between cuts.",
      "Motion comes next, in short takes. Dialogue and music land in the edit, not inside the raw clip. If a take looks expensive and says nothing, it gets cut.",
      "The public page stops there. Series bibles, prompts, and continuity locks stay inside the series folder.",
    ],
  },
  {
    slug: "failed-noodles",
    flavors: ["quantum-fire"] as FlavorId[],
    title: "Failed noodles",
    category: "Experiments",
    date: "Oct 5, 2026",
    image: "/assets/stills/lab.png",
    paragraphs: [
      "Most experiments fail in a useful way. A hand melts. A street sign invents a language. A face drifts between two people who were never cast.",
      "Failed noodles stay on the shelf when they teach the next take: what the camera should not see, which sentence was doing too much, which light made the room look like a toy.",
      "They are not blooper reels. They are the reason the finished shot looks inevitable.",
    ],
  },
  {
    slug: "what-stays-in-the-series",
    flavors: ["nebula-miso"] as FlavorId[],
    title: "What stays in the series",
    category: "Studio rule",
    date: "Oct 5, 2026",
    image: "/assets/stills/tira.png",
    paragraphs: [
      "SCI-FI NOODLES owns the channel: the mark, the shelves, the newsletter, the way a visitor finds a second film.",
      "Each universe owns its canon. T.I.R.A. // RIFT does not lend its history to The Stranger. A public-domain retelling does not become channel lore.",
      "If a page here feels like a poster and not an encyclopedia, that is the point. The deep map lives with the series.",
    ],
  },
];

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
      image: universe.image,
      imageAlt: universe.imageAlt,
      href: `/originals/${universe.slug}`,
    })),
  );
  const fromClassics: ShelfItem[] = classics.map((item) => ({
    slug: item.slug,
    title: item.title,
    pillar: "public-domain" as const,
    flavors: item.flavors,
    kind: "Classic",
    hook: item.hook,
    runtime: item.runtime,
    date: item.date,
    image: item.image,
    imageAlt: item.imageAlt,
    featured: item.slug === "the-commit",
    href: `/public-domain/${item.slug}`,
  }));
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

export function youtubeFor(title: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`SCI-FI NOODLES ${title}`)}`;
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

function bowlSection(id: BowlId): Section {
  const bowl = bowls.find((item) => item.id === id) as Bowl;
  return {
    id: bowl.role === "pillar" ? bowl.pillar : bowl.flavor,
    label: bowl.category,
    flavor: bowl.name,
    bowl: bowl.id,
    href: bowl.href,
    promise: bowl.tagline,
  };
}

/** Reading order of the site. Drives the menu, the footer, and each page's "next shelf". */
export const sections: Section[] = [
  { id: "watch", label: "Watch", flavor: "The whole menu", href: "/watch", promise: "Every bowl on one board. Filter by pillar or by flavor." },
  bowlSection("black-hole"),
  bowlSection("timewarp"),
  bowlSection("cyberpunk"),
  bowlSection("quantum-fire"),
  bowlSection("nebula-miso"),
  bowlSection("zero-g"),
  { id: "host", label: "Katara", href: "/host", promise: "Talk to the studio host. Chill, crunk, or glam." },
  { id: "about", label: "About", href: "/about", promise: "Who runs the kitchen, and why AI is only the stove." },
];

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
};

export const features: Feature[] = [
  {
    slug: "the-commit",
    bowl: "timewarp",
    kicker: "Next premiere · Oct 10, 2026",
    title: "Frankenstein: The Commit",
    logline: "A lab ships an A.I. model release, then goes home. Mary Shelley's 1818 novel, retold as a problem we have now.",
    meta: ["Timewarp Shoyu", "5 min", "After Mary Shelley, 1818"],
    image: "/assets/stills/commit-poster.jpg",
    imageAlt: posterAlt.commit,
    href: "/public-domain/the-commit",
    detailsLabel: "Source and rights",
    watchHref: youtubeFor("Frankenstein: The Commit"),
  },
  {
    slug: "tira-rift",
    bowl: "black-hole",
    kicker: "Black Hole Tonkotsu · Season one",
    title: "T.I.R.A. // RIFT",
    logline: "Memphis, 2099. Major Amara Kade follows a signal that should not exist.",
    meta: ["Original series", "5 episodes", "In production"],
    image: "/assets/stills/tira-poster.jpg",
    imageAlt: posterAlt.tira,
    href: "/originals/tira-rift",
    detailsLabel: "All episodes",
    watchHref: youtubeFor("T.I.R.A. // RIFT The Key Awakens"),
  },
  {
    slug: "neo-osaka-rain",
    bowl: "zero-g",
    kicker: "Zero-G Shio · NEO OSAKA 2187",
    title: "Neo-Osaka Rain",
    logline: "An immersive rain and steam soundscape. Rain on the glass, steam off the noodles, a cat asleep by the window.",
    meta: ["EP01 // Rain on Glass", "2 hr", "Binaural"],
    image: "/assets/stills/neo-osaka-rain.jpg",
    imageAlt: posterAlt.neoOsaka,
    href: "/atmospheres",
    detailsLabel: "More Zero-G Shio",
    watchHref: youtubeFor("Neo-Osaka Rain"),
  },
];
