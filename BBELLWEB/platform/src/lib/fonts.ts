export const FONT_PAIR_IDS = [
  "dm-fraunces",
  "inter-playfair",
  "lato-merriweather",
  "montserrat-lora",
  "raleway-libre",
  "source-sans-eb-garamond",
  "work-sans-crimson",
  "nunito-bitter",
] as const;

export type FontPairId = (typeof FONT_PAIR_IDS)[number];

export type FontPair = {
  id: FontPairId;
  label: string;
  heading: string;
  body: string;
};

export const FONT_PAIRS: FontPair[] = [
  { id: "dm-fraunces", label: "DM Sans + Fraunces", heading: "Fraunces, serif", body: "DM Sans, sans-serif" },
  { id: "inter-playfair", label: "Inter + Playfair", heading: "Playfair Display, serif", body: "Inter, sans-serif" },
  { id: "lato-merriweather", label: "Lato + Merriweather", heading: "Merriweather, serif", body: "Lato, sans-serif" },
  { id: "montserrat-lora", label: "Montserrat + Lora", heading: "Lora, serif", body: "Montserrat, sans-serif" },
  { id: "raleway-libre", label: "Raleway + Libre Baskerville", heading: "Libre Baskerville, serif", body: "Raleway, sans-serif" },
  {
    id: "source-sans-eb-garamond",
    label: "Source Sans + EB Garamond",
    heading: "EB Garamond, serif",
    body: "Source Sans 3, sans-serif",
  },
  { id: "work-sans-crimson", label: "Work Sans + Crimson", heading: "Crimson Pro, serif", body: "Work Sans, sans-serif" },
  { id: "nunito-bitter", label: "Nunito + Bitter", heading: "Bitter, serif", body: "Nunito, sans-serif" },
];

export function fontPairStyles(id: FontPairId): { headingFont: string; bodyFont: string } {
  const pair = FONT_PAIRS.find((p) => p.id === id) ?? FONT_PAIRS[0]!;
  return { headingFont: pair.heading, bodyFont: pair.body };
}
