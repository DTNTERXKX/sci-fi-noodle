import { createFileRoute } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";
import { docs } from "@/content/catalog";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "Sci-Fi Docs | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Future technology, space, and speculative science, told as cinematic SCI-FI NOODLES documentaries.",
      },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <SiteFrame
      lede="Longer films about future technology, space, and the science hiding inside the fiction. Guesses are labeled as guesses."
      title="Sci-fi docs"
    >
      <ul className="doc-stack">
        {docs.map((item) => (
          <li key={item.slug}>
            <img alt="" src={item.image} />
            <div>
              <p className="meta-line">
                {item.runtime} · {item.date}
              </p>
              <h2>{item.title}</h2>
              <p>{item.hook}</p>
            </div>
          </li>
        ))}
      </ul>
    </SiteFrame>
  );
}
