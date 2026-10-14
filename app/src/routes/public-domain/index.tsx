import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EnterBracket } from "@/components/site/ctas";
import { FilterStatus, FlavorChips } from "@/components/site/flavor-filter";
import { SiteFrame } from "@/components/site/site-frame";
import { bowlTitle, cardBowl, classics, flavorBowl, isFlavorId, pillarBowl, type FlavorId } from "@/content/catalog";

const bowl = pillarBowl("public-domain");

export const Route = createFileRoute("/public-domain/")({
  validateSearch: (search: Record<string, unknown>): { flavor?: FlavorId } => ({
    flavor: isFlavorId(search.flavor) ? search.flavor : undefined,
  }),
  head: () => ({
    meta: [
      { title: bowlTitle(bowl) },
      { name: "description", content: `${bowl.tagline} ${bowl.description}` },
    ],
  }),
  component: PublicDomainPage,
});

function PublicDomainPage() {
  const { flavor } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const visible = flavor ? classics.filter((item) => item.flavors.includes(flavor)) : classics;

  return (
    <SiteFrame
      bowl={bowl}
      lede="Public-domain books, retold as problems we have now. Every adaptation names its source. Public-domain status still depends on country, edition, and translation."
      title={bowl.category}
    >
      <div className="pillar-board page-block">
        <FlavorChips
          active={flavor}
          items={classics}
          onSelect={(value) => navigate({ search: { flavor: value }, replace: true, resetScroll: false })}
        />
        <FilterStatus count={visible.length} flavor={flavor} pillar="public-domain" />
      </div>
      {visible.length === 0 ? (
        <p className="empty-shelf">No classics in this flavor yet. Try another.</p>
      ) : (
        <ul className="classic-grid">
          {visible.map((item) => (
            <li data-bowl={cardBowl(item.flavors, "public-domain")} key={item.slug}>
              <img alt={item.imageAlt ?? ""} src={item.image} />
              <p className="meta-line">
                {item.creator}, {item.published}
              </p>
              <h2>{item.title}</h2>
              <p>{item.hook}</p>
              {item.flavors.length > 0 ? (
                <ul aria-label="Flavors" className="bowl-badges">
                  {item.flavors.map((id) => (
                    <li className="bowl-badge" data-bowl={flavorBowl(id).id} key={id}>
                      {flavorBowl(id).short}
                    </li>
                  ))}
                </ul>
              ) : null}
              <EnterBracket href={`/public-domain/${item.slug}`} title={item.title} />
            </li>
          ))}
        </ul>
      )}
    </SiteFrame>
  );
}
