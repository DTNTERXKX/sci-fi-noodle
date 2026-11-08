import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";
import { WatchBoard } from "@/components/site/watch-board";
import { isFlavorId, isPillarId, pageMeta, type FlavorId, type PillarId } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

type WatchSearch = { pillar?: PillarId; flavor?: FlavorId };

export const Route = createFileRoute("/watch")({
  validateSearch: (search: Record<string, unknown>): WatchSearch => ({
    pillar: isPillarId(search.pillar) ? search.pillar : undefined,
    flavor: isFlavorId(search.flavor) ? search.flavor : undefined,
  }),
  head: () => {
    const page = pageMeta("page.watch");
    return seoHead({ path: "/watch", title: page.title, description: page.description });
  },
  component: WatchPage,
});

function WatchPage() {
  const page = pageMeta("page.watch");
  const { pillar, flavor } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const update = (next: WatchSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true, resetScroll: false });

  return (
    <SiteFrame
      lede={page.subtitle}
      title={page.header}
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
