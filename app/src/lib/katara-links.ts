import {
  bowls,
  classics,
  isFlavorId,
  isPillarId,
  labEntries,
  sections,
  universes,
  watchLibrary,
  type FlavorId,
  type PillarId,
} from "@/content/catalog";

/** Katara's only link syntax: markdown `[Title](/path)` with a site-relative path. */
export const KATARA_LINK = /\[([^[\]\n]{1,80})\]\(([^()\s]{1,120})\)/g;

const knownPaths = new Set<string>([
  "/",
  ...bowls.map((bowl) => bowl.href),
  ...sections.map((section) => section.href),
  ...universes.map((item) => `/originals/${item.slug}`),
  ...classics.map((item) => `/public-domain/${item.slug}`),
  ...labEntries.map((item) => `/lab/${item.slug}`),
  ...watchLibrary().map((item) => item.href.split(/[?#]/)[0]),
]);

export type KataraTarget = {
  pathname: string;
  search: { flavor?: FlavorId; pillar?: PillarId };
};

/** Resolves a link from Katara to a known route. Anything else (other origins, unknown paths, extra params) is refused. */
export function kataraTarget(href: string): KataraTarget | null {
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("#") || href.includes("\\")) return null;
  const [rawPath, query = "", ...extra] = href.split("?");
  if (extra.length > 0) return null;
  const pathname = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;
  if (!knownPaths.has(pathname)) return null;
  const search: KataraTarget["search"] = {};
  for (const [key, value] of new URLSearchParams(query)) {
    if (key === "flavor" && isFlavorId(value)) search.flavor = value;
    else if (key === "pillar" && isPillarId(value)) search.pillar = value;
    else return null;
  }
  return { pathname, search };
}

/** Replaces finished links with their titles. Used on the speech stream, so it never trims. */
export function unlinkForSpeech(text: string) {
  return text.replace(KATARA_LINK, "$1");
}

/** Holds back a link that is still streaming in, so speech never reads half of one. */
export function splitAtOpenLink(raw: string) {
  let settled = 0;
  for (const match of raw.matchAll(KATARA_LINK)) settled = (match.index ?? 0) + match[0].length;
  const open = raw.indexOf("[", settled);
  if (open < 0 || raw.length - open > 220) return { ready: raw, held: "" };
  return { ready: raw.slice(0, open), held: raw.slice(open) };
}

/** One sentence as it should sound: titles instead of links, no URLs, no markup, "//" spoken as a pause. */
export function speakableText(text: string) {
  return unlinkForSpeech(text)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\(\/[^()\s]*\)/g, "")
    .replace(/\s*\/\/\s*/g, ", ")
    .replace(/[*_`#[\]]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
