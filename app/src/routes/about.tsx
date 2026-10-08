import { createFileRoute } from "@tanstack/react-router";

import { SignalLink } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { studio } from "@/content/catalog";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | SCI-FI NOODLES" },
      {
        name: "description",
        content: "SCI-FI NOODLES is the YouTube studio of NVESTED REALITY LLC. Science fiction is the product. AI is the stove.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteFrame
      lede="An independent science-fiction studio that noodles with ideas until one of them becomes a world."
      title="About the studio"
    >
      <div className="about-grid">
        <img alt="SCI-FI NOODLES mark, a cosmic bowl of noodles" src="/brand/logo.jpg" />
        <div>
          <p>
            SCI-FI NOODLES is the YouTube channel of {studio.owner}. Science fiction is
            the product. AI is the stove. The films are original worlds, public-domain
            classics retold as modern problems, future-tech documentaries, long
            atmospheres, and short experiments.
          </p>
          <p>
            YouTube is where the films play. This site is the studio door: a map of
            the shelves, a premiere board, and a way to hear about the next drop
            without living inside an algorithm.
          </p>
          <p>{studio.signoff}</p>
          <SignalLink href="/contact">Press and partnerships</SignalLink>
        </div>
      </div>
    </SiteFrame>
  );
}
