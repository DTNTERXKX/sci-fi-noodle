import type { CSSProperties } from "react";

import type { SiteBrand } from "@/lib/site-schema";
import { fontPairStyles } from "@/lib/fonts";

export function brandStyleVars(brand: SiteBrand): CSSProperties {
  const fonts = fontPairStyles(brand.fontPair);
  return {
    ["--site-primary" as string]: brand.palette.primary,
    ["--site-accent" as string]: brand.palette.accent,
    ["--site-bg" as string]: brand.palette.bg,
    ["--site-text" as string]: brand.palette.text,
    fontFamily: fonts.bodyFont,
    backgroundColor: brand.palette.bg,
    color: brand.palette.text,
  };
}

export function headingFont(brand: SiteBrand): CSSProperties {
  return { fontFamily: fontPairStyles(brand.fontPair).headingFont };
}

export function sectionPad(variant: "a" | "b" | "c"): string {
  if (variant === "b") return "px-4 py-10 sm:px-8 sm:py-14";
  if (variant === "c") return "px-6 py-12 sm:px-10 sm:py-16";
  return "px-5 py-8 sm:px-6 sm:py-10";
}
