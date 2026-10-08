import { createFileRoute } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";
import { studio } from "@/content/catalog";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Terms for using the SCI-FI NOODLES website and its original films.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteFrame lede="The door is open. The films are not a free asset library." title="Terms">
      <article className="legal-copy">
        <p>
          Original SCI-FI NOODLES films, marks, and site design are owned by {studio.owner}.
          You may watch them, share links, and talk about them. You may not republish
          the films, pretend they are yours, or train a model on them.
        </p>
        <p>
          Public-domain projects adapt old texts. The adaptation, picture, sound, and
          edit are new and reserved. The rights note on each project says which source
          was used.
        </p>
        <p>
          Realistic footage and voices on the channel are AI-assisted and disclosed
          on YouTube. Nothing here is news, a product claim, or professional advice.
        </p>
      </article>
    </SiteFrame>
  );
}
