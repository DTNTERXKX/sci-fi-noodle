import { createFileRoute } from "@tanstack/react-router";

import { KataraHost } from "@/components/site/katara-host";
import { SiteFrame } from "@/components/site/site-frame";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Katara | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Talk with Katara, the SCI-FI NOODLES host, in chill, crunk, or glam mode.",
      },
    ],
  }),
  component: HostPage,
});

function HostPage() {
  return (
    <SiteFrame
      lede="The channel host. Switch her look, then talk or type. Speech uses the studio voice when it is connected, and this browser when it is not."
      title="Katara"
    >
      <KataraHost />
    </SiteFrame>
  );
}
