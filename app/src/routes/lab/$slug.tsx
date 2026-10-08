import { createFileRoute, notFound } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";
import { labEntries } from "@/content/catalog";

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
  return (
    <SiteFrame
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
