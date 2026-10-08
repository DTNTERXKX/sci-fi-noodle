import { createFileRoute } from "@tanstack/react-router";

import { EnterBracket, ExploreOrbit, WatchMark } from "@/components/site/ctas";
import { JoinForm } from "@/components/site/join-form";
import { NoodleRule, SiteFooter, SiteNav } from "@/components/site/site-frame";
import { ScrollScrub } from "@/components/scroll-scrub/scroll-scrub";
import { classics, pillars, studio, universes, youtubeFor } from "@/content/catalog";
import { scrollScrubScenes, scrollScrubTheme } from "@/scroll-scrub-scenes";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const premiere = classics[0];
  const slate = classics.slice(0, 4);

  return (
    <main>
      <SiteNav />
      <ScrollScrub className="studio-journey" scenes={scrollScrubScenes} theme={scrollScrubTheme} />

      <section className="premiere">
        <a className="premiere-still" href={`/public-domain/${premiere.slug}`}>
          <img alt="" src={premiere.image} />
        </a>
        <div className="premiere-copy">
          <p className="kicker">Next premiere</p>
          <h2>{premiere.title}</h2>
          <p>{premiere.hook}</p>
          <p className="meta-line">
            {premiere.source}, {premiere.published} · {premiere.runtime} · {premiere.date}
          </p>
          <WatchMark href={youtubeFor(premiere.title)} />
        </div>
      </section>

      <section className="shelf">
        <div className="section-head">
          <h2>Choose your noodle</h2>
          <p>Six shelves. One studio. Pick the kind of strange you want tonight.</p>
        </div>
        <div className="shelf-rail">
          {pillars.map((pillar) => (
            <a className="shelf-card" href={pillar.href} key={pillar.id}>
              <img alt="" src={pillar.image} />
              <span>
                <strong>{pillar.title}</strong>
                <em>{pillar.promise}</em>
              </span>
            </a>
          ))}
        </div>
      </section>

      <NoodleRule />

      <section className="universes">
        <div className="section-head">
          <h2>Original universes</h2>
          <p>Each world keeps its own story. The channel only shows you the door.</p>
        </div>
        <div className="universe-split">
          {universes.map((universe) => (
            <article key={universe.slug}>
              <img alt="" src={universe.image} />
              <div>
                <p className="meta-line">{universe.status}</p>
                <h3>{universe.title}</h3>
                <p>{universe.logline}</p>
                <EnterBracket href={`/originals/${universe.slug}`} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="classics">
        <div className="section-head">
          <h2>Public domain, reimagined</h2>
          <p>The book supplies the bones. The film asks what the story is about now.</p>
        </div>
        <ul>
          {slate.map((item) => (
            <li key={item.slug}>
              <a href={`/public-domain/${item.slug}`}>
                <span>{item.date}</span>
                <strong>{item.title}</strong>
                <em>{item.hook}</em>
              </a>
            </li>
          ))}
        </ul>
        <ExploreOrbit href="/public-domain" />
      </section>

      <section className="latest">
        <div className="section-head">
          <h2>On the slate</h2>
          <p>Premieres open on YouTube. This page is the map, not a second comment section.</p>
        </div>
        <ol>
          {classics.slice(0, 3).map((item) => (
            <li key={item.slug}>
              <span>{item.date}</span>
              <div>
                <a href={`/public-domain/${item.slug}`}>{item.title}</a>
                <p>{item.hook}</p>
              </div>
              <em>{item.runtime}</em>
            </li>
          ))}
        </ol>
        <ExploreOrbit href="/watch" />
      </section>

      <section className="lab-tease">
        <div>
          <h2>Behind the noodles</h2>
          <p>See how a shot gets cooked, and which experiments never leave the kitchen.</p>
          <ExploreOrbit href="/lab" />
        </div>
        <img alt="A dark edit bay with a bowl of glowing noodles" src="/assets/stills/lab.png" />
      </section>

      <section className="kitchen" id="kitchen">
        <p className="kicker">The Noodle Drop</p>
        <h2>Join the kitchen</h2>
        <p>
          New premieres, strange experiments, and universe drops. You will not have to
          wait on the algorithm.
        </p>
        <JoinForm />
      </section>

      <SiteFooter />
      <p className="sr-only">{studio.name}</p>
    </main>
  );
}
