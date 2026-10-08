import { createFileRoute, notFound } from "@tanstack/react-router";

import { WatchMark } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { universes, youtubeFor } from "@/content/catalog";

export const Route = createFileRoute("/originals/$slug")({
  loader: ({ params }) => {
    const universe = universes.find((item) => item.slug === params.slug);
    if (!universe) throw notFound();
    return { universe };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.universe.title ?? "Universe"} | SCI-FI NOODLES` },
      { name: "description", content: loaderData?.universe.premise ?? "" },
    ],
  }),
  component: UniversePage,
});

function UniversePage() {
  const { universe } = Route.useLoaderData();
  return (
    <SiteFrame
      crumb={{ href: "/originals", label: "Originals" }}
      lede={universe.premise}
      title={universe.title}
    >
      <figure className="hero-still">
        <img alt="" src={universe.image} />
      </figure>
      <p className="meta-line page-block">{universe.status}</p>
      <p className="lead-line">{universe.logline}</p>
      <ol className="episode-list">
        {universe.episodes.map((episode) => (
          <li key={episode.slug}>
            <div>
              <p className="meta-line">
                {episode.date} · {episode.runtime}
              </p>
              <h2>{episode.title}</h2>
              <p>{episode.hook}</p>
            </div>
            <WatchMark href={youtubeFor(`${universe.title} ${episode.title}`)} />
          </li>
        ))}
      </ol>
      <p className="rights-note">
        This page is the public door. Canon, continuity, and production locks stay inside the series.
      </p>
    </SiteFrame>
  );
}
