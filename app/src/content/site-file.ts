import rawSiteSegments from "./site-segments.json";

export type SiteSegment = {
  id: string;
  page: string;
  source: string;
  kind: string;
  locked: Record<string, unknown>;
  copy: Record<string, unknown>;
};

export type SiteFile = {
  version: number;
  exported?: string;
  site?: string;
  note?: string;
  instructions?: string[];
  images?: unknown;
  segmentCount: number;
  segments: SiteSegment[];
};

declare global {
  interface Window {
    __SITE_SEGMENTS__?: SiteFile;
  }
}

type SegmentReader = () => SiteFile;

function segmentReader(): SegmentReader | undefined {
  return (globalThis as { __readSiteSegments?: SegmentReader }).__readSiteSegments;
}

export function normalizeSiteFile(input: unknown): SiteFile {
  if (!input || typeof input !== "object") throw new Error("site-segments.json is not an object");
  const file = input as SiteFile;
  if (!Array.isArray(file.segments)) throw new Error("site-segments.json is missing segments");
  if (file.segmentCount !== file.segments.length) {
    throw new Error(
      `site-segments.json segmentCount (${file.segmentCount}) must equal segments.length (${file.segments.length})`,
    );
  }
  return file;
}

let embedded: SiteFile | null = null;

function embeddedSiteFile(): SiteFile {
  if (!embedded) embedded = normalizeSiteFile(rawSiteSegments);
  return embedded;
}

/**
 * Live site copy.
 * Local dev, on the server: re-read the JSON from disk (see site-segments-disk.server.ts).
 * Local dev, in the browser: the snapshot the server embedded for this page.
 * Production: the same JSON bundled at build time.
 */
export function loadSiteSegments(): SiteFile {
  if (import.meta.env.DEV && typeof window === "undefined") {
    const read = segmentReader();
    if (read) return read();
  }
  if (import.meta.env.DEV && typeof window !== "undefined" && window.__SITE_SEGMENTS__) {
    return window.__SITE_SEGMENTS__;
  }
  return embeddedSiteFile();
}

export function segmentById(id: string): SiteSegment | undefined {
  return loadSiteSegments().segments.find((segment) => segment.id === id);
}

export function segmentCopy(id: string): Record<string, unknown> {
  return segmentById(id)?.copy ?? {};
}

export function segmentLocked(id: string): Record<string, unknown> {
  return segmentById(id)?.locked ?? {};
}

export function copyString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

export function copyStrings(source: Record<string, unknown>, key: string): string[] {
  const value = source[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function pageMeta(id: string) {
  const copy = segmentCopy(id);
  return {
    title: copyString(copy, "title"),
    description: copyString(copy, "description"),
    header: copyString(copy, "header"),
    subtitle: copyString(copy, "subtitle"),
    paragraphs: copyStrings(copy, "paragraphs"),
    checks: copyStrings(copy, "checks"),
    cta: copyString(copy, "cta"),
  };
}

export function liveArray<T>(read: () => readonly T[]): T[] {
  return new Proxy([] as T[], {
    get(_target, prop) {
      const value = read() as unknown as Record<PropertyKey, unknown>;
      const item = value[prop];
      return typeof item === "function" ? (item as (...args: unknown[]) => unknown).bind(value) : item;
    },
    set() {
      return false;
    },
    has(_target, prop) {
      return prop in (read() as object);
    },
    ownKeys() {
      return Reflect.ownKeys(read() as object);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const value = read() as unknown as Record<PropertyKey, unknown>;
      if (!Object.prototype.hasOwnProperty.call(value, prop)) return undefined;
      return {
        configurable: true,
        enumerable: prop !== "length",
        writable: false,
        value: value[prop],
      };
    },
  });
}

export function liveObject<T extends object>(read: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const value = read() as unknown as Record<PropertyKey, unknown>;
      const item = value[prop];
      return typeof item === "function" ? (item as (...args: unknown[]) => unknown).bind(value) : item;
    },
    set() {
      return false;
    },
    has(_target, prop) {
      return prop in (read() as object);
    },
    ownKeys() {
      return Reflect.ownKeys(read() as object);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const value = read() as unknown as Record<PropertyKey, unknown>;
      if (!Object.prototype.hasOwnProperty.call(value, prop)) return undefined;
      return { configurable: true, enumerable: true, writable: false, value: value[prop] };
    },
  });
}
