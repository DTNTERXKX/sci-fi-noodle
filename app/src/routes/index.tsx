import { createFileRoute } from "@tanstack/react-router";

import { EnterBracket, ExploreOrbit, SignalLink } from "@/components/site/ctas";
import { CosmicHero } from "@/components/site/cosmic-hero";
import { FeatureHero } from "@/components/site/feature-hero";
import { JoinForm } from "@/components/site/join-form";
import { RamenMenu } from "@/components/site/ramen-menu";
import { Rail } from "@/components/site/rail";
import { SiteShell } from "@/components/site/site-frame";
import {
  atmospheres,
  classics,
  docs,
  features,
  flavorBowl,
  pillarBowl,
  shorts,
  studio,
  universes,
} from "@/content/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SCI-FI NOODLES // Cosmic Ramen Menu 001" },
      {
        name: "description",
        content: `${studio.line} Original universes, public-domain classics reimagined, and the lab behind them, served as a menu of sci-fi flavors.`,
      },
    ],
  }),
  component: Index,
});

const blackHole = pillarBowl("originals");
const timewarp = pillarBowl("public-domain");
const cyberpunk = pillarBowl("lab");

const timewarpRail = classics.map((item) => ({
  key: item.slug,
  href: `/public-domain/${item.slug}`,
  title: item.title,
  kicker: `${item.date} · after ${item.creator}`,
  hook: item.hook,
  image: item.image,
  bowl: timewarp.id,
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

function Index() {
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
          <h2 id="universes-title">{blackHole.category}</h2>
          <p>{blackHole.tagline} Each world keeps its own story. The channel only shows you the door.</p>
        </div>
        <div className="universe-split">
          {universes.map((universe) => (
            <article key={universe.slug}>
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
        lede={`${timewarp.tagline} The book supplies the bones. The film asks what the story is about now.`}
        seeAll={{ href: timewarp.href, label: "All Public Domain" }}
        title={`${timewarp.name} // ${timewarp.category}`}
      />

      <Rail
        items={flightRail}
        lede="A tasting flight of the three flavors: Quantum Fire shorts, Nebula Miso lore, and Zero-G Shio ambience."
        seeAll={{ href: "/watch", label: "Filter every flavor" }}
        title="Flavor flight"
      />

      <section className="lab-tease" data-bowl={cyberpunk.id} data-reveal>
        <div>
          <p className="bowl-kicker">
            <span>{cyberpunk.number} //</span> {cyberpunk.name}
          </p>
          <h2>{cyberpunk.category}</h2>
          <p>{cyberpunk.tagline} See how a shot gets cooked, and which experiments never leave the kitchen.</p>
          <ExploreOrbit href={cyberpunk.href} title="the Lab" />
        </div>
        <img alt="A dark edit bay with a bowl of glowing noodles" src="/assets/stills/lab.png" />
      </section>

      <section className="host-tease" data-reveal>
        <img alt="Katara in chill mode, the SCI-FI NOODLES host" src="/brand/katara-chill.png" />
        <div>
          <p className="kicker">Studio host</p>
          <h2>Katara</h2>
          <p>Chill, crunk, or glam. Talk to the face of the channel.</p>
          <SignalLink href="/host">Meet Katara</SignalLink>
        </div>
      </section>

      <section className="kitchen" data-reveal id="kitchen">
        <p className="kicker">The Noodle Drop</p>
        <h2>Join the kitchen</h2>
        <p>
          New premieres, strange experiments, and universe drops. You will not have to wait on the algorithm.
        </p>
        <JoinForm />
      </section>
    </SiteShell>
  );
}
