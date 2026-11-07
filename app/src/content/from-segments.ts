import { copyStrings, loadSiteSegments, type SiteFile, type SiteSegment } from "./site-file";
import type {
  Atmosphere,
  Bowl,
  BowlId,
  Classic,
  DocEntry,
  Feature,
  FlavorId,
  LabEntry,
  PillarId,
  Section,
  ShortEntry,
  Studio,
  StudioSocial,
  Universe,
} from "./catalog";

const BOWL_IDS: BowlId[] = ["black-hole", "timewarp", "quantum-fire", "nebula-miso", "zero-g", "cyberpunk"];
const PILLARS: PillarId[] = ["originals", "public-domain", "lab"];
const FLAVORS: FlavorId[] = ["quantum-fire", "nebula-miso", "zero-g"];

const SOCIAL_IDS: Record<string, string> = {
  higgsfield: "higgsfield",
  "higgsfield affiliate": "higgsfield-affiliate",
  tiktok: "tiktok",
  x: "x",
  instagram: "instagram",
  youtube: "youtube",
  facebook: "facebook",
};

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

function bowlId(value: string): BowlId | undefined {
  return BOWL_IDS.find((id) => id === value);
}

function pillarId(value: string): PillarId | undefined {
  return PILLARS.find((id) => id === value);
}

function flavorId(value: string): FlavorId | undefined {
  return FLAVORS.find((id) => id === value);
}

function flavorsOf(locked: Record<string, unknown>): FlavorId[] {
  const raw = locked.flavors;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const flavor = flavorId(str(item));
    return flavor ? [flavor] : [];
  });
}

function imageOf(segment: SiteSegment, fallback = "") {
  return str(segment.copy.image) || str(segment.locked.image) || fallback;
}

function altOf(segment: SiteSegment) {
  const alt = str(segment.copy.imageAlt);
  return alt || undefined;
}

function socialId(label: string) {
  const key = label.trim().toLowerCase();
  return SOCIAL_IDS[key] ?? (key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "social");
}

/** A direct YouTube watch or Shorts URL. Search links and channel links are not watch URLs. */
export function realWatchHref(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be" && url.pathname.length > 1) return value;
    if (host !== "youtube.com") return undefined;
    if (url.pathname === "/watch" && url.searchParams.get("v")) return value;
    const short = /^\/shorts\/([^/]+)/.exec(url.pathname);
    if (short?.[1]) return value;
  } catch {
    return undefined;
  }
  return undefined;
}

function segmentWatch(segment: SiteSegment) {
  return realWatchHref(segment.locked.watchHref) ?? realWatchHref(segment.copy.watchHref);
}

/** Real watch URL stored on a segment, keyed the way youtubeFor is called. */
export function explicitWatchTitle(title: string): string | undefined {
  const file = loadSiteSegments();
  for (const segment of file.segments) {
    const href = segmentWatch(segment);
    if (!href) continue;
    const own = str(segment.copy.title);
    if (own === title) return href;
    if (segment.kind !== "episode") continue;
    const seriesSlug = str(segment.locked.series);
    const parent = file.segments.find(
      (item) =>
        (item.kind === "series" || item.kind === "classic") && str(item.locked.slug) === seriesSlug,
    );
    const parentTitle = parent ? str(parent.copy.title) : "";
    if (!parentTitle) continue;
    if (`${parentTitle} ${own}` === title || `${parentTitle}: ${own}` === title) return href;
  }
  return undefined;
}

function episodesFor(file: SiteFile, seriesSlug: string) {
  return file.segments
    .filter((segment) => segment.kind === "episode" && str(segment.locked.series) === seriesSlug)
    .map((segment) => ({
      slug: str(segment.locked.slug),
      title: str(segment.copy.title),
      hook: str(segment.copy.description),
      runtime: str(segment.copy.runtime),
      date: str(segment.copy.releaseDate),
      image: str(segment.copy.image) || undefined,
      imageAlt: str(segment.copy.imageAlt) || undefined,
    }));
}

function releaseFor(file: SiteFile, slug: string) {
  const classic = file.segments.find((segment) => segment.kind === "classic" && str(segment.locked.slug) === slug);
  if (classic && str(classic.copy.releaseDate)) return str(classic.copy.releaseDate);
  const ambience = file.segments.find((segment) => segment.kind === "ambience" && str(segment.locked.slug) === slug);
  if (ambience && str(ambience.copy.releaseDate)) return str(ambience.copy.releaseDate);
  const episode = file.segments.find(
    (segment) => segment.kind === "episode" && str(segment.locked.series) === slug && str(segment.copy.releaseDate),
  );
  if (episode) return str(episode.copy.releaseDate);
  return "Coming soon";
}

function featureWatch(segment: SiteSegment, file: SiteFile, youtubeFor: (title: string) => string) {
  const explicit = realWatchHref(segment.locked.watchHref);
  if (explicit) return explicit;
  const slug = str(segment.locked.slug);
  const title = str(segment.copy.title);
  const series = file.segments.find((item) => item.kind === "series" && str(item.locked.slug) === slug);
  if (series) {
    const episode = file.segments.find((item) => item.kind === "episode" && str(item.locked.series) === slug);
    if (episode) return youtubeFor(`${str(series.copy.title)} ${str(episode.copy.title)}`);
  }
  return youtubeFor(title);
}

export type DerivedCatalog = {
  studio: Studio;
  studioSocials: StudioSocial[];
  bowls: Bowl[];
  universes: Universe[];
  classics: Classic[];
  atmospheres: Atmosphere[];
  docs: DocEntry[];
  shorts: ShortEntry[];
  labEntries: LabEntry[];
  features: Feature[];
  sections: Section[];
};

export function buildCatalog(youtubeFor: (title: string) => string): DerivedCatalog {
  const file = loadSiteSegments();
  const identity = file.segments.find((segment) => segment.id === "studio");
  const studio: Studio = {
    name: str(identity?.copy.name),
    line: str(identity?.copy.tagline),
    menu: str(identity?.copy.menu),
    signoff: str(identity?.copy.signoff),
    owner: str(identity?.copy.owner),
    youtube: str(identity?.locked.youtube),
  };

  const socialSource = Array.isArray(identity?.locked.socials) ? identity.locked.socials : [];
  const studioSocials: StudioSocial[] = socialSource.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const label = str((item as { label?: unknown }).label);
    const href = str((item as { href?: unknown }).href);
    if (!label || !href) return [];
    return [{ id: socialId(label), label, href }];
  });

  const bowls: Bowl[] = [];
  for (const segment of file.segments) {
    if (segment.kind !== "pillar" && segment.kind !== "flavor") continue;
    const id = bowlId(str(segment.locked.slug));
    if (!id) continue;
    const base = {
      id,
      number: str(segment.locked.number),
      name: str(segment.copy.name),
      short: str(segment.copy.shortName),
      category: str(segment.copy.header),
      navLabel: str(segment.copy.navLabel),
      tagline: str(segment.copy.subtitle),
      description: str(segment.copy.description),
      href: str(segment.locked.href),
    };
    if (segment.kind === "pillar") {
      const pillar = pillarId(str(segment.locked.pillar));
      if (!pillar) continue;
      bowls.push({ ...base, role: "pillar", pillar });
    } else {
      const flavor = flavorId(str(segment.locked.flavor));
      if (!flavor) continue;
      bowls.push({ ...base, role: "flavor", flavor });
    }
  }

  const universes: Universe[] = file.segments
    .filter((segment) => segment.kind === "series")
    .map((segment) => {
      const slug = str(segment.locked.slug);
      return {
        slug,
        title: str(segment.copy.title),
        logline: str(segment.copy.subtitle),
        premise: str(segment.copy.description),
        status: str(segment.copy.status),
        image: imageOf(segment),
        imageAlt: altOf(segment),
        flavors: flavorsOf(segment.locked),
        episodes: episodesFor(file, slug),
      };
    });

  const classics: Classic[] = file.segments
    .filter((segment) => segment.kind === "classic")
    .map((segment) => {
      const slug = str(segment.locked.slug);
      return {
        slug,
        title: str(segment.copy.title),
        hook: str(segment.copy.description),
        source: str(segment.locked.sourceWork),
        creator: str(segment.copy.creator),
        published: str(segment.locked.published),
        rights: str(segment.copy.rights),
        image: imageOf(segment),
        imageAlt: altOf(segment),
        runtime: str(segment.copy.runtime),
        date: str(segment.copy.releaseDate),
        flavors: flavorsOf(segment.locked),
        episodes: episodesFor(file, slug),
      };
    });

  const atmospheres: Atmosphere[] = file.segments
    .filter((segment) => segment.kind === "ambience")
    .map((segment) => ({
      slug: str(segment.locked.slug),
      title: str(segment.copy.title),
      hook: str(segment.copy.description),
      runtime: str(segment.copy.runtime),
      date: str(segment.copy.releaseDate),
      image: imageOf(segment),
      imageAlt: altOf(segment),
      place: str(segment.copy.place) || undefined,
      episode: str(segment.copy.episode) || undefined,
      featured: segment.locked.featured === true ? true : undefined,
      flavors: flavorsOf(segment.locked),
    }));

  const docs: DocEntry[] = file.segments
    .filter((segment) => segment.kind === "documentary")
    .map((segment) => ({
      slug: str(segment.locked.slug),
      title: str(segment.copy.title),
      hook: str(segment.copy.description),
      runtime: str(segment.copy.runtime),
      date: str(segment.copy.releaseDate),
      image: imageOf(segment),
      imageAlt: altOf(segment),
      flavors: flavorsOf(segment.locked),
    }));

  const shorts: ShortEntry[] = file.segments
    .filter((segment) => segment.kind === "short")
    .map((segment) => ({
      slug: str(segment.locked.slug),
      title: str(segment.copy.title),
      hook: str(segment.copy.description),
      runtime: str(segment.copy.runtime),
      date: str(segment.copy.releaseDate),
      image: imageOf(segment),
      imageAlt: altOf(segment),
      flavors: flavorsOf(segment.locked),
    }));

  const labEntries: LabEntry[] = file.segments
    .filter((segment) => segment.kind === "lab")
    .map((segment) => ({
      slug: str(segment.locked.slug),
      flavors: flavorsOf(segment.locked),
      title: str(segment.copy.title),
      category: str(segment.locked.category),
      date: str(segment.copy.releaseDate),
      image: imageOf(segment),
      imageAlt: altOf(segment),
      paragraphs: copyStrings(segment.copy, "paragraphs"),
    }));

  const features: Feature[] = file.segments.flatMap((segment) => {
    if (segment.kind !== "feature") return [];
    const bowl = bowlId(str(segment.locked.bowl));
    if (!bowl) return [];
    return [
      {
        slug: str(segment.locked.slug),
        bowl,
        kicker: str(segment.copy.kicker),
        title: str(segment.copy.title),
        logline: str(segment.copy.description),
        meta: copyStrings(segment.copy, "meta"),
        image: imageOf(segment),
        imageAlt: str(segment.copy.imageAlt),
        href: str(segment.locked.href),
        detailsLabel: str(segment.copy.detailsLabel),
        watchHref: featureWatch(segment, file, youtubeFor),
        date: releaseFor(file, str(segment.locked.slug)),
      },
    ];
  });

  const nav = file.segments.find((segment) => segment.id === "site.nav");
  const navItems = Array.isArray(nav?.copy.items) ? nav.copy.items : [];
  const sections: Section[] = navItems.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; label?: unknown; flavor?: unknown; promise?: unknown; href?: unknown };
    const href = str(row.href);
    if (!href) return [];
    const bowl = bowls.find((entry) => entry.href === href);
    const flavor = str(row.flavor);
    return [
      {
        id: str(row.id) || href,
        label: str(row.label),
        flavor: flavor || undefined,
        bowl: bowl?.id,
        href,
        promise: str(row.promise),
      },
    ];
  });

  return { studio, studioSocials, bowls, universes, classics, atmospheres, docs, shorts, labEntries, features, sections };
}
