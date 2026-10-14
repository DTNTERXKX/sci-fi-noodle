import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";
import { WatchBoard } from "@/components/site/watch-board";
import { isFlavorId, isPillarId, type FlavorId, type PillarId } from "@/content/catalog";

type WatchSearch = { pillar?: PillarId; flavor?: FlavorId };

export const Route = createFileRoute("/watch")({
  validateSearch: (search: Record<string, unknown>): WatchSearch => ({
    pillar: isPillarId(search.pillar) ? search.pillar : undefined,
    flavor: isFlavorId(search.flavor) ? search.flavor : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Watch // The Whole Menu | SCI-FI NOODLES" },
      {
        name: "description",
        content:
          "Every SCI-FI NOODLES film on one board. Filter by pillar, where it comes from, or by flavor, how it feels. Different Flavors. Infinite Universes.",
      },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { pillar, flavor } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const update = (next: WatchSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true, resetScroll: false });

  return (
    <SiteFrame
      lede="The whole Cosmic Ramen menu on one board. Pick a pillar for where a film comes from, a flavor for how it feels, or both. Then watch on YouTube."
      title="Watch"
    >
      <WatchBoard
        flavor={flavor}
        onFlavor={(value) => update({ flavor: value })}
        onPillar={(value) => update({ pillar: value })}
        pillar={pillar}
      />
    </SiteFrame>
  );
}
