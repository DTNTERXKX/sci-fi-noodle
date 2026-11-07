import { createFileRoute, notFound } from "@tanstack/react-router";

import { TitleNav } from "@/components/site/detail-hero";
import { SiteFrame } from "@/components/site/site-frame";
import { failedTakes, labEntries, neighbours, pillarBowl } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/lab/$slug")({
  loader: ({ params }) => {
    const entry = labEntries.find((item) => item.slug === params.slug);
    if (!entry) throw notFound();
    return { entry };
  },
  head: ({ loaderData, params }) =>
    seoHead({
      path: `/lab/${params.slug}`,
      title: `${loaderData?.entry.title ?? "Lab"} | SCI-FI NOODLES`,
      description: loaderData?.entry.paragraphs[0] ?? "",
      type: "article",
    }),
  component: LabEntryPage,
});

function LabEntryPage() {
  const { entry } = Route.useLoaderData();
  const { previous, next } = neighbours(
    labEntries,
    labEntries.findIndex((item) => item.slug === entry.slug),
  );
  const sibling = (item?: (typeof labEntries)[number]) =>
    item ? { href: `/lab/${item.slug}`, title: item.title, image: item.image } : undefined;
  return (
    <SiteFrame
      bowl={pillarBowl("lab")}
      after={<TitleNav label="More from Cyberpunk Fusion" next={sibling(next)} previous={sibling(previous)} />}
      crumb={{ href: "/lab", label: "The Lab" }}
      lede={entry.paragraphs[0]}
      title={entry.title}
    >
      <p className="meta-line page-block">
        {entry.category} · {entry.date}
      </p>
      <article className="lab-body">
        {entry.paragraphs.slice(1).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
      {entry.slug === "failed-noodles" ? (
        <ul className="failed-takes">
          {failedTakes.map((take) => (
            <li key={take.slug}>
              <video
                aria-label={`${take.title}, failed take from ${take.project}`}
                controls
                height={take.height}
                playsInline
                poster={`/assets/failed-noodles/${take.slug}.jpg`}
                preload="none"
                src={`/assets/failed-noodles/${take.slug}.mp4`}
                style={{ aspectRatio: `${take.width} / ${take.height}` }}
                width={take.width}
              />
              <p className="meta-line">{take.project}</p>
              <h2>{take.title}</h2>
              <p>{take.wrong}</p>
              <p className="failed-takes-legal">Made with AI · © 2026 NVESTED REALITY LLC. All rights reserved.</p>
            </li>
          ))}
        </ul>
      ) : null}
    </SiteFrame>
  );
}
