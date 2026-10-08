import { createFileRoute } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";
import { WatchBoard } from "@/components/site/watch-board";

export const Route = createFileRoute("/watch")({
  head: () => ({
    meta: [
      { title: "Watch | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Find a SCI-FI NOODLES film, doc, atmosphere, short, or lab note without learning the studio org chart.",
      },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  return (
    <SiteFrame
      lede="Search the shelves, then watch on YouTube. Discussion stays there too."
      title="Watch"
    >
      <WatchBoard />
    </SiteFrame>
  );
}
