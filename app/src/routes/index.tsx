import { createFileRoute } from "@tanstack/react-router";

import { EnterBracket, ExploreOrbit, SignalLink } from "@/components/site/ctas";
import { CosmicHero } from "@/components/site/cosmic-hero";
import { FeatureHero } from "@/components/site/feature-hero";
import { JoinForm } from "@/components/site/join-form";
import { openKataraDock } from "@/components/site/katara-dock";
import { RamenMenu } from "@/components/site/ramen-menu";
import { Rail } from "@/components/site/rail";
import { SiteShell } from "@/components/site/site-frame";
import {
  atmospheres,
  cardBowl,
  classics,
  copyString,
  docs,
  features,
  flavorBowl,
  pageMeta,
  pillarBowl,
  segmentCopy,
  segmentLocked,
  shorts,
  universes,
} from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const page = pageMeta("page.home");
    return seoHead({ path: "/", title: page.title, description: page.description });
  },
  component: Index,
});

function Index() {
  const blackHole = pillarBowl("originals");
  const timewarp = pillarBowl("public-domain");
  const cyberpunk = pillarBowl("lab");
  const originals = segmentCopy("home.originals");
  const publicDomain = segmentCopy("home.public-domain");
  const flight = segmentCopy("home.flavor-flight");
  const lab = segmentCopy("home.lab");
  const labImage = copyString(segmentLocked("home.lab"), "image");
  const host = segmentCopy("home.host");
  const hostImage = copyString(segmentLocked("home.host"), "image");
  const newsletter = segmentCopy("home.newsletter");
  const timewarpRail = classics.map((item) => ({
    key: item.slug,
    href: `/public-domain/${item.slug}`,
    title: item.title,
    kicker: `${item.date} · after ${item.creator}`,
    hook: item.hook,
    image: item.image,
    bowl: cardBowl(item.flavors, "public-domain"),
  }));
  const flightRail = [
    ...shorts.map((item) => ({ item, flavor: flavorBowl("quantum-fire"), href: "/shorts" })),
    ...docs.map((item) => ({ item, flavor: flavorBowl("nebula-miso"), href: "/docs" })),
    ...atmospheres.map((item) => ({ item, flavor: flavorBowl("zero-g"), href: "/atmospheres" })),
  ].map(({ item, flavor, href }) => ({
    key: item.slug,
    href,
    title: item.title,
    kicker: `${flavor.short} · ${item.runtime}`,
    hook: item.hook,
    image: item.image,
    bowl: flavor.id,
  }));

  return (
    <SiteShell className="home-main">
      <CosmicHero menuId="menu" />

      <RamenMenu id="menu" />

      <FeatureHero features={features} id="now-showing" />

      <section aria-labelledby="universes-title" className="universes" data-bowl={blackHole.id} data-reveal>
        <div className="section-head">
          <p className="bowl-kicker">
            <span>{blackHole.number} //</span> {blackHole.name}
          </p>
          <h2 id="universes-title">{copyString(originals, "header")}</h2>
          <p>{copyString(originals, "subtitle")}</p>
        </div>
        <div className="universe-split">
          {universes.map((universe) => (
            <article data-bowl={cardBowl(universe.flavors, "originals")} key={universe.slug}>
              <img alt={universe.imageAlt ?? ""} src={universe.image} />
              <div>
                <p className="meta-line">{universe.status}</p>
                <h3>{universe.title}</h3>
                <p>{universe.logline}</p>
                <EnterBracket href={`/originals/${universe.slug}`} title={universe.title} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <Rail
        bowl={timewarp.id}
        items={timewarpRail}
        lede={copyString(publicDomain, "subtitle")}
        seeAll={{ href: timewarp.href, label: copyString(publicDomain, "seeAll") }}
        title={copyString(publicDomain, "header")}
      />

      <Rail
        items={flightRail}
        lede={copyString(flight, "subtitle")}
        seeAll={{ href: "/watch", label: copyString(flight, "seeAll") }}
        title={copyString(flight, "header")}
      />

      <section className="lab-tease" data-bowl={cyberpunk.id} data-reveal>
        <div>
          <p className="bowl-kicker">
            <span>{cyberpunk.number} //</span> {cyberpunk.name}
          </p>
          <h2>{copyString(lab, "header")}</h2>
          <p>{copyString(lab, "subtitle")}</p>
          <ExploreOrbit href={cyberpunk.href} title={copyString(lab, "cta")} />
        </div>
        {labImage ? <img alt={copyString(lab, "imageAlt")} src={labImage} /> : null}
      </section>

      <section className="host-tease" data-reveal>
        {hostImage ? <img alt={copyString(host, "imageAlt")} src={hostImage} /> : null}
        <div>
          <p className="kicker">{copyString(host, "kicker")}</p>
          <h2>{copyString(host, "header")}</h2>
          <p>{copyString(host, "subtitle")}</p>
          <div className="host-tease-actions">
            <button className="host-ask" onClick={openKataraDock} type="button">
              {copyString(host, "primaryCta")}
            </button>
            <SignalLink href="/host">{copyString(host, "secondaryCta")}</SignalLink>
          </div>
        </div>
      </section>

      <section className="kitchen" data-reveal id="kitchen">
        <p className="kicker">{copyString(newsletter, "kicker")}</p>
        <h2>{copyString(newsletter, "header")}</h2>
        <p>{copyString(newsletter, "subtitle")}</p>
        <JoinForm />
      </section>
    </SiteShell>
  );
}
