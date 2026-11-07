import { createFileRoute } from "@tanstack/react-router";

import { KataraHost } from "@/components/site/katara-host";
import { SiteFrame } from "@/components/site/site-frame";
import { pageMeta } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/host")({
  head: () => {
    const page = pageMeta("page.host");
    return seoHead({ path: "/host", title: page.title, description: page.description });
  },
  component: HostPage,
});

function HostPage() {
  const page = pageMeta("page.host");
  return (
    <SiteFrame lede={page.subtitle} title={page.header}>
      <KataraHost />
    </SiteFrame>
  );
}
