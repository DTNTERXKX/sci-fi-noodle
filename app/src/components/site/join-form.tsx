import { useState, type FormEvent } from "react";

export function JoinForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Use a full email address.");
      setMessage("");
      return;
    }
    try {
      window.localStorage.setItem("noodle-drop-email", value);
    } catch {
      setError("This browser blocked saving the address.");
      setMessage("");
      return;
    }
    setError("");
    setMessage("Saved in this browser. The studio inbox connects when the list goes live.");
  }

  return (
    <form className="join-form" noValidate onSubmit={onSubmit}>
      <label htmlFor="noodle-email">Email</label>
      <div className="join-row">
        <input
          autoComplete="email"
          id="noodle-email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@domain.com"
          type="email"
          value={email}
        />
        <button className="cta-join" type="submit">
          Join
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="form-ok">{message}</p> : null}
      <p className="form-help">Release notes, not a weekly quota. Leave whenever you want.</p>
    </form>
  );
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Add your name.");
      setMessage("");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Use a full email address.");
      setMessage("");
      return;
    }
    if (note.trim().length < 12) {
      setError("Tell us what you want in a sentence or two.");
      setMessage("");
      return;
    }
    try {
      const key = "noodle-contact-notes";
      const prior = window.localStorage.getItem(key);
      const notes = prior ? (JSON.parse(prior) as unknown[]) : [];
      notes.push({ name: name.trim(), email: email.trim(), note: note.trim(), at: new Date().toISOString() });
      window.localStorage.setItem(key, JSON.stringify(notes));
    } catch {
      setError("This browser blocked saving the note.");
      setMessage("");
      return;
    }
    setError("");
    setMessage("Kept on this computer. A person reads partnership notes once the inbox is connected.");
    setNote("");
  }

  return (
    <form className="contact-form" noValidate onSubmit={onSubmit}>
      <label htmlFor="contact-name">Name</label>
      <input id="contact-name" onChange={(event) => setName(event.target.value)} value={name} />
      <label htmlFor="contact-email">Email</label>
      <input
        autoComplete="email"
        id="contact-email"
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        value={email}
      />
      <label htmlFor="contact-note">Note</label>
      <textarea id="contact-note" onChange={(event) => setNote(event.target.value)} rows={5} value={note} />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="form-ok">{message}</p> : null}
      <button className="cta-note" type="submit">
        Send note
      </button>
    </form>
  );
}
