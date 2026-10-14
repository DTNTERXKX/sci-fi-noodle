import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { FlavorLanding } from "@/components/site/flavor-landing";
import { bowlTitle, flavorBowl, isPillarId, type PillarId } from "@/content/catalog";

const bowl = flavorBowl("quantum-fire");

export const Route = createFileRoute("/shorts")({
  validateSearch: (search: Record<string, unknown>): { pillar?: PillarId } => ({
    pillar: isPillarId(search.pillar) ? search.pillar : undefined,
  }),
  head: () => ({
    meta: [
      { title: bowlTitle(bowl) },
      { name: "description", content: `${bowl.tagline} ${bowl.description}` },
    ],
  }),
  component: ShortsPage,
});

function ShortsPage() {
  const { pillar } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <FlavorLanding
      flavor="quantum-fire"
      lede="Micro-stories, twists, and standalone encounters. Something new before the kettle boils, from every pillar on the menu."
      onPillar={(value) => navigate({ search: { pillar: value }, replace: true, resetScroll: false })}
      pillar={pillar}
    />
  );
}
