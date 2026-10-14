import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { FlavorLanding } from "@/components/site/flavor-landing";
import { bowlTitle, flavorBowl, isPillarId, type PillarId } from "@/content/catalog";

const bowl = flavorBowl("nebula-miso");

export const Route = createFileRoute("/docs/")({
  validateSearch: (search: Record<string, unknown>): { pillar?: PillarId } => ({
    pillar: isPillarId(search.pillar) ? search.pillar : undefined,
  }),
  head: () => ({
    meta: [
      { title: bowlTitle(bowl) },
      { name: "description", content: `${bowl.tagline} ${bowl.description}` },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  const { pillar } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <FlavorLanding
      flavor="nebula-miso"
      lede="Documentaries and lore about future technology, space, and the science hiding inside the fiction. Guesses are labeled as guesses."
      onPillar={(value) => navigate({ search: { pillar: value }, replace: true, resetScroll: false })}
      pillar={pillar}
    />
  );
}
