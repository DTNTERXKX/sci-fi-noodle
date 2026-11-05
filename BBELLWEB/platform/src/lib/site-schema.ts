import { z } from "zod";

import { meetsWcagAaText } from "./contrast";
import { FONT_PAIR_IDS } from "./fonts";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const variantSchema = z.enum(["a", "b", "c"]);
const sectionBase = {
  id: z.string().min(1),
  variant: variantSchema,
};

// --- V1 (legacy) ---
export const siteSectionSchemaV1 = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    headline: z.string(),
    subhead: z.string(),
    cta: z.string(),
  }),
  z.object({
    type: z.literal("features"),
    items: z.array(z.object({ title: z.string(), description: z.string() })).min(2).max(6),
  }),
  z.object({
    type: z.literal("about"),
    title: z.string(),
    body: z.string(),
  }),
  z.object({
    type: z.literal("contact"),
    title: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
]);

export const generatedSiteSchemaV1 = z.object({
  siteName: z.string(),
  tagline: z.string(),
  primaryColor: hexColor,
  sections: z.array(siteSectionSchemaV1).min(3).max(8),
});

export type GeneratedSiteV1 = z.infer<typeof generatedSiteSchemaV1>;

/** @deprecated Use SiteSpecV2 — kept as alias for migration period */
export const siteSectionSchema = siteSectionSchemaV1;
export const generatedSiteSchema = generatedSiteSchemaV1;
export type GeneratedSite = GeneratedSiteV1;

// --- V2 ---
const paletteSchema = z
  .object({
    primary: hexColor,
    accent: hexColor,
    bg: hexColor,
    text: hexColor,
  })
  .refine((p) => meetsWcagAaText(p.text, p.bg), {
    message: "Text and background must meet WCAG AA contrast (4.5:1).",
  });

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    ...sectionBase,
    type: z.literal("hero"),
    headline: z.string(),
    subhead: z.string(),
    cta: z.string(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("features"),
    title: z.string().optional(),
    items: z.array(z.object({ title: z.string(), description: z.string() })).min(2).max(8),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("services"),
    title: z.string(),
    items: z.array(
      z.object({ name: z.string(), blurb: z.string(), price: z.string().optional() }),
    ).min(1).max(12),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("about"),
    title: z.string(),
    body: z.string(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("gallery"),
    title: z.string(),
    images: z.array(z.object({ url: z.string(), alt: z.string() })).max(12),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("testimonials"),
    title: z.string(),
    items: z
      .array(z.object({ quote: z.string(), name: z.string(), role: z.string().optional() }))
      .max(6),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("pricing"),
    title: z.string(),
    items: z.array(z.object({ name: z.string(), price: z.string(), details: z.string() })).min(1).max(6),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("faq"),
    title: z.string(),
    items: z.array(z.object({ q: z.string(), a: z.string() })).min(1).max(12),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("hours"),
    title: z.string(),
    address: z.string(),
    days: z.array(z.object({ label: z.string(), hours: z.string() })).min(1).max(7),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("contact"),
    title: z.string(),
    formEnabled: z.boolean(),
    email: z.string(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("cta"),
    headline: z.string(),
    subhead: z.string().optional(),
    button: z.string(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("team"),
    title: z.string(),
    members: z.array(z.object({ name: z.string(), role: z.string(), bio: z.string().optional() })).max(8),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("logos"),
    title: z.string().optional(),
    logos: z.array(z.object({ name: z.string(), url: z.string().optional() })).max(12),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("menu"),
    title: z.string(),
    categories: z.array(
      z.object({
        name: z.string(),
        items: z.array(z.object({ name: z.string(), description: z.string().optional(), price: z.string() })),
      }),
    ),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("events"),
    title: z.string(),
    items: z.array(z.object({ date: z.string(), title: z.string(), description: z.string().optional() })),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("beforeAfter"),
    title: z.string(),
    pairs: z.array(z.object({ beforeUrl: z.string(), afterUrl: z.string(), caption: z.string().optional() })),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("blogList"),
    title: z.string(),
    posts: z.array(z.object({ title: z.string(), excerpt: z.string(), date: z.string().optional() })),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("announcement"),
    message: z.string(),
    linkLabel: z.string().optional(),
    linkUrl: z.string().optional(),
  }),
]);

export const pageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  sections: z.array(sectionSchema).min(1).max(12),
});

export const siteSpecV2Schema = z
  .object({
    version: z.literal(2),
    brand: z.object({
      name: z.string(),
      tagline: z.string(),
      palette: paletteSchema,
      fontPair: z.enum(FONT_PAIR_IDS),
      tone: z.enum(["friendly", "premium", "bold", "faith"]),
      logoUrl: z.string().url().optional(),
    }),
    seo: z.object({
      title: z.string(),
      description: z.string(),
      city: z.string().optional(),
      businessType: z.string().optional(),
    }),
    pages: z.array(pageSchema).min(1).max(10),
  })
  .refine((spec) => spec.pages.some((p) => p.slug === "/"), {
    message: 'At least one page must use slug "/".',
  });

export type SiteSpecV2 = z.infer<typeof siteSpecV2Schema>;
export type SiteSection = z.infer<typeof sectionSchema>;
export type SitePageSpec = z.infer<typeof pageSchema>;
export type SiteBrand = SiteSpecV2["brand"];

export function isSiteSpecV2(spec: unknown): spec is SiteSpecV2 {
  return siteSpecV2Schema.safeParse(spec).success;
}

export function migrateV1toV2(v1: GeneratedSiteV1): SiteSpecV2 {
  const text = "#0f172a";
  const bg = "#ffffff";
  const primary = v1.primaryColor;
  const accent = v1.primaryColor;

  const sections: SiteSection[] = v1.sections.map((section, index) => {
    const base = { id: `s-${index + 1}`, variant: "a" as const };
    if (section.type === "hero") {
      return { ...base, type: "hero", headline: section.headline, subhead: section.subhead, cta: section.cta };
    }
    if (section.type === "features") {
      return { ...base, type: "features", items: section.items };
    }
    if (section.type === "about") {
      return { ...base, type: "about", title: section.title, body: section.body };
    }
    return {
      ...base,
      type: "contact",
      title: section.title,
      formEnabled: true,
      email: section.email,
      phone: section.phone,
    };
  });

  return {
    version: 2,
    brand: {
      name: v1.siteName,
      tagline: v1.tagline,
      palette: { primary, accent, bg, text },
      fontPair: "dm-fraunces",
      tone: "friendly",
    },
    seo: {
      title: v1.siteName,
      description: v1.tagline,
    },
    pages: [{ slug: "/", title: "Home", sections }],
  };
}

export function normalizeSiteSpec(spec: GeneratedSiteV1 | SiteSpecV2): SiteSpecV2 {
  if (isSiteSpecV2(spec)) return spec;
  return migrateV1toV2(spec);
}
