import { createFileRoute } from "@tanstack/react-router";

import { SiteFrame } from "@/components/site/site-frame";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy | SCI-FI NOODLES" },
      {
        name: "description",
        content: "How the SCI-FI NOODLES site handles the email you type and the pages you visit.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteFrame
      lede="Short version: this preview keeps what you type in your own browser."
      title="Privacy"
    >
      <article className="legal-copy">
        <p>
          The Noodle Drop form and the contact form save your note in local storage
          on this device. They are not sent to a studio server yet. Clearing site
          data removes them.
        </p>
        <p>
          Watching a film sends you to YouTube. YouTube has its own privacy policy.
          This site does not run a second comment system.
        </p>
        <p>
          When a real mailing list is connected, this page will name the provider,
          what it stores, and how to leave.
        </p>
      </article>
    </SiteFrame>
  );
}
