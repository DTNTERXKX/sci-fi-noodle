import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EnterBracket } from "@/components/site/ctas";
import { FilterStatus, FlavorChips } from "@/components/site/flavor-filter";
import { SiteFrame } from "@/components/site/site-frame";
import { cardBowl, flavorBowl, isFlavorId, labEntries, pageMeta, pillarBowl, type FlavorId } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/lab/")({
  validateSearch: (search: Record<string, unknown>): { flavor?: FlavorId } => ({
    flavor: isFlavorId(search.flavor) ? search.flavor : undefined,
  }),
  head: () => {
    const page = pageMeta("page.lab");
    return seoHead({ path: "/lab", title: page.title, description: page.description || page.subtitle });
  },
  component: LabPage,
});

function LabPage() {
  const page = pageMeta("page.lab");
  const bowl = pillarBowl("lab");
  const { flavor } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const visible = flavor ? labEntries.filter((entry) => entry.flavors.includes(flavor)) : labEntries;

  return (
    <SiteFrame
      bowl={bowl}
      lede={page.subtitle}
      title={page.header}
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
            <li data-bowl={cardBowl(entry.flavors, "lab")} key={entry.slug}>
              {entry.image ? <img alt={entry.imageAlt ?? ""} src={entry.image} /> : null}
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
