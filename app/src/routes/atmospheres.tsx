import { createFileRoute } from "@tanstack/react-router";

import { WatchMark } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { atmospheres, youtubeFor } from "@/content/catalog";

export const Route = createFileRoute("/atmospheres")({
  head: () => ({
    meta: [
      { title: "Atmospheres | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Long sci-fi atmospheres from SCI-FI NOODLES: ship bays, rain, night shifts, and rooms you can stay in.",
      },
    ],
  }),
  component: AtmospheresPage,
});

function AtmospheresPage() {
  return (
    <SiteFrame
      lede="Immersive rooms with almost no plot. Put the film on, leave the sound low, and stay."
      title="Atmospheres"
    >
      <ul className="air-grid">
        {atmospheres.map((item) => (
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
