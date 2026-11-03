import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { FlavorLanding } from "@/components/site/flavor-landing";
import { isPillarId, pageMeta, type PillarId } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/atmospheres")({
  validateSearch: (search: Record<string, unknown>): { pillar?: PillarId } => ({
    pillar: isPillarId(search.pillar) ? search.pillar : undefined,
  }),
  head: () => {
    const page = pageMeta("page.atmospheres");
    return seoHead({ path: "/atmospheres", title: page.title, description: page.description || page.subtitle });
  },
  component: AtmospheresPage,
});

function AtmospheresPage() {
  const page = pageMeta("page.atmospheres");
  const { pillar } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <FlavorLanding
      flavor="zero-g"
      lede={page.subtitle}
      title={page.header}
      onPillar={(value) => navigate({ search: { pillar: value }, replace: true, resetScroll: false })}
      pillar={pillar}
    />
  );
}
