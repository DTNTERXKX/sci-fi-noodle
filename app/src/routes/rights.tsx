import { createFileRoute } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";

export const Route = createFileRoute("/rights")({
  head: () => ({
    meta: [
      { title: "Rights | SCI-FI NOODLES" },
      {
        name: "description",
        content: "How SCI-FI NOODLES labels public-domain projects and what the website does not copy from later adaptations.",
      },
    ],
  }),
  component: RightsPage,
});

function RightsPage() {
  return (
    <SiteFrame
      lede="A project is called public domain only after the source is checked. The website shows the short note. The research stays in the project file."
      title="Copyright and rights"
    >
      <article className="legal-copy">
        <p>Before a film is labeled public domain, the studio checks:</p>
        <ul>
          <li>The original work's status.</li>
          <li>The jurisdiction the channel is publishing into.</li>
          <li>The edition or translation, which can still be protected.</li>
          <li>Music, artwork, photographs, fonts, and restorations, separately.</li>
          <li>Later films, comics, and games, which are left alone.</li>
        </ul>
        <p>
          Status can differ by country. A note on the project page is the public
          summary, not a promise that every territory treats the source the same way.
        </p>
        <p>
          If you hold a right you believe a film uses, write through the contact page
          with the project name and the claim.
        </p>
      </article>
    </SiteFrame>
  );
}
