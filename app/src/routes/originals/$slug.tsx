import { createFileRoute, notFound } from "@tanstack/react-router";

import { WatchMark } from "@/components/site/ctas";
import { DetailHero, TitleNav } from "@/components/site/detail-hero";
import { Rail } from "@/components/site/rail";
import { NextShelf, SiteShell } from "@/components/site/site-frame";
import { cardBowl, classics, neighbours, sections, universes, youtubeFor } from "@/content/catalog";

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
  const index = universes.findIndex((item) => item.slug === universe.slug);
  const { previous, next } = neighbours(universes, index);
  const sibling = (item?: (typeof universes)[number]) =>
    item ? { href: `/originals/${item.slug}`, title: item.title, image: item.image } : undefined;
  const firstEpisode = universe.episodes[0];

  return (
    <SiteShell className="detail-main">
      <DetailHero
        actions={
          <>
            <a
              className="cta-detail-watch"
              href={youtubeFor(`${universe.title} ${firstEpisode.title}`)}
              rel="noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M4 2.5v11l9-5.5z" />
              </svg>
              Watch episode 1
              <span className="sr-only">, {firstEpisode.title}, on YouTube</span>
            </a>
            <a className="cta-detail-jump" href="#episodes">
              All {universe.episodes.length} episodes
            </a>
          </>
        }
        image={universe.image}
        imageAlt={universe.imageAlt ?? ""}
        bowl="black-hole"
        kicker="01 // Black Hole Tonkotsu"
        logline={universe.logline}
        meta={["Original Universes", `${universe.episodes.length} episodes`, universe.status]}
        title={universe.title}
        trail={{ href: "/originals", label: "Original Universes" }}
      />

      <div className="detail-body" data-bowl="black-hole">
        <p className="lead-line" data-reveal>
          {universe.premise}
        </p>

        <section aria-labelledby="episodes" className="detail-section" data-reveal>
          <h2 id="episodes" tabIndex={-1}>
            Episodes
          </h2>
          <ol className="episode-list">
            {universe.episodes.map((episode, number) => (
              <li key={episode.slug}>
                <span className="episode-number">{String(number + 1).padStart(2, "0")}</span>
                <div>
                  <p className="meta-line">
                    {episode.date} · {episode.runtime}
                  </p>
                  <h3>{episode.title}</h3>
                  <p>{episode.hook}</p>
                </div>
                <WatchMark href={youtubeFor(`${universe.title} ${episode.title}`)} title={episode.title} />
              </li>
            ))}
          </ol>
          <p className="rights-note">
            This page is the public door. Canon, continuity, and production locks stay inside the series.
          </p>
        </section>

        <TitleNav label="More original universes" next={sibling(next)} previous={sibling(previous)} />
      </div>

      <Rail
        items={classics.slice(0, 6).map((item) => ({
          key: item.slug,
          href: `/public-domain/${item.slug}`,
          title: item.title,
          kicker: `Timewarp Shoyu · after ${item.creator}`,
          hook: item.hook,
          image: item.image,
          bowl: cardBowl(item.flavors, "public-domain"),
        }))}
        lede="Different worlds, same kitchen."
        seeAll={{ href: "/public-domain", label: "All Public Domain" }}
        title="Also on the menu"
      />

      <div className="detail-body">
        <NextShelf section={sections.find((item) => item.id === "public-domain")} />
      </div>
    </SiteShell>
  );
}
