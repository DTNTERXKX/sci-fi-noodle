import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";

import { chatKatara, speakKatara } from "@/lib/api/katara.functions";
import { KATARA_LINK, kataraTarget, speakableText, splitAtOpenLink } from "@/lib/katara-links";

export type KataraMode = "chill" | "crunk" | "glam";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type FeedItem =
  | { id: number; kind: "user" | "katara"; text: string }
  | { id: number; kind: "note"; text: string };

type TalkEvent = {
  type?: string;
  text?: string;
  audioBase64?: string;
  sampleRate?: number;
  sentence?: number;
  fps?: number;
  bbox?: number[];
  size?: number[];
  start?: number;
  jpegs?: string[];
  ok?: boolean;
  reply?: string;
  error?: string;
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

export const MODES: Record<
  KataraMode,
  { label: string; image: string; face: string; caption: string; status: string }
> = {
  chill: {
    label: "Chill",
    image: "/brand/katara-chill.png",
    face: "/brand/katara-chill-face.png",
    caption: "Soft pastel streetwear, sporty attitude, and warm everyday community vibes.",
    status: "Online · Chill",
  },
  crunk: {
    label: "Crunk",
    image: "/brand/katara-crunk.png",
    face: "/brand/katara-crunk-face.png",
    caption: "Maximum hype, cosmic energy, fast reactions, and galaxy-print varsity heat.",
    status: "Hyped · Crunk",
  },
  glam: {
    label: "Glam",
    image: "/brand/katara-glam.png",
    face: "/brand/katara-glam-face.png",
    caption: "Front-row superstar, sleek celestial halter, platform poise, and premiere energy.",
    status: "Live · Glam",
  },
};

const GREETING =
  "Hey, welcome to SCI-FI NOODLES, the Cosmic Ramen shop. I'm Katara, your host. Tell me your mood and I'll pour you a bowl.";

/** Katara's words with her recommendations as real links. Unknown or half-streamed links stay plain text. */
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

const KEY_NOTE =
  "Katara's line is quiet until OPENAI_API_KEY is set in app/.env on this machine.";

const FAIL_NOTE = "Hold up, cosmic interference. Check the connection and try again.";

function bytesFromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function concatBytes(left: Uint8Array, right: Uint8Array) {
  const merged = new Uint8Array(left.length + right.length);
  merged.set(left, 0);
  merged.set(right, left.length);
  return merged;
}

function resample(input: Float32Array, fromRate: number, toRate: number) {
  if (fromRate === toRate || input.length === 0) return input;
  const length = Math.max(1, Math.round((input.length * toRate) / fromRate));
  const output = new Float32Array(length);
  const ratio = fromRate / toRate;
  for (let index = 0; index < length; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const mix = position - left;
    const leftSample = input[left] ?? 0;
    const rightSample = input[right] ?? leftSample;
    output[index] = leftSample * (1 - mix) + rightSample * mix;
  }
  return output;
}

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? host.webkitAudioContext ?? null;
}

type LipClip = {
  fps: number;
  bbox: [number, number, number, number];
  size: [number, number];
  frames: Array<ImageBitmap | undefined>;
  received: number;
  startAt: number | null;
  endAt: number;
  drawn: number;
  freed: number;
};

type SpeechSegment = {
  sentence: number | null;
  buffers: AudioBuffer[];
  open: boolean;
  deadline?: number;
};

const LIP_LEAD_FRAMES = 6;
// A slow or contended GPU must never stall speech: held audio plays after this wait regardless.
const LIP_MAX_WAIT = 0.8;

class LiveSpeech {
  private ctx: AudioContext | null = null;
  private epoch = 0;
  private chain: Promise<void> = Promise.resolve();
  private nextTime = 0;
  private started = false;
  private sealed = false;
  private ended = false;
  private leftover = new Map<number | null, Uint8Array>();
  private sources: AudioBufferSourceNode[] = [];
  private endTimer: ReturnType<typeof setTimeout> | null = null;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private queue: SpeechSegment[] = [];
  private clips = new Map<number, LipClip>();
  private canvas: HTMLCanvasElement | null = null;
  private painted = false;
  private raf: number | null = null;

  constructor(
    private readonly onStart: () => void,
    private readonly onEnd: () => void,
  ) {}

  attach(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
  }

  prime() {
    const ctx = this.ensure();
    if (ctx) void ctx.resume();
  }

  begin() {
    this.stop();
    this.epoch += 1;
    this.sealed = false;
    this.ended = false;
    this.started = false;
    this.nextTime = 0;
    this.chain = Promise.resolve();
  }

  stop() {
    this.epoch += 1;
    this.ended = true;
    this.sealed = true;
    this.leftover.clear();
    this.queue = [];
    this.clearTimer();
    this.clearHold();
    this.stopSources();
    this.dropClips();
  }

  pushPcm(base64: string, sampleRate: number, sentence?: number) {
    const epoch = this.epoch;
    const bytes = bytesFromBase64(base64);
    const key = sentence ?? null;
    this.chain = this.chain
      .then(() => {
        if (epoch !== this.epoch) return;
        const merged = concatBytes(this.leftover.get(key) ?? new Uint8Array(0), bytes);
        const usable = merged.length - (merged.length % 2);
        this.leftover.set(key, merged.slice(usable));
        if (usable < 2) return;
        const view = new DataView(merged.buffer, merged.byteOffset, usable);
        const frames = usable / 2;
        const floats = new Float32Array(frames);
        for (let index = 0; index < frames; index += 1) {
          floats[index] = view.getInt16(index * 2, true) / 32768;
        }
        const ctx = this.ensure();
        if (!ctx) return;
        const playback = resample(floats, sampleRate, ctx.sampleRate);
        const buffer = ctx.createBuffer(1, playback.length, ctx.sampleRate);
        buffer.getChannelData(0).set(playback);
        this.segment(key).buffers.push(buffer);
        this.pump(epoch);
      })
      .catch(() => undefined);
  }

  pushMp3(base64: string) {
    const epoch = this.epoch;
    const bytes = bytesFromBase64(base64);
    this.chain = this.chain
      .then(async () => {
        if (epoch !== this.epoch) return;
        const ctx = this.ensure();
        if (!ctx) return;
        const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const decoded = await ctx.decodeAudioData(copy);
        if (epoch !== this.epoch) return;
        this.segment(null).buffers.push(decoded);
        this.pump(epoch);
      })
      .catch(() => undefined);
  }

  startClip(
    sentence: number,
    clip: { fps: number; bbox: [number, number, number, number]; size: [number, number] },
  ) {
    const epoch = this.epoch;
    this.chain = this.chain.then(() => {
      if (epoch !== this.epoch || clip.fps <= 0) return;
      this.clips.set(sentence, {
        ...clip,
        frames: [],
        received: 0,
        startAt: null,
        endAt: 0,
        drawn: -1,
        freed: 0,
      });
    });
  }

  pushFrames(sentence: number, start: number, jpegs: string[]) {
    const epoch = this.epoch;
    this.chain = this.chain.then(() => {
      const clip = this.clips.get(sentence);
      if (epoch !== this.epoch || !clip) return;
      jpegs.forEach((jpeg, offset) => {
        const index = start + offset;
        const blob = new Blob([bytesFromBase64(jpeg)], { type: "image/jpeg" });
        void createImageBitmap(blob)
          .then((bitmap) => {
            if (epoch !== this.epoch || this.clips.get(sentence) !== clip || index < clip.freed) {
              bitmap.close();
              return;
            }
            clip.frames[index] = bitmap;
          })
          .catch(() => undefined);
      });
      clip.received = Math.max(clip.received, start + jpegs.length);
      if (clip.received >= LIP_LEAD_FRAMES) this.release(sentence, epoch);
    });
  }

  endClip(sentence: number, ok: boolean) {
    const epoch = this.epoch;
    this.chain = this.chain.then(() => {
      if (epoch !== this.epoch) return;
      const clip = this.clips.get(sentence);
      if (!ok && clip && clip.startAt == null) {
        this.closeClip(clip);
        this.clips.delete(sentence);
      }
      this.release(sentence, epoch);
    });
  }

  seal() {
    const epoch = this.epoch;
    this.chain = this.chain.then(() => {
      if (epoch !== this.epoch || this.sealed) return;
      this.sealed = true;
      for (const segment of this.queue) if (segment.sentence == null) segment.open = true;
      this.pump(epoch);
      if (this.started) this.checkEnd();
    });
  }

  private segment(sentence: number | null) {
    const tail = this.queue.at(-1);
    if (sentence == null) {
      if (tail && tail.sentence == null) return tail;
    } else {
      const found = this.queue.find((segment) => segment.sentence === sentence);
      if (found) return found;
    }
    const created: SpeechSegment = { sentence, buffers: [], open: sentence == null };
    this.queue.push(created);
    return created;
  }

  private release(sentence: number, epoch: number) {
    const segment = this.queue.find((entry) => entry.sentence === sentence);
    if (!segment || segment.open) return;
    segment.open = true;
    this.pump(epoch);
  }

  private pump(epoch: number) {
    while (this.queue.length > 0) {
      const segment = this.queue[0];
      if (!segment.open) {
        this.hold(segment, epoch);
        return;
      }
      for (const buffer of segment.buffers) this.schedule(buffer, epoch, segment.sentence);
      segment.buffers = [];
      if (this.queue.length === 1) return;
      this.queue.shift();
    }
  }

  private hold(segment: SpeechSegment, epoch: number) {
    if (segment.deadline != null || segment.buffers.length === 0 || !this.ctx) return;
    const now = this.ctx.currentTime;
    segment.deadline = Math.max(this.nextTime, now) + LIP_MAX_WAIT;
    this.clearHold();
    this.holdTimer = setTimeout(
      () => {
        this.holdTimer = null;
        if (epoch !== this.epoch || segment.open || this.queue[0] !== segment) return;
        segment.open = true;
        this.pump(epoch);
      },
      (segment.deadline - now) * 1000,
    );
  }

  private clearHold() {
    if (this.holdTimer == null) return;
    clearTimeout(this.holdTimer);
    this.holdTimer = null;
  }

  private ensure() {
    if (this.ctx && this.ctx.state !== "closed") {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    }
    const Ctor = audioContextCtor();
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }

  private schedule(buffer: AudioBuffer, epoch: number, sentence: number | null) {
    if (epoch !== this.epoch || buffer.length === 0) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const clip = sentence == null ? undefined : this.clips.get(sentence);
    const lead = clip && clip.startAt == null ? 0.08 : 0.03;
    const startAt = Math.max(this.nextTime, ctx.currentTime + lead);
    source.start(startAt);
    this.nextTime = startAt + buffer.duration;
    this.sources.push(source);
    if (clip) {
      clip.startAt ??= startAt;
      clip.endAt = this.nextTime;
      this.loop();
    }
    if (!this.started) {
      this.started = true;
      this.onStart();
    }
    source.onended = () => {
      if (epoch === this.epoch) this.checkEnd();
    };
    this.armEnd();
  }

  private checkEnd() {
    if (!this.sealed || !this.ctx || this.queue.some((segment) => segment.buffers.length > 0)) return;
    if (this.ctx.currentTime >= this.nextTime - 0.04) this.emitEnd();
    else this.armEnd();
  }

  private armEnd() {
    if (!this.ctx) return;
    this.clearTimer();
    const epoch = this.epoch;
    const ms = Math.max(0, (this.nextTime - this.ctx.currentTime) * 1000) + 60;
    this.endTimer = setTimeout(() => {
      if (epoch === this.epoch) this.checkEnd();
    }, ms);
  }

  private emitEnd() {
    if (this.ended) return;
    this.ended = true;
    this.clearTimer();
    this.onEnd();
  }

  private clearTimer() {
    if (this.endTimer == null) return;
    clearTimeout(this.endTimer);
    this.endTimer = null;
  }

  private stopSources() {
    for (const source of this.sources) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        // Already stopped.
      }
    }
    this.sources = [];
  }

  private loop() {
    if (this.raf != null || typeof requestAnimationFrame === "undefined") return;
    this.raf = requestAnimationFrame(this.paint);
  }

  private readonly paint = () => {
    this.raf = null;
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    let shown = false;
    for (const [sentence, clip] of this.clips) {
      if (clip.startAt == null || now < clip.startAt) continue;
      if (now >= clip.endAt) {
        this.closeClip(clip);
        this.clips.delete(sentence);
        continue;
      }
      const index = Math.floor((now - clip.startAt) * clip.fps);
      for (; clip.freed < index - 1; clip.freed += 1) {
        clip.frames[clip.freed]?.close();
        clip.frames[clip.freed] = undefined;
      }
      const frame = clip.frames[index];
      if (frame) {
        if (index !== clip.drawn) this.draw(clip, frame);
        clip.drawn = index;
        shown = true;
      } else if (clip.drawn >= 0 && index - clip.drawn <= 2) {
        shown = true;
      }
    }
    if (!shown) this.wipe();
    if (this.clips.size > 0) this.loop();
  };

  private draw(clip: LipClip, frame: ImageBitmap) {
    const canvas = this.canvas;
    const surface = canvas?.getContext("2d");
    if (!canvas || !surface) return;
    const [width, height] = clip.size;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    } else {
      surface.clearRect(0, 0, width, height);
    }
    const [x, y, w, h] = clip.bbox;
    surface.drawImage(frame, x, y, w, h);
    this.painted = true;
  }

  private wipe() {
    if (!this.painted || !this.canvas) return;
    this.canvas.getContext("2d")?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.painted = false;
  }

  private closeClip(clip: LipClip) {
    for (const frame of clip.frames) frame?.close();
    clip.frames = [];
  }

  private dropClips() {
    for (const clip of this.clips.values()) this.closeClip(clip);
    this.clips.clear();
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.wipe();
  }
}

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
  const [synced, setSynced] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([{ id: 1, kind: "katara", text: GREETING }]);
  const historyRef = useRef<ChatTurn[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const lipsRef = useRef<HTMLCanvasElement>(null);
  const idRef = useRef(2);
  const speechTurnRef = useRef(0);
  const talkAbortRef = useRef<AbortController | null>(null);
  const playbackRef = useRef<LiveSpeech | null>(null);
  const busyRef = useRef(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [feed]);

  useEffect(() => {
    for (const look of Object.values(MODES)) {
      const preload = new Image();
      preload.src = look.face;
    }
  }, []);

  useEffect(() => {
    ensurePlayback().attach(lipsRef.current);
    return () => {
      recognitionRef.current?.stop();
      talkAbortRef.current?.abort();
      window.speechSynthesis?.cancel();
      playbackRef.current?.stop();
      playbackRef.current?.attach(null);
    };
  }, []);

  function ensurePlayback() {
    playbackRef.current ??= new LiveSpeech(
      () => setTalking(true),
      () => {
        setTalking(false);
        setSynced(false);
      },
    );
    return playbackRef.current;
  }

  function pushItem(item: Omit<FeedItem, "id">) {
    const id = idRef.current++;
    setFeed((current) => [...current, { ...item, id }]);
  }

  function stopSpeech() {
    speechTurnRef.current += 1;
    talkAbortRef.current?.abort();
    talkAbortRef.current = null;
    window.speechSynthesis?.cancel();
    playbackRef.current?.stop();
    setTalking(false);
    setSynced(false);
  }

  function switchMode(next: KataraMode) {
    stopSpeech();
    busyRef.current = false;
    setBusy(false);
    setMode(next);
    onModeChange?.(next);
    pushItem({ kind: "note", text: `Switched to Katara ${MODES[next].label} mode.` });
  }

  function sayBrowser(text: string, activeMode: KataraMode, turn: number) {
    const spoken = speakableText(text);
    if (speechTurnRef.current !== turn || !window.speechSynthesis || !spoken) return;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.pitch = 1.15;
    utterance.rate = activeMode === "crunk" ? 1.2 : 1;
    utterance.onstart = () => {
      if (speechTurnRef.current === turn) setTalking(true);
    };
    const finished = () => {
      if (speechTurnRef.current !== turn) return;
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) setTalking(false);
    };
    utterance.onend = finished;
    utterance.onerror = finished;
    window.speechSynthesis.speak(utterance);
  }

  async function playOneShot(text: string, activeMode: KataraMode, turn: number) {
    try {
      const spoken = await speakKatara({ data: { text: speakableText(text).slice(0, 600) || "Okay.", mode: activeMode } });
      if (speechTurnRef.current !== turn) return;
      if (spoken.audioBase64) {
        const player = ensurePlayback();
        player.pushMp3(spoken.audioBase64);
        player.seal();
        return;
      }
    } catch {
      // Browser speech still speaks this line.
    }
    if (speechTurnRef.current !== turn) return;
    sayBrowser(text, activeMode, turn);
  }

  async function sendLegacy(query: string, activeMode: KataraMode, turn: number) {
    const result = await chatKatara({
      data: { message: query, mode: activeMode, history: historyRef.current },
    });
    if (speechTurnRef.current !== turn) return;
    if (!result.ok) {
      pushItem({ kind: "note", text: result.error === "missing_key" ? KEY_NOTE : FAIL_NOTE });
      return;
    }
    const legacyHistory: ChatTurn[] = [
      ...historyRef.current,
      { role: "user", content: query },
      { role: "assistant", content: result.reply.slice(0, 600) },
    ];
    historyRef.current = legacyHistory.slice(-6);
    pushItem({ kind: "katara", text: result.reply });
    await playOneShot(result.reply, activeMode, turn);
  }

  async function readTalk(response: Response, turn: number, activeMode: KataraMode, query: string) {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";
    let bubbleId: number | null = null;
    let finishedReply: string | null = null;
    let sawError: string | null = null;

    const applyDelta = (text: string) => {
      if (speechTurnRef.current !== turn || !text) return;
      accumulated += text;
      if (bubbleId == null) {
        bubbleId = idRef.current++;
        const id = bubbleId;
        setFeed((current) => [...current, { id, kind: "katara", text }]);
        return;
      }
      const id = bubbleId;
      setFeed((current) =>
        current.map((item) =>
          item.id === id && item.kind === "katara" ? { ...item, text: item.text + text } : item,
        ),
      );
    };

    const handle = (event: TalkEvent) => {
      if (speechTurnRef.current !== turn) return;
      if (event.type === "delta" && event.text) {
        applyDelta(event.text);
        return;
      }
      if (event.type === "say" && event.text) {
        sayBrowser(event.text, activeMode, turn);
        return;
      }
      if (event.type === "pcm" && event.audioBase64) {
        ensurePlayback().pushPcm(event.audioBase64, event.sampleRate ?? 24000, event.sentence);
        return;
      }
      if (event.type === "mp3" && event.audioBase64) {
        ensurePlayback().pushMp3(event.audioBase64);
        return;
      }
      if (event.type === "clip" && event.sentence != null) {
        const { bbox, size } = event;
        if (bbox?.length !== 4 || size?.length !== 2) return;
        setSynced(true);
        ensurePlayback().startClip(event.sentence, {
          fps: event.fps ?? 25,
          bbox: [bbox[0], bbox[1], bbox[2], bbox[3]],
          size: [size[0], size[1]],
        });
        return;
      }
      if (event.type === "frames" && event.sentence != null && event.jpegs) {
        ensurePlayback().pushFrames(event.sentence, event.start ?? 0, event.jpegs);
        return;
      }
      if (event.type === "clipend" && event.sentence != null) {
        ensurePlayback().endClip(event.sentence, event.ok === true);
        return;
      }
      if (event.type === "done" && event.reply) {
        playbackRef.current?.seal();
        finishedReply = event.reply;
        if (bubbleId == null) applyDelta(event.reply);
        else {
          const id = bubbleId;
          const reply = event.reply;
          setFeed((current) => current.map((item) => (item.id === id ? { ...item, text: reply } : item)));
        }
        return;
      }
      if (event.type === "error" && event.error) sawError = event.error;
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";
        for (const block of blocks) {
          const line = block.split(/\r?\n/).find((entry) => entry.startsWith("data:"));
          if (!line) continue;
          try {
            handle(JSON.parse(line.slice(5).trim()) as TalkEvent);
          } catch {
            // Ignore a malformed event and keep the rest of the reply.
          }
        }
      }
    } finally {
      if (speechTurnRef.current === turn) playbackRef.current?.seal();
    }

    if (speechTurnRef.current !== turn) return;
    const reply = (finishedReply ?? accumulated).trim();
    if (reply) {
      const nextHistory: ChatTurn[] = [
        ...historyRef.current,
        { role: "user", content: query },
        { role: "assistant", content: reply.slice(0, 600) },
      ];
      historyRef.current = nextHistory.slice(-6);
    } else if (sawError === "missing_key") {
      pushItem({ kind: "note", text: KEY_NOTE });
    } else {
      pushItem({ kind: "note", text: FAIL_NOTE });
    }
  }

  async function sendMessage(text: string) {
    const query = text.trim();
    if (!query || busyRef.current) return;
    const activeMode = modeRef.current;
    stopSpeech();
    const turn = speechTurnRef.current;
    const abort = new AbortController();
    talkAbortRef.current = abort;
    ensurePlayback().begin();
    busyRef.current = true;
    setDraft("");
    setBusy(true);
    pushItem({ kind: "user", text: query });

    try {
      const response = await fetch("/api/katara/talk", {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          mode: activeMode,
          history: historyRef.current,
        }),
        signal: abort.signal,
      });
      if (speechTurnRef.current !== turn) return;
      if (response.status === 404 || response.status === 405) {
        await sendLegacy(query, activeMode, turn);
        return;
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !response.body || !contentType.includes("text/event-stream")) {
        pushItem({ kind: "note", text: FAIL_NOTE });
        return;
      }
      await readTalk(response, turn, activeMode, query);
    } catch (error) {
      if (speechTurnRef.current !== turn) return;
      if (error instanceof Error && error.name === "AbortError") return;
      pushItem({ kind: "note", text: FAIL_NOTE });
    } finally {
      if (speechTurnRef.current === turn) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ensurePlayback().prime();
    void sendMessage(draft);
  }

  function toggleVoice() {
    ensurePlayback().prime();
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
    <section className={`host-stage host-stage-${mode} host-stage-${variant}`}>
      <div className="host-look">
        <div className="host-modes" role="group" aria-label="Katara mode">
          {(Object.keys(MODES) as KataraMode[]).map((key) => (
            <button
              aria-pressed={mode === key}
              className="host-mode"
              data-mode={key}
              key={key}
              onClick={() => switchMode(key)}
              type="button"
            >
              {MODES[key].label}
            </button>
          ))}
        </div>
        <figure
          className={`host-portrait${talking && !synced ? " is-talking" : ""}`}
          data-mode={mode}
        >
          <img
            alt={talking ? `Katara speaking in ${look.label} mode` : `Katara in ${look.label} mode`}
            className={talking || variant === "dock" ? "is-face" : undefined}
            src={talking || variant === "dock" ? look.face : look.image}
          />
          <canvas aria-hidden="true" className="host-lips" hidden={!talking} ref={lipsRef} />
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
            placeholder={busy ? "Katara is talking..." : "Ask for a bowl by mood or flavor"}
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
