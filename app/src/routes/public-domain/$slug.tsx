import { createFileRoute, notFound } from "@tanstack/react-router";

import { DetailHero, TitleNav } from "@/components/site/detail-hero";
import { Rail } from "@/components/site/rail";
import { NextShelf, SiteShell } from "@/components/site/site-frame";
import { classics, neighbours, sections, youtubeFor } from "@/content/catalog";

export const Route = createFileRoute("/public-domain/$slug")({
  loader: ({ params }) => {
    const project = classics.find((item) => item.slug === params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project.title ?? "Project"} | SCI-FI NOODLES` },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.project.hook} From ${loaderData.project.source} by ${loaderData.project.creator}, ${loaderData.project.published}.`
          : "",
      },
    ],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const index = classics.findIndex((item) => item.slug === project.slug);
  const { previous, next } = neighbours(classics, index);
  const sibling = (item?: (typeof classics)[number]) =>
    item ? { href: `/public-domain/${item.slug}`, title: item.title, image: item.image } : undefined;
  const related = [...classics.slice(index + 1), ...classics.slice(0, index)];

  return (
    <SiteShell className="detail-main">
      <DetailHero
        actions={
          <>
            <a className="cta-detail-watch" href={youtubeFor(project.title)} rel="noreferrer" target="_blank">
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M4 2.5v11l9-5.5z" />
              </svg>
              Watch
              <span className="sr-only">, {project.title}, on YouTube</span>
            </a>
            <a className="cta-detail-jump" href="#source">
              Source and rights
            </a>
          </>
        }
        image={project.image}
        imageAlt={project.imageAlt ?? ""}
        bowl="timewarp"
        kicker="02 // Timewarp Shoyu"
        logline={project.hook}
        meta={[`After ${project.creator}, ${project.published}`, project.runtime, `Premieres ${project.date}`]}
        title={project.title}
        trail={{ href: "/public-domain", label: "Public Domain" }}
      />

      <div className="detail-body">
        <section aria-labelledby="source" className="detail-section" data-reveal>
          <h2 id="source" tabIndex={-1}>
            Source and rights
          </h2>
          <dl className="source-card">
            <div>
              <dt>Source</dt>
              <dd>{project.source}</dd>
            </div>
            <div>
              <dt>Creator</dt>
              <dd>{project.creator}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{project.published}</dd>
            </div>
            <div>
              <dt>Premiere window</dt>
              <dd>
                {project.date} · {project.runtime}
              </dd>
            </div>
          </dl>
          <p className="rights-note">{project.rights}</p>
        </section>

        <TitleNav label="More from Timewarp Shoyu" next={sibling(next)} previous={sibling(previous)} />
      </div>

      <Rail
        items={related.map((item) => ({
          key: item.slug,
          href: `/public-domain/${item.slug}`,
          title: item.title,
          kicker: `${item.date} · after ${item.creator}`,
          hook: item.hook,
          image: item.image,
        }))}
        lede="The rest of the public-domain slate, in premiere order."
        seeAll={{ href: "/public-domain", label: "All classics" }}
        title="More from the slate"
      />

      <div className="detail-body">
        <NextShelf section={sections.find((item) => item.id === "lab")} />
      </div>
    </SiteShell>
  );
}
