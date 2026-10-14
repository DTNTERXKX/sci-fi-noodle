import { createFileRoute, notFound } from "@tanstack/react-router";

import { TitleNav } from "@/components/site/detail-hero";
import { SiteFrame } from "@/components/site/site-frame";
import { labEntries, neighbours, pillarBowl } from "@/content/catalog";

export const Route = createFileRoute("/lab/$slug")({
  loader: ({ params }) => {
    const entry = labEntries.find((item) => item.slug === params.slug);
    if (!entry) throw notFound();
    return { entry };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.entry.title ?? "Lab"} | SCI-FI NOODLES` },
      { name: "description", content: loaderData?.entry.paragraphs[0] ?? "" },
    ],
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
    </SiteFrame>
  );
}
