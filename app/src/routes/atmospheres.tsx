import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { FlavorLanding } from "@/components/site/flavor-landing";
import { bowlTitle, flavorBowl, isPillarId, type PillarId } from "@/content/catalog";

const bowl = flavorBowl("zero-g");

export const Route = createFileRoute("/atmospheres")({
  validateSearch: (search: Record<string, unknown>): { pillar?: PillarId } => ({
    pillar: isPillarId(search.pillar) ? search.pillar : undefined,
  }),
  head: () => ({
    meta: [
      { title: bowlTitle(bowl) },
      { name: "description", content: `${bowl.tagline} ${bowl.description}` },
    ],
  }),
  component: AtmospheresPage,
});

function AtmospheresPage() {
  const { pillar } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <FlavorLanding
      flavor="zero-g"
      lede="Immersive rooms with almost no plot. Put the film on, leave the sound low, and stay. NEO OSAKA 2187 starts with EP01 // Rain on Glass."
      onPillar={(value) => navigate({ search: { pillar: value }, replace: true, resetScroll: false })}
      pillar={pillar}
    />
  );
}
