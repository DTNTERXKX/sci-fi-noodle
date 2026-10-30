export const studio = {
  name: "SCI-FI NOODLES",
  line: "Different Flavors. Infinite Universes.",
  menu: "COSMIC RAMEN // MENU 001",
  signoff: "Choose your flavor. Explore the multiverse.",
  owner: "NVESTED REALITY LLC",
  youtube: "https://www.youtube.com/@SCIFINOODLES",
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
  tira: "T.I.R.A. // RIFT title over a dark luxury apartment great room: marble kitchen island, pendant lights, red roses, a river skyline at dusk through the windows.",
  commit: "FRANKENSTEIN: THE COMMIT title over a 2D anime lab at night, rain on tall arched windows glowing orange and server racks lit blue.",
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
    logline: "Something under the bluff is waking up, and Dimension N wants it first.",
    premise:
      "Memphis, 2099. Major Amara Kade is off duty at 06:43. By 07:40 she has lost the good couch, caught a nine-metre girder over a full bus, and climbed into MAAT-77.",
    status: "Season one in production",
    image: "/assets/heroes/tira-rift.png",
    imageAlt: "T.I.R.A. // RIFT title over a dark luxury apartment great room: marble kitchen island, pendant lights, red roses, a river skyline at dusk through the windows.",
    flavors: [],
    episodes: [
      { slug: "the-key-awakens", title: "The Key Awakens", hook: "One morning, one city, one couch. Three soldiers come through her window; by 07:40 she's caught a girder over a full bus.", runtime: "10 min", date: "Oct 16, 2026" },
      { slug: "the-ball-crashers", title: "The Ball Crashers", hook: "A gala on Hyde Lake at Shelby Farms. The trouble comes through the service doors.", runtime: "4 min", date: "Nov 6, 2026" },
      { slug: "echoes-of-ngairo", title: "Echoes of Ngairo", hook: "On Cobblestone Landing, a seven-notched keystone turns to face her.", runtime: "4 min", date: "Nov 20, 2026" },
      { slug: "the-undercity-breach", title: "The Undercity Breach", hook: "Under Front Street the dig reaches the city's machinery, and the same girder falls again, this time over a friend.", runtime: "4 min", date: "Dec 4, 2026" },
      { slug: "titan-warning", title: "Titan Warning", hook: "The quiet one. No fight, one number, a Titan beside the M bridge.", runtime: "4 min", date: "Dec 18, 2026" },
      { slug: "maat-protocol", title: "MAAT Protocol", hook: "One mech, one steel frame, one word said five times on the Chickasaw Bluffs.", runtime: "", date: "Jan 1, 2027" },
      { slug: "rift-night", title: "Rift Night", hook: "Seven breaches, four people, and one of them walks the wrong way on purpose.", runtime: "", date: "Jan 15, 2027" },
      { slug: "2027-transmission", title: "2027 Transmission", hook: "", runtime: "", date: "Jan 29, 2027" },
    ],
  },
  {
    slug: "the-stranger",
    title: "The Stranger",
    logline: "You're a cryo tech on a colony ship, and you're two hundred years early.",
    premise:
      "The first thing you hear is the seal. Somebody filled out the wake-up request 1,352 times. THE STRANGER: a five-part first-person sci-fi Short series.",
    status: "Shorts, then a compilation",
    image: "/assets/stills/stranger.png",
    imageAlt: "A dark, curved cryo hall on a ship: a long row of frosted sleep pods with green status lights under a strip of white light.",
    flavors: ["quantum-fire"],
    episodes: [
      { slug: "part-1", title: "Part 1", hook: "The pod opens. The coffee maker is already warm.", runtime: "1 min", date: "Oct 1, 2026" },
      { slug: "part-2", title: "Part 2", hook: "Two mugs. One question.", runtime: "1 min", date: "Oct 7, 2026" },
      { slug: "part-3", title: "Part 3 · The Criteria", hook: "", runtime: "1 min", date: "Nov 13, 2026" },
      { slug: "part-4", title: "Part 4 · Two Keys", hook: "", runtime: "1 min", date: "Dec 4, 2026" },
      { slug: "part-5", title: "Part 5 · On Time", hook: "", runtime: "1 min", date: "Jan 1, 2027" },
      { slug: "compilation", title: "Parts 1 to 5", hook: "The full wake-up, cut as one film.", runtime: "4 min", date: "Jan 23, 2027" },
    ],
  },
  {
    slug: "bluff-city-immune",
    title: "Bluff City Immune",
    logline: "A micro-drama about one immune family in Whitehaven, a minute at a time.",
    premise:
      "2:00 PM. Dad hands Kort the fob to Grace for the first time and doesn't let go right away. One job: Miss Pearl's insulin from the hospital on Elvis Presley Boulevard. In and out.",
    status: "Teaser Nov 29 · episodes from Dec 11",
    image: "/assets/heroes/bluff-city-immune.png",
    imageAlt: "BLUFF CITY IMMUNE title over a graphic-novel painting of a gated subdivision at golden hour, power lines against an orange sky.",
    flavors: [],
    episodes: [
      { slug: "teaser", title: "Teaser", hook: "", runtime: "", date: "Nov 29, 2026" },
      { slug: "in-and-out", title: "EP01 · In and Out", hook: "", runtime: "60–90 sec", date: "Dec 11, 2026" },
      { slug: "deliverance", title: "EP02 · Deliverance", hook: "", runtime: "60–90 sec", date: "Dec 12, 2026" },
      { slug: "back-by-five", title: "EP03 · Back by Five", hook: "", runtime: "60–90 sec", date: "Dec 13, 2026" },
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
    hook: "1:00 a.m. The lab pushes to production and the whole team goes home. Nobody stays to see what it does next.",
    source: "Frankenstein",
    creator: "Mary Shelley",
    published: "1818",
    rights: "Built from the 1818 text. Later films, illustrations, and translations are not the source.",
    image: "/assets/heroes/the-commit.png",
    imageAlt: "FRANKENSTEIN: THE COMMIT title over a 2D anime lab at night, rain on tall arched windows glowing orange and server racks lit blue.",
    runtime: "5 min",
    date: "Nov 7, 2026",
    flavors: ["quantum-fire"],
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    hook: "The staff used to be animals. Every morning they recite the terms. \"Are we not men?\"",
    source: "The Island of Doctor Moreau",
    creator: "H. G. Wells",
    published: "1896",
    rights: "Built from the 1896 novel. Later screen versions are not the source.",
    image: "/assets/heroes/terms-of-service.png",
    imageAlt: "TERMS OF SERVICE title over a storm-dark tropical research compound, a wet concrete walkway between jungle and waterfalls.",
    runtime: "5 min",
    date: "Nov 14, 2026",
    flavors: ["quantum-fire"],
  },
  {
    slug: "the-alert",
    title: "The Alert",
    hook: "8:47 p.m. An emergency alert buzzes every phone in Woking at once. Nobody runs.",
    source: "The War of the Worlds",
    creator: "H. G. Wells",
    published: "1898",
    rights: "A work of fiction. Nothing in this video happened. Built from the 1898 novel. The 1938 broadcast and later films are not the source.",
    image: "/assets/heroes/the-alert.png",
    imageAlt: "THE ALERT title over a night-vision doorbell-camera view of a quiet terraced street, a parked car and drifting mist.",
    runtime: "5 min",
    date: "Nov 27, 2026",
    flavors: ["quantum-fire"],
  },
  {
    slug: "universal-robots",
    title: "Universal Robots",
    hook: "Monday, 6:00 a.m. The factory hires its ten-thousandth robot and lays off its last human, with a fruit basket and a lanyard.",
    source: "R.U.R.",
    creator: "Karel Capek",
    published: "1920",
    rights: "Public-domain status can change by translation. This project uses the 1920 play, not later adaptations.",
    image: "/assets/heroes/universal-robots.png",
    imageAlt: "UNIVERSAL ROBOTS title over a gleaming white factory hall lined with amber-lit glass tanks.",
    runtime: "5 min",
    date: "Dec 5, 2026",
    flavors: [],
  },
  {
    slug: "glass-city",
    title: "Glass City",
    hook: "Privacy curtains come down only with a pink ticket, at set times.",
    source: "We",
    creator: "Yevgeny Zamyatin",
    published: "1924",
    rights: "Only the 1924 Zilboorg translation is treated as the source. Other translations stay out.",
    image: "/assets/stills/docs.png",
    imageAlt: "A dark observatory: a large telescope, an empty chair, and star charts on a console under a domed window onto a spiral galaxy.",
    runtime: "8 min",
    date: "Dec 9, 2026",
    flavors: [],
  },
  {
    slug: "the-other-maria",
    title: "The Other Maria",
    hook: "Then Maria shows up on every screen, saying exactly what the workers want to hear. Except Maria's at home.",
    source: "Metropolis",
    creator: "Thea von Harbou",
    published: "1925",
    rights: "Built from the 1925 novel. The 1927 film is still protected in many countries and is not used.",
    image: "/assets/heroes/the-other-maria.png",
    imageAlt: "THE OTHER MARIA title over a vast candlelit hall of tiered stone balconies and warm gold light.",
    runtime: "5 min",
    date: "Dec 19, 2026",
    flavors: [],
  },
  {
    slug: "the-plateau",
    title: "The Plateau",
    hook: "Day 3, the stream catches a pterosaur. Day 5, the plateau's sold. \"Don't tag the location.\"",
    source: "The Lost World",
    creator: "Arthur Conan Doyle",
    published: "1912",
    rights: "Built from the 1912 novel, not later film dinosaurs or character designs.",
    image: "/assets/heroes/the-plateau.png",
    imageAlt: "THE PLATEAU title over a misty jungle plateau of red cliffs and waterfalls above a winding river.",
    runtime: "5 min",
    date: "Jan 2, 2027",
    flavors: [],
  },
  {
    slug: "air-factory",
    title: "Air Factory",
    hook: "2:14 a.m. A combat veteran who can't sleep walks out into the Arizona desert and wakes up on Mars.",
    source: "A Princess of Mars",
    creator: "Edgar Rice Burroughs",
    published: "1912",
    rights: "Built from the 1912 novel. Names and marks that are still trademarked are avoided.",
    image: "/assets/heroes/air-factory.png",
    imageAlt: "AIR FACTORY title over a painted red Martian desert at sunset, a distant city and two moons in the sky.",
    runtime: "5 min",
    date: "Jan 9, 2027",
    flavors: [],
  },
  {
    slug: "802701",
    title: "802,701",
    hook: "By 802,701 humanity has split in two: pretty people in white linen who never learned to fix a thing, and the night shift that keeps the servers humming.",
    source: "The Time Machine",
    creator: "H. G. Wells",
    published: "1895",
    rights: "Built from the 1895 novel. Later films are not the source.",
    image: "/assets/heroes/802701.png",
    imageAlt: "802,701 title over an oil-painted overgrown garden of ruined stone statues and flowers at sunset.",
    runtime: "6 min",
    date: "Jan 26, 2027",
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
    date: "Oct 17, 2026",
    image: "/assets/stills/neo-osaka-rain.jpg",
    imageAlt: posterAlt.neoOsaka,
    place: "NEO OSAKA 2187",
    episode: "EP01 // Rain on Glass",
    featured: true,
    flavors: ["zero-g"],
  },
  { slug: "pod-bay-117", title: "Pod Bay 117", hook: "Sealed frosted pod, empty pod 116 with one fresh tally mark, two enamel mugs, coolant hum.", runtime: "2 hr", date: "Dec 13, 2026", image: "/assets/stills/stranger.png", imageAlt: "A dark, curved cryo hall on a ship: a long row of frosted sleep pods with green status lights under a strip of white light.", flavors: ["zero-g"] },
  { slug: "observation-rain", title: "Moreau Island, Night Rain", hook: "Guest room on Noble Isle, rain on a tin roof, distant surf.", runtime: "2 hr", date: "Nov 22, 2026", image: "/assets/stills/atmosphere.png", imageAlt: "An empty observation lounge with dark leather seats facing a wide window onto a ringed planet, a moon, and stars.", flavors: ["zero-g"] },
  { slug: "freighter-night", title: "Rossum Factory, Night Shift", hook: "A coffee bulb, and a radio check every twenty minutes.", runtime: "2 hr", date: "Dec 6, 2026", image: "/assets/stills/atmosphere.png", flavors: ["zero-g"] },
];

export const docs = [
  { slug: "iron-beats-wood", title: "Iron Beats Wood: Rise of the Ironclad", hook: "March 1862, off Virginia. Cannon fire that wrecks wooden ships bounces off armor, and naval warfare changes in one afternoon.", runtime: "3 min", date: "Oct 4, 2026", image: "/assets/stills/iron-beats-wood.jpg", imageAlt: "IRON BEATS WOOD title over a paper diorama of two ironclads, the round-turret Monitor firing at the slope-sided Virginia across torn-newspaper waves.", flavors: ["nebula-miso"] as FlavorId[] },
  { slug: "the-archon-files", title: "The Archon Files", hook: "2031 to 2140, in declassified paper. Five documents, five eras, one question at the end of every chapter: who approved this?", runtime: "8 min", date: "Jan 8, 2027", image: "/assets/stills/docs.png", flavors: ["nebula-miso"] as FlavorId[] },
  { slug: "cities-of-2150", title: "Cities of 2150", hook: "Five rooftops. Facts labeled. Guesses labeled.", runtime: "12 min", date: "Coming soon", image: "/assets/heroes/cities-of-2150.png", imageAlt: "CITIES OF 2150 title over a daylight photo of a future river skyline with green towers, seen from a rooftop.", flavors: ["nebula-miso"] as FlavorId[] },
  { slug: "the-last-5-billion-years", title: "The Last 5 Billion Years", hook: "Earth's future, deadpan, one era at a time.", runtime: "9 min", date: "Dec 2026", image: "/assets/heroes/the-last-5-billion-years.png", imageAlt: "THE LAST 5 BILLION YEARS title over a black-and-cream linocut of a cracked dry shore under a huge red sun.", flavors: ["nebula-miso"] as FlavorId[] },
];

export const shorts = [
  { slug: "the-sky-broke", title: "The Sky Broke", hook: "3:10 p.m. A crack runs across the sky like a rock hit a windshield. Everybody stops and stares except Ms. Ruby, who has a corner to run.", runtime: "45 sec", date: "Nov 16, 2026", image: "/assets/heroes/the-sky-broke.png", imageAlt: "THE SKY BROKE title over an anime-style sunny street corner with a crosswalk, shade trees and a school-crossing sign.", flavors: ["quantum-fire"] as FlavorId[] },
  { slug: "ten-seconds", title: "10 Seconds to Impact", hook: "One cracked watch. He finishes the sandwich.", runtime: "30 sec", date: "Nov 30, 2026", image: "/assets/heroes/ten-seconds.png", imageAlt: "10 SECONDS TO IMPACT title over a city at dusk seen from a dark hillside, the sun low behind the hills.", flavors: ["quantum-fire"] as FlavorId[] },
  { slug: "one-tree", title: "One Tree, One Million Years", hook: "One camera. One white oak. One rope swing. A million years on, the last oak still carries the knot.", runtime: "50 sec", date: "Dec 23, 2026", image: "/assets/stills/atmosphere.png", flavors: ["quantum-fire"] as FlavorId[] },
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

// Direct links to videos that are live on the channel (checked Oct 29, 2026). Keys are the titles youtubeFor gets.
const liveVideos: Record<string, string> = {
  "T.I.R.A. // RIFT The Key Awakens": "https://www.youtube.com/watch?v=buCKa4pm0Rw",
  "Neo-Osaka Rain": "https://www.youtube.com/watch?v=G-YEM6LOE8Y",
  "The Stranger Part 1": "https://www.youtube.com/shorts/uu762gNCTXY",
  "The Stranger Part 2": "https://www.youtube.com/shorts/15IGDVeL080",
  "Iron Beats Wood: Rise of the Ironclad": "https://www.youtube.com/watch?v=sY7_WU6iOz0",
};

export function youtubeFor(title: string) {
  return liveVideos[title] ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(`SCI-FI NOODLES ${title}`)}`;
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
    kicker: "Next premiere · Nov 7, 2026",
    title: "Frankenstein: The Commit",
    logline: "1:00 a.m. The lab pushes to production and the whole team goes home. Mary Shelley's 1818 novel, retold as a problem we have now.",
    meta: ["Timewarp Shoyu", "5 min", "After Mary Shelley, 1818"],
    image: "/assets/heroes/the-commit.png",
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
    logline: "Memphis, 2099. Major Amara Kade is off duty at 06:43. Something under the bluff is waking up, and Dimension N wants it first.",
    meta: ["Original series", "8 episodes", "In production"],
    image: "/assets/heroes/tira-rift.png",
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
