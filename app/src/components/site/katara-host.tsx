import { useEffect, useRef, useState, type FormEvent } from "react";

import { chatKatara, speakKatara } from "@/lib/api/katara.functions";

type KataraMode = "chill" | "crunk" | "glam";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type FeedItem =
  | { id: number; kind: "user" | "katara"; text: string }
  | { id: number; kind: "note"; text: string };

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

const MODES: Record<
  KataraMode,
  { label: string; image: string; caption: string; status: string }
> = {
  chill: {
    label: "Chill",
    image: "/brand/katara-chill.png",
    caption: "Soft pastel streetwear, sporty attitude, and warm everyday community vibes.",
    status: "Online · Chill",
  },
  crunk: {
    label: "Crunk",
    image: "/brand/katara-crunk.png",
    caption: "Maximum hype, cosmic energy, fast reactions, and galaxy-print varsity heat.",
    status: "Hyped · Crunk",
  },
  glam: {
    label: "Glam",
    image: "/brand/katara-glam.png",
    caption: "Front-row superstar, sleek celestial halter, platform poise, and premiere energy.",
    status: "Live · Glam",
  },
};

const GREETING =
  "Hey. Welcome to the SCI-FI NOODLES universe. I'm Katara. Are we chilling, getting hyped, or checking the front row?";

function speechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function KataraHost() {
  const [mode, setMode] = useState<KataraMode>("chill");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [talking, setTalking] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([
    { id: 1, kind: "katara", text: GREETING },
  ]);
  const historyRef = useRef<ChatTurn[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [feed]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  function pushItem(item: Omit<FeedItem, "id">) {
    const id = idRef.current++;
    setFeed((current) => [...current, { ...item, id }]);
  }

  function switchMode(next: KataraMode) {
    setMode(next);
    pushItem({ kind: "note", text: `Switched to Katara ${MODES[next].label} mode.` });
  }

  function stopSpeech() {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setTalking(false);
  }

  async function speak(text: string, activeMode: KataraMode) {
    stopSpeech();
    setTalking(true);
    try {
      const spoken = await speakKatara({ data: { text, mode: activeMode } });
      if (spoken.audioBase64) {
        const binary = atob(spoken.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setTalking(false);
        audio.onerror = () => setTalking(false);
        await audio.play();
        return;
      }
    } catch {
      // Browser speech still carries the line.
    }

    if (!window.speechSynthesis) {
      setTalking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.15;
    utterance.rate = activeMode === "crunk" ? 1.2 : 1;
    utterance.onend = () => setTalking(false);
    utterance.onerror = () => setTalking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(text: string) {
    const query = text.trim();
    if (!query || busy) return;
    const activeMode = modeRef.current;
    setDraft("");
    setBusy(true);
    pushItem({ kind: "user", text: query });

    try {
      const result = await chatKatara({
        data: { message: query, mode: activeMode, history: historyRef.current },
      });
      if (!result.ok) {
        pushItem({
          kind: "note",
          text:
            result.error === "missing_key"
              ? "Katara's line is quiet until OPENAI_API_KEY is set in app/.env on this machine."
              : "Hold up, cosmic interference. Check the connection and try again.",
        });
        return;
      }
      const nextHistory: ChatTurn[] = [
        ...historyRef.current,
        { role: "user", content: query },
        { role: "assistant", content: result.reply },
      ];
      historyRef.current = nextHistory.slice(-6);
      pushItem({ kind: "katara", text: result.reply });
      void speak(result.reply, activeMode);
    } catch {
      pushItem({
        kind: "note",
        text: "Hold up, cosmic interference. Check the connection and try again.",
      });
    } finally {
      setBusy(false);
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

  const look = MODES[mode];

  return (
    <section className={`host-stage host-stage-${mode}`}>
      <div className="host-look">
        <div className="host-modes" role="group" aria-label="Katara mode">
          {(Object.keys(MODES) as KataraMode[]).map((key) => (
            <button
              aria-pressed={mode === key}
              className="host-mode"
              key={key}
              onClick={() => switchMode(key)}
              type="button"
            >
              {MODES[key].label}
            </button>
          ))}
        </div>
        <figure className={`host-portrait${talking ? " is-talking" : ""}`} data-mode={mode}>
          <img alt={`Katara in ${look.label} mode`} src={look.image} />
          <figcaption>
            <span className="host-dot" />
            {look.status}
          </figcaption>
        </figure>
        <div className="host-id">
          <h2>
            Katara <span>19 · UGC Host</span>
          </h2>
          <p>{look.caption}</p>
        </div>
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
                <p>{item.text}</p>
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
          <label className="sr-only" htmlFor="katara-draft">
            Message Katara
          </label>
          <input
            autoComplete="off"
            id="katara-draft"
            onChange={(event) => setDraft(event.target.value)}
            placeholder={busy ? "Katara is talking..." : "Type a message or ask Katara anything"}
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
