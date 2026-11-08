import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";

import { copyString, segmentCopy } from "@/content/catalog";
import { KATARA_LINK, kataraTarget, splitAtOpenLink } from "@/lib/katara-links";

export type KataraMode = "chill" | "crunk" | "glam";

type FeedItem =
  | { id: number; kind: "user" | "katara"; text: string }
  | { id: number; kind: "note"; text: string };

type TalkPayload = {
  ok?: boolean;
  reply?: string;
  voice?: string | null;
  voiceNote?: string | null;
};

type SpeechRecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

const MODE_ART: Record<KataraMode, { image: string; face: string }> = {
  chill: { image: "/brand/katara-chill.png", face: "/brand/katara-chill-face.png" },
  crunk: { image: "/brand/katara-crunk.png", face: "/brand/katara-crunk-face.png" },
  glam: { image: "/brand/katara-glam.png", face: "/brand/katara-glam-face.png" },
};

export function kataraModes(): Record<
  KataraMode,
  { label: string; image: string; face: string; caption: string; status: string }
> {
  const modes = {
    chill: {
      label: "Chill",
      ...MODE_ART.chill,
      caption: "Soft pastel streetwear, sporty attitude, and warm everyday community vibes.",
      status: "Online · Chill",
    },
    crunk: {
      label: "Crunk",
      ...MODE_ART.crunk,
      caption: "Maximum hype, cosmic energy, fast reactions, and galaxy-print varsity heat.",
      status: "Hyped · Crunk",
    },
    glam: {
      label: "Glam",
      ...MODE_ART.glam,
      caption: "Front-row superstar, sleek celestial halter, platform poise, and premiere energy.",
      status: "Live · Glam",
    },
  };
  const listed = segmentCopy("host.modes").modes;
  if (!Array.isArray(listed)) return modes;
  for (const item of listed) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; label?: unknown; status?: unknown; caption?: unknown };
    if (row.id !== "chill" && row.id !== "crunk" && row.id !== "glam") continue;
    if (typeof row.label === "string" && row.label) modes[row.id].label = row.label;
    if (typeof row.status === "string" && row.status) modes[row.id].status = row.status;
    if (typeof row.caption === "string" && row.caption) modes[row.id].caption = row.caption;
  }
  return modes;
}

export function kataraGreeting() {
  return copyString(segmentCopy("host.modes"), "greeting");
}

const FAIL_NOTE = "Hold up, cosmic interference. Check the connection and try again.";

const VOICE_SRC: Record<KataraMode, string> = {
  chill: "/voices/katara_chill.mp3",
  crunk: "/voices/katara_crunk.mp3",
  glam: "/voices/katara_glam.mp3",
};

/** Katara's words with her recommendations as real links. Unknown links stay plain text. */
function KataraText({ text, onFollow }: { text: string; onFollow?: () => void }) {
  const { ready, held } = splitAtOpenLink(text.replace(/\*+/g, ""));
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of ready.matchAll(KATARA_LINK)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(ready.slice(last, index));
    const [, title, href] = match;
    const target = kataraTarget(href);
    parts.push(
      target ? (
        <Link
          className="host-link"
          key={index}
          onClick={onFollow}
          search={target.search as never}
          to={target.pathname as never}
        >
          {title}
        </Link>
      ) : (
        title
      ),
    );
    last = index + match[0].length;
  }
  if (last < ready.length) parts.push(ready.slice(last));
  if (held) parts.push(held.slice(1).split("](")[0]);
  return <>{parts}</>;
}

type KataraHostProps = {
  variant?: "page" | "dock";
  initialMode?: KataraMode;
  onModeChange?: (mode: KataraMode) => void;
  onFollowLink?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
};

function speechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function KataraHost({
  variant = "page",
  initialMode = "chill",
  onModeChange,
  onFollowLink,
  inputRef,
}: KataraHostProps = {}) {
  const draftId = useId();
  const [mode, setMode] = useState<KataraMode>(initialMode);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [talking, setTalking] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>(() => [{ id: 1, kind: "katara", text: kataraGreeting() }]);
  const feedRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);
  const turnRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const busyRef = useRef(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [feed]);

  useEffect(() => {
    for (const look of Object.values(kataraModes())) {
      const preload = new Image();
      preload.src = look.face;
    }
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      abortRef.current?.abort();
      const audio = voiceRef.current;
      if (!audio) return;
      audio.onended = null;
      audio.pause();
    };
  }, []);

  function pushItem(item: Omit<FeedItem, "id">) {
    const id = idRef.current++;
    setFeed((current) => [...current, { ...item, id }]);
  }

  function stopVoice() {
    const audio = voiceRef.current;
    voiceRef.current = null;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.onplay = null;
    audio.pause();
    setTalking(false);
  }

  function playVoice(src: string) {
    stopVoice();
    const audio = new Audio(src);
    voiceRef.current = audio;
    audio.onplay = () => {
      if (voiceRef.current === audio) setTalking(true);
    };
    audio.onended = () => {
      if (voiceRef.current === audio) setTalking(false);
    };
    audio.onerror = () => {
      if (voiceRef.current === audio) setTalking(false);
    };
    void audio.play().catch(() => {
      if (voiceRef.current === audio) setTalking(false);
    });
  }

  function switchMode(next: KataraMode) {
    stopVoice();
    abortRef.current?.abort();
    busyRef.current = false;
    setBusy(false);
    setMode(next);
    onModeChange?.(next);
    pushItem({ kind: "note", text: `Switched to Katara ${kataraModes()[next].label} mode.` });
  }

  async function sendMessage(text: string) {
    const query = text.trim();
    if (!query || busyRef.current) return;
    const activeMode = modeRef.current;
    stopVoice();
    const turn = ++turnRef.current;
    const abort = new AbortController();
    abortRef.current = abort;
    busyRef.current = true;
    setDraft("");
    setBusy(true);
    pushItem({ kind: "user", text: query });
    playVoice(VOICE_SRC[activeMode]);

    try {
      const response = await fetch("/api/katara/talk", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, mode: activeMode }),
        signal: abort.signal,
      });
      if (turnRef.current !== turn) return;
      const payload = (await response.json().catch(() => null)) as TalkPayload | null;
      if (turnRef.current !== turn) return;
      if (!response.ok || !payload?.ok || !payload.reply) {
        stopVoice();
        pushItem({ kind: "note", text: FAIL_NOTE });
        return;
      }
      pushItem({ kind: "katara", text: payload.reply });
      if (payload.voice) {
        const current = voiceRef.current;
        const playing = !!current && !current.paused && !current.ended && current.src.endsWith(payload.voice);
        if (!playing) playVoice(payload.voice);
      } else {
        stopVoice();
        if (payload.voiceNote) pushItem({ kind: "note", text: payload.voiceNote });
      }
    } catch (error) {
      if (turnRef.current !== turn) return;
      if (error instanceof Error && error.name === "AbortError") return;
      stopVoice();
      pushItem({ kind: "note", text: FAIL_NOTE });
    } finally {
      if (turnRef.current === turn) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function toggleVoice() {
    const Ctor = speechRecognitionCtor();
    if (!Ctor) {
      pushItem({
        kind: "note",
        text: "This browser cannot hear the mic. Chrome can. You can still type.",
      });
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript ?? "";
      if (spoken.trim()) void sendMessage(spoken);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }

  const modes = kataraModes();
  const look = modes[mode];

  return (
    <section className={`host-stage host-stage-${mode} host-stage-${variant}`}>
      <div className="host-look">
        <div className="host-modes" role="group" aria-label="Katara mode">
          {(Object.keys(modes) as KataraMode[]).map((key) => (
            <button
              aria-pressed={mode === key}
              className="host-mode"
              data-mode={key}
              key={key}
              onClick={() => switchMode(key)}
              type="button"
            >
              {modes[key].label}
            </button>
          ))}
        </div>
        <figure className={`host-portrait${talking ? " is-talking" : ""}`} data-mode={mode}>
          <img
            alt={talking ? `Katara speaking in ${look.label} mode` : `Katara in ${look.label} mode`}
            className={talking || variant === "dock" ? "is-face" : undefined}
            src={talking || variant === "dock" ? look.face : look.image}
          />
          <figcaption>
            <span className="host-dot" />
            {look.status}
          </figcaption>
        </figure>
        {variant === "page" ? (
          <div className="host-id">
            <h2>
              Katara <span>Cosmic Ramen // Host</span>
            </h2>
            <p>{look.caption}</p>
          </div>
        ) : null}
      </div>
      <div className="host-chat">
        <div aria-live="polite" className="host-feed" ref={feedRef} role="log">
          {feed.map((item) =>
            item.kind === "note" ? (
              <p className="host-note" key={item.id}>
                {item.text}
              </p>
            ) : (
              <div className={`host-line host-line-${item.kind}`} key={item.id}>
                {item.kind === "katara" ? <span aria-hidden="true">K</span> : null}
                <p>{item.kind === "katara" ? <KataraText onFollow={onFollowLink} text={item.text} /> : item.text}</p>
              </div>
            ),
          )}
        </div>
        <form className="host-form" onSubmit={onSubmit}>
          <button
            aria-pressed={listening}
            className={`host-mic${listening ? " is-live" : ""}`}
            onClick={toggleVoice}
            title="Speak to Katara"
            type="button"
          >
            <span className="sr-only">{listening ? "Stop microphone" : "Speak to Katara"}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          <label className="sr-only" htmlFor={draftId}>
            Message Katara
          </label>
          <input
            autoComplete="off"
            id={draftId}
            maxLength={500}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={busy ? "Katara is checking the menu..." : "Ask for a bowl by mood or flavor"}
            ref={inputRef}
            value={draft}
          />
          <button className="cta-send" disabled={busy || draft.trim().length === 0} type="submit">
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
