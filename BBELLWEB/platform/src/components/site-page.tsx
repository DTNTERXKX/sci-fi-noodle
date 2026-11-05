import type { SitePageSpec, SiteSpecV2 } from "@/lib/site-schema";

import { brandStyleVars, headingFont } from "./sections/brand-vars";
import { SectionRenderer } from "./sections/section-renderer";

export function SitePage({
  spec,
  page,
  onNavigate,
}: {
  spec: SiteSpecV2;
  page: SitePageSpec;
  onNavigate?: (slug: string) => void;
}) {
  const { brand } = spec;

  return (
    <div className="min-w-0 overflow-x-hidden" style={brandStyleVars(brand)}>
      <header className="border-b px-4 py-4 sm:px-6" style={{ borderColor: `${brand.palette.text}18` }}>
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold" style={headingFont(brand)}>
              {brand.name}
            </p>
            <p className="truncate text-sm opacity-75">{brand.tagline}</p>
          </div>
          {spec.pages.length > 1 ? (
            <nav className="flex flex-wrap gap-2 text-sm">
              {spec.pages.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => onNavigate?.(p.slug)}
                  className="rounded-full px-3 py-1 font-medium"
                  style={{
                    backgroundColor: p.slug === page.slug ? brand.palette.primary : "transparent",
                    color: p.slug === page.slug ? "#fff" : brand.palette.text,
                  }}
                >
                  {p.title}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl min-w-0">
        {page.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} brand={brand} />
        ))}
      </main>
      <footer className="mt-8 border-t px-4 py-6 text-center text-sm opacity-75 sm:px-6" style={{ borderColor: `${brand.palette.text}18` }}>
        © {new Date().getFullYear()} {brand.name}
        {spec.seo.city ? ` · ${spec.seo.city}` : ""}
      </footer>
    </div>
  );
}
