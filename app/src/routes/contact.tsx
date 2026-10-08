import { createFileRoute } from "@tanstack/react-router";

import { ContactForm } from "@/components/site/join-form";
import { SiteFrame } from "@/components/site/site-frame";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | SCI-FI NOODLES" },
      {
        name: "description",
        content: "Press, partnerships, and collaboration notes for SCI-FI NOODLES.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteFrame
      lede="Press, sponsors, and collaborators. Say what you want to make, and which shelf it belongs on."
      title="Contact"
    >
      <ContactForm />
    </SiteFrame>
  );
}
