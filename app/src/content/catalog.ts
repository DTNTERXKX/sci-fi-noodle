export const studio = {
  name: "SCI-FI NOODLES",
  line: "AI-cooked sci-fi for curious minds.",
  signoff: "Watch. Drift. Explore the future.",
  owner: "NVESTED REALITY LLC",
  year: 2026,
  youtube: "https://www.youtube.com/results?search_query=SCI-FI+NOODLES",
} as const;

export type PillarId =
  | "originals"
  | "public-domain"
  | "docs"
  | "atmospheres"
  | "shorts"
  | "lab";

export type ShelfItem = {
  slug: string;
  title: string;
  pillar: PillarId;
  kind: string;
  hook: string;
  runtime: string;
  date: string;
  image: string;
  featured?: boolean;
  href: string;
};

export const pillars: {
  id: PillarId;
  title: string;
  href: string;
  promise: string;
  image: string;
}[] = [
  {
    id: "originals",
    title: "Original Universes",
    href: "/originals",
    promise: "Worlds with their own rules, kept separate from each other.",
    image: "/assets/stills/tira.png",
  },
  {
    id: "public-domain",
    title: "Public Domain",
    href: "/public-domain",
    promise: "Old books, retold as problems we have now.",
    image: "/assets/stills/commit.png",
  },
  {
    id: "docs",
    title: "Sci-Fi Docs",
    href: "/docs",
    promise: "Future ideas, taught with a cinematic eye.",
    image: "/assets/stills/docs.png",
  },
  {
    id: "atmospheres",
    title: "Atmospheres",
    href: "/atmospheres",
    promise: "A place to stay when you want the room more than the plot.",
    image: "/assets/stills/atmosphere.png",
  },
  {
    id: "shorts",
    title: "Shorts",
    href: "/shorts",
    promise: "A new strange thing in under a minute.",
    image: "/assets/stills/stranger.png",
  },
  {
    id: "lab",
    title: "The Lab",
    href: "/lab",
    promise: "How the shots get cooked, including the ones that fail.",
    image: "/assets/stills/lab.png",
  },
];

export type Universe = {
  slug: string;
  title: string;
  logline: string;
  premise: string;
  status: string;
  image: string;
  episodes: { slug: string; title: string; hook: string; runtime: string; date: string }[];
};

export const universes: Universe[] = [
  {
    slug: "tira-rift",
    title: "TIRA // RIFT",
    logline: "Memphis, 2099. A signal that should not exist.",
    premise:
      "Major Amara Kade follows a rift signal through a future Memphis. TIRA // RIFT keeps its own story, characters, and rules. The channel only shelves it.",
    status: "Season one in production",
    image: "/assets/stills/tira.png",
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
  runtime: string;
  date: string;
};

export const classics: Classic[] = [
  {
    slug: "the-commit",
    title: "Frankenstein: The Commit",
    hook: "A lab ships a model, then goes home.",
    source: "Frankenstein",
    creator: "Mary Shelley",
    published: "1818",
    rights: "Built from the 1818 text. Later films, illustrations, and translations are not the source.",
    image: "/assets/stills/commit.png",
    runtime: "5 min",
    date: "Oct 10, 2026",
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
  },
];

export const atmospheres = [
  { slug: "pod-bay-117", title: "Pod Bay 117", hook: "Coolant hum, frost ticking, one amber light.", runtime: "2 hr", date: "Oct 11, 2026", image: "/assets/stills/stranger.png" },
  { slug: "observation-rain", title: "Observation Rain", hook: "A ringed planet and weather on the glass.", runtime: "2 hr", date: "Oct 25, 2026", image: "/assets/stills/atmosphere.png" },
  { slug: "freighter-night", title: "Freighter Night Shift", hook: "A coffee bulb, and a radio check every twenty minutes.", runtime: "2 hr", date: "Nov 8, 2026", image: "/assets/stills/atmosphere.png" },
  { slug: "neo-osaka-rain", title: "Neo-Osaka Rain, 2187", hook: "Ramen going cold. A train every eleven minutes.", runtime: "2 hr", date: "Dec 27, 2026", image: "/assets/stills/tira.png" },
];

export const docs = [
  { slug: "the-archon-files", title: "The Archon Files", hook: "A superintelligence, told in coffee rings and redactions.", runtime: "10 min", date: "Nov 2026", image: "/assets/stills/docs.png" },
  { slug: "cities-of-2150", title: "Cities of 2150", hook: "Five rooftops. Facts labeled. Guesses labeled.", runtime: "12 min", date: "Nov 2026", image: "/assets/stills/docs.png" },
  { slug: "the-last-5-billion-years", title: "The Last 5 Billion Years", hook: "Earth's future, deadpan, one era at a time.", runtime: "9 min", date: "Dec 2026", image: "/assets/stills/docs.png" },
];

export const shorts = [
  { slug: "the-sky-broke", title: "The Sky Broke", hook: "A crack in a blue afternoon. The crossing guard keeps waving.", runtime: "45 sec", date: "Oct 19, 2026", image: "/assets/stills/docs.png" },
  { slug: "ten-seconds", title: "10 Seconds to Impact", hook: "One cracked watch. He finishes the sandwich.", runtime: "30 sec", date: "Nov 2, 2026", image: "/assets/stills/commit.png" },
  { slug: "one-tree", title: "One Tree, One Million Years", hook: "A rope swing, an acorn, and the knot that stays.", runtime: "60 sec", date: "Nov 23, 2026", image: "/assets/stills/atmosphere.png" },
];

export const labEntries = [
  {
    slug: "how-a-shot-is-cooked",
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
    title: "What stays in the series",
    category: "Studio rule",
    date: "Oct 5, 2026",
    image: "/assets/stills/tira.png",
    paragraphs: [
      "SCI-FI NOODLES owns the channel: the mark, the shelves, the newsletter, the way a visitor finds a second film.",
      "Each universe owns its canon. TIRA // RIFT does not lend its history to The Stranger. A public-domain retelling does not become channel lore.",
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
      kind: "Original",
      hook: episode.hook,
      runtime: episode.runtime,
      date: episode.date,
      image: universe.image,
      href: `/originals/${universe.slug}`,
    })),
  );
  const fromClassics: ShelfItem[] = classics.map((item) => ({
    slug: item.slug,
    title: item.title,
    pillar: "public-domain" as const,
    kind: "Classic",
    hook: item.hook,
    runtime: item.runtime,
    date: item.date,
    image: item.image,
    featured: item.slug === "the-commit",
    href: `/public-domain/${item.slug}`,
  }));
  const fromDocs: ShelfItem[] = docs.map((item) => ({
    slug: item.slug,
    title: item.title,
    pillar: "docs" as const,
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
    pillar: "atmospheres" as const,
    kind: "Atmosphere",
    hook: item.hook,
    runtime: item.runtime,
    date: item.date,
    image: item.image,
    href: "/atmospheres",
  }));
  const fromShorts: ShelfItem[] = shorts.map((item) => ({
    slug: item.slug,
    title: item.title,
    pillar: "shorts" as const,
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
    kind: "Lab",
    hook: item.paragraphs[0],
    runtime: "Read",
    date: item.date,
    image: item.image,
    href: `/lab/${item.slug}`,
  }));
  return [...fromClassics, ...fromUniverses, ...fromDocs, ...fromAir, ...fromShorts, ...fromLab];
}

export function youtubeFor(title: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`SCI-FI NOODLES ${title}`)}`;
}
