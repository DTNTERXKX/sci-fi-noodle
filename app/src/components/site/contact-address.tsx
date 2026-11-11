import type { ReactNode } from "react";

import { contactAddressParts } from "@/lib/contact-mail";

/** Renders copy that names the studio address as a mailto link. */
export function ContactAddressText({ text, address }: { text: string; address: string }) {
  const parts = contactAddressParts(text, address);
  return parts.map((part, index) =>
    part === address ? (
      <a href={`mailto:${address}`} key={`address-${index}`}>
        {address}
      </a>
    ) : (
      part
    ),
  );
}
