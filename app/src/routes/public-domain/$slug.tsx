import { createFileRoute, notFound } from "@tanstack/react-router";

import { WatchMark } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { classics, youtubeFor } from "@/content/catalog";

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
  const related = classics.filter((item) => item.slug !== project.slug).slice(0, 3);
  return (
    <SiteFrame
      crumb={{ href: "/public-domain", label: "Public Domain" }}
      lede={project.hook}
      title={project.title}
    >
      <figure className="hero-still">
        <img alt="" src={project.image} />
      </figure>
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
      <WatchMark href={youtubeFor(project.title)} />
      <h2 className="subhead">More from the slate</h2>
      <ul className="related-list">
        {related.map((item) => (
          <li key={item.slug}>
            <a href={`/public-domain/${item.slug}`}>{item.title}</a>
            <span>{item.hook}</span>
          </li>
        ))}
      </ul>
    </SiteFrame>
  );
}
