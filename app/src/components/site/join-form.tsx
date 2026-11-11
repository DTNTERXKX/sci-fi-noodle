import { useRef, useState, type FormEvent } from "react";

import { ContactAddressText } from "@/components/site/contact-address";
import { copyString, segmentCopy } from "@/content/catalog";
import { contactMailto, contactSubject, openContactMailto } from "@/lib/contact-mail";

function newsletterCopy() {
  const copy = segmentCopy("forms.newsletter");
  return {
    label: copyString(copy, "label"),
    placeholder: copyString(copy, "placeholder"),
    submit: copyString(copy, "submit"),
    help: copyString(copy, "help"),
    success: copyString(copy, "success"),
    invalidEmail: copyString(copy, "invalidEmail"),
    blocked: copyString(copy, "blocked"),
  };
}

function nestedText(source: unknown, key: string) {
  if (!source || typeof source !== "object") return "";
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function contactCopy() {
  const copy = segmentCopy("forms.contact");
  return {
    name: nestedText(copy.labels, "name"),
    email: nestedText(copy.labels, "email"),
    note: nestedText(copy.labels, "note"),
    submit: copyString(copy, "submit"),
    address: copyString(copy, "address"),
    subject: copyString(copy, "subject"),
    mailHint: copyString(copy, "mailHint"),
    mailOpened: copyString(copy, "mailOpened"),
    success: copyString(copy, "success"),
    nameError: nestedText(copy.errors, "name"),
    emailError: nestedText(copy.errors, "email"),
    noteError: nestedText(copy.errors, "note"),
    blocked: nestedText(copy.errors, "blocked"),
  };
}

async function postInbox(body: Record<string, string>) {
  const response = await fetch("/api/inbox", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
  return response.ok && payload?.ok === true;
}

export function JoinForm() {
  const form = newsletterCopy();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    const value = email.trim().toLowerCase();
    const form = newsletterCopy();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(form.invalidEmail);
      setMessage("");
      return;
    }
    pendingRef.current = true;
    setPending(true);
    try {
      const saved = await postInbox({ kind: "join", email: value });
      if (!saved) {
        setError(form.blocked);
        setMessage("");
        return;
      }
      setError("");
      setMessage(form.success);
    } catch {
      setError(form.blocked);
      setMessage("");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form className="join-form" noValidate onSubmit={onSubmit}>
      <label htmlFor="noodle-email">{form.label}</label>
      <div className="join-row">
        <input
          autoComplete="email"
          id="noodle-email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={form.placeholder}
          type="email"
          value={email}
        />
        <button className="cta-join" disabled={pending} type="submit">
          {form.submit}
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="form-ok">{message}</p> : null}
      <p className="form-help">{form.help}</p>
    </form>
  );
}

export function ContactForm() {
  const form = contactCopy();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [mailed, setMailed] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    const form = contactCopy();
    const nextName = name.trim();
    const nextEmail = email.trim();
    const nextNote = note.trim();
    if (nextName.length < 2) {
      setError(form.nameError);
      setMessage("");
      setMailed(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError(form.emailError);
      setMessage("");
      setMailed(false);
      return;
    }
    if (nextNote.length < 12) {
      setError(form.noteError);
      setMessage("");
      setMailed(false);
      return;
    }
    const mailto = form.address
      ? contactMailto({
          address: form.address,
          name: nextName,
          email: nextEmail,
          note: nextNote,
          subject: contactSubject(form.subject, nextName),
        })
      : "";
    pendingRef.current = true;
    setPending(true);
    try {
      const saved = await postInbox({ kind: "contact", name: nextName, email: nextEmail, note: nextNote });
      if (!saved) {
        setError(form.blocked);
        setMessage("");
      } else {
        setError("");
        setMessage(form.success);
        setNote("");
      }
    } catch {
      setError(form.blocked);
      setMessage("");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
    if (mailto) {
      setMailed(true);
      openContactMailto(mailto);
      return;
    }
    setMailed(false);
  }

  return (
    <form
      action={form.address ? `mailto:${form.address}` : undefined}
      className="contact-form"
      encType="text/plain"
      method="post"
      noValidate
      onSubmit={onSubmit}
    >
      <label htmlFor="contact-name">{form.name}</label>
      <input id="contact-name" name="name" onChange={(event) => setName(event.target.value)} value={name} />
      <label htmlFor="contact-email">{form.email}</label>
      <input
        autoComplete="email"
        id="contact-email"
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        value={email}
      />
      <label htmlFor="contact-note">{form.note}</label>
      <textarea id="contact-note" name="note" onChange={(event) => setNote(event.target.value)} rows={5} value={note} />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="form-ok">{message}</p> : null}
      {mailed && form.mailOpened ? (
        <p className="form-help">
          <ContactAddressText address={form.address} text={form.mailOpened} />
        </p>
      ) : null}
      <button className="cta-note" disabled={pending} type="submit">
        {form.submit}
      </button>
      {form.mailHint ? (
        <p className="form-help">
          <ContactAddressText address={form.address} text={form.mailHint} />
        </p>
      ) : null}
    </form>
  );
}
