import type { SiteBrand, SiteSection } from "@/lib/site-schema";

import { headingFont, sectionPad } from "./brand-vars";

type BlogListSection = Extract<SiteSection, { type: "blogList" }>;

export function BlogListSectionView({ section, brand }: { section: BlogListSection; brand: SiteBrand }) {
  return (
    <section className={sectionPad(section.variant)}>
      <h2 className="text-2xl font-semibold" style={headingFont(brand)}>{section.title}</h2>
      <ul className="mt-6 space-y-4">
        {section.posts.map((post) => (
          <li key={post.title} className="border-b pb-4" style={{ borderColor: `${brand.palette.text}15` }}>
            <h3 className="font-semibold">{post.title}</h3>
            {post.date ? <p className="text-xs opacity-60">{post.date}</p> : null}
            <p className="mt-1 text-sm opacity-85">{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
