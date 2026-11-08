// Per-page SEO tags. Canonical, og:url and og:image are absolute on the
// production domain so previews and mirrors never compete with it in search.
export const SITE_URL = "https://www.scifinoodles.com";
export const SITE_NAME = "SCI-FI NOODLES";
export const DEFAULT_OG_IMAGE = "/brand/og.png";
export const BROWSER_THEME_COLOR = "#0a0a0f";

export const SOCIAL_PROFILES = [
  "https://www.youtube.com/@SCIFINOODLES",
  "https://x.com/scifinoodles",
  "https://www.instagram.com/scifinoodles2026/",
  "https://www.tiktok.com/@scifinoodles5289",
  "https://www.facebook.com/61595575268577",
];

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type SeoInput = {
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "video.other" | "article";
};

export function seoHead({ path, title, description, image, type = "website" }: SeoInput) {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: type },
      { property: "og:image", content: ogImage },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
