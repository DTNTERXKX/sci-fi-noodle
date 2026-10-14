import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EnterBracket } from "@/components/site/ctas";
import { FilterStatus, FlavorChips } from "@/components/site/flavor-filter";
import { SiteFrame } from "@/components/site/site-frame";
import { bowlTitle, flavorBowl, isFlavorId, labEntries, pillarBowl, type FlavorId } from "@/content/catalog";

const bowl = pillarBowl("lab");

export const Route = createFileRoute("/lab/")({
  validateSearch: (search: Record<string, unknown>): { flavor?: FlavorId } => ({
    flavor: isFlavorId(search.flavor) ? search.flavor : undefined,
  }),
  head: () => ({
    meta: [
      { title: bowlTitle(bowl) },
      { name: "description", content: `${bowl.tagline} ${bowl.description}` },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  const { flavor } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const visible = flavor ? labEntries.filter((entry) => entry.flavors.includes(flavor)) : labEntries;

  return (
    <SiteFrame
      bowl={bowl}
      lede="The bridge between the films and the making of them. Process, experiments, tools, and the rules that keep each series its own. Curious, not a manual."
      title={bowl.category}
    >
      <div className="pillar-board page-block">
        <FlavorChips
          active={flavor}
          items={labEntries}
          onSelect={(value) => navigate({ search: { flavor: value }, replace: true, resetScroll: false })}
        />
        <FilterStatus count={visible.length} flavor={flavor} pillar="lab" />
      </div>
      {visible.length === 0 ? (
        <p className="empty-shelf">No Lab notes in this flavor yet. Try another.</p>
      ) : (
        <ul className="lab-index">
          {visible.map((entry) => (
            <li key={entry.slug}>
              <img alt="" src={entry.image} />
              <div>
                <p className="meta-line">
                  {entry.category} · {entry.date}
                </p>
                <h2>{entry.title}</h2>
                <p>{entry.paragraphs[0]}</p>
                <ul aria-label="Flavors" className="bowl-badges">
                  {entry.flavors.map((id) => (
                    <li className="bowl-badge" data-bowl={flavorBowl(id).id} key={id}>
                      {flavorBowl(id).short}
                    </li>
                  ))}
                </ul>
                <EnterBracket href={`/lab/${entry.slug}`} title={entry.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SiteFrame>
  );
}
