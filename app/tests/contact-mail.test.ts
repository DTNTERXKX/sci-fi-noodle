import { expect, test } from "bun:test";

import { segmentCopy } from "../src/content/site-file";
import { contactAddressParts, contactMailto, contactSubject } from "../src/lib/contact-mail";

const ADDRESS = "contact@scifinoodles.com";

test("the public contact address is on the contact page, form, and footer", () => {
  expect(segmentCopy("page.contact").email).toBe(ADDRESS);
  expect(segmentCopy("forms.contact").address).toBe(ADDRESS);
  expect(segmentCopy("forms.contact").success).toBe("Received. Your note is stored with the site.");
  expect(segmentCopy("site.footer").contactEmail).toBe(ADDRESS);
  const socials = segmentCopy("site.footer").socials;
  expect(JSON.stringify(socials)).not.toContain(ADDRESS);
});

test("the contact mailto fills the subject and message for the visitor's mail app", () => {
  const note = "We want a partnership conversation about the shop.";
  const href = contactMailto({
    address: ADDRESS,
    name: "Noodle Guest",
    email: "guest@example.com",
    note,
    subject: contactSubject("SCI-FI NOODLES note from {name}", "Noodle Guest"),
  });
  expect(href.startsWith(`mailto:${ADDRESS}?`)).toBe(true);
  const params = new URL(href).searchParams;
  expect(params.get("subject")).toBe("SCI-FI NOODLES note from Noodle Guest");
  const body = params.get("body") ?? "";
  expect(body).toContain(note);
  expect(body).toContain("Noodle Guest");
  expect(body).toContain("guest@example.com");
  expect(body.toLowerCase()).not.toContain("email was sent");
  expect(contactAddressParts(`Write ${ADDRESS} today.`, ADDRESS)).toEqual(["Write ", ADDRESS, " today."]);
});
