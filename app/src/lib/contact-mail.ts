/** Builds a visitor-mail-app link. The site does not send this message. */

export function contactAddressParts(text: string, address: string) {
  if (!address || !text.includes(address)) return [text];
  const parts = text.split(address);
  const out: string[] = [];
  parts.forEach((part, index) => {
    if (index > 0) out.push(address);
    if (part) out.push(part);
  });
  return out;
}

export function contactSubject(template: string, name: string) {
  const filled = template.replaceAll("{name}", name).trim();
  return filled || name;
}

export function contactMailto(input: {
  address: string;
  name: string;
  email: string;
  note: string;
  subject: string;
}) {
  const body = `${input.note}\n\nFrom: ${input.name}\nReply: ${input.email}`;
  const params = new URLSearchParams({
    subject: input.subject,
    body,
  });
  return `mailto:${input.address}?${params.toString()}`;
}

export function openContactMailto(href: string) {
  if (typeof window === "undefined" || !href.startsWith("mailto:")) return;
  window.location.href = href;
}
