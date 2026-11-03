import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { FlavorLanding } from "@/components/site/flavor-landing";
import { isPillarId, pageMeta, type PillarId } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/shorts")({
  validateSearch: (search: Record<string, unknown>): { pillar?: PillarId } => ({
    pillar: isPillarId(search.pillar) ? search.pillar : undefined,
  }),
  head: () => {
    const page = pageMeta("page.shorts");
    return seoHead({ path: "/shorts", title: page.title, description: page.description || page.subtitle });
  },
  component: ShortsPage,
});

function ShortsPage() {
  const page = pageMeta("page.shorts");
  const { pillar } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <FlavorLanding
      flavor="quantum-fire"
      lede={page.subtitle}
      title={page.header}
      onPillar={(value) => navigate({ search: { pillar: value }, replace: true, resetScroll: false })}
      pillar={pillar}
    />
  );
}
