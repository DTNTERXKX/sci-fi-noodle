import { createFileRoute } from "@tanstack/react-router";

import { WatchMark } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { shorts, youtubeFor } from "@/content/catalog";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Micro-stories and experiments from SCI-FI NOODLES, cut to land in under a minute.",
      },
    ],
  }),
  component: ShortsPage,
});

function ShortsPage() {
  return (
    <SiteFrame
      lede="Micro-stories, teasers, and experiments. Something new before the kettle boils."
      title="Shorts"
    >
      <ul className="short-row">
        {shorts.map((item) => (
          <li key={item.slug}>
            <img alt="" src={item.image} />
            <h2>{item.title}</h2>
            <p>{item.hook}</p>
            <p className="meta-line">
              {item.runtime} · {item.date}
            </p>
            <WatchMark href={youtubeFor(item.title)} />
          </li>
        ))}
      </ul>
    </SiteFrame>
  );
}
