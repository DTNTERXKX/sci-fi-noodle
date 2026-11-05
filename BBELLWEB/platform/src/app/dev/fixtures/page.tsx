import barber from "@/fixtures/barber-salon.json";
import church from "@/fixtures/church.json";
import coach from "@/fixtures/coach-consultant.json";
import contractor from "@/fixtures/contractor.json";
import creator from "@/fixtures/creator-artist.json";
import restaurant from "@/fixtures/restaurant.json";
import type { SiteSpecV2 } from "@/lib/site-schema";
import { siteSpecV2Schema } from "@/lib/site-schema";
import { FixturePreviewGrid } from "./preview-grid";

const FIXTURES: { name: string; spec: SiteSpecV2 }[] = [
  { name: "Barber / salon", spec: siteSpecV2Schema.parse(barber) },
  { name: "Church", spec: siteSpecV2Schema.parse(church) },
  { name: "Contractor", spec: siteSpecV2Schema.parse(contractor) },
  { name: "Restaurant", spec: siteSpecV2Schema.parse(restaurant) },
  { name: "Coach / consultant", spec: siteSpecV2Schema.parse(coach) },
  { name: "Creator / artist", spec: siteSpecV2Schema.parse(creator) },
];

export default function FixturesDevPage() {
  return (
    <div className="min-h-screen bg-slate-200 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Phase 2 fixtures (375 / 1280)</h1>
      <FixturePreviewGrid fixtures={FIXTURES} />
    </div>
  );
}
