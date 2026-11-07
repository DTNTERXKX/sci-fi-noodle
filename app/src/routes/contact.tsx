import { createFileRoute } from "@tanstack/react-router";

import { ContactForm } from "@/components/site/join-form";
import { SiteFrame } from "@/components/site/site-frame";
import { pageMeta } from "@/content/catalog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => {
    const page = pageMeta("page.contact");
    return seoHead({ path: "/contact", title: page.title, description: page.description });
  },
  component: ContactPage,
});

function ContactPage() {
  const page = pageMeta("page.contact");
  return (
    <SiteFrame lede={page.subtitle} title={page.header}>
      <ContactForm />
    </SiteFrame>
  );
}
