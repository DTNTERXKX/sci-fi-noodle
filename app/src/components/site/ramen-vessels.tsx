import { useId, type CSSProperties, type ReactElement } from "react";

import type { BowlId } from "@/content/catalog";

/*
 * One vessel per bowl on the Cosmic Ramen menu. Each is a different object with its own
 * silhouette, so the six read apart in grayscale. Colors come from site.css classes that
 * resolve the bowl's --flavor-* tokens; nothing here carries a literal color.
 */

const paint = (id: string): CSSProperties => ({ fill: `url(#${id})` });

/** 01 Black Hole Tonkotsu: a deep, heavy obsidian donburi with an event-horizon broth. */
function BlackHoleVessel() {
  const id = useId();
  return (
    <>
      <defs>
        <radialGradient cx="50%" cy="50%" id={`${id}b`} r="55%">
          <stop className="v-stop-void" offset="0%" />
          <stop className="v-stop-void" offset="22%" />
          <stop className="v-stop-deep" offset="55%" />
          <stop className="v-stop-glow" offset="100%" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" x2="1" y1="0" y2="0">
          <stop className="v-stop-sheen" offset="0%" />
          <stop className="v-stop-deep" offset="32%" />
          <stop className="v-stop-void" offset="100%" />
        </linearGradient>
      </defs>
      <g className="v-steam v-steam-gravity">
        <path d="M86 58c-8-12 8-20 2-32s10-18 22-16" />
        <path d="M154 58c8-12-8-20-2-32s-10-18-22-16" />
      </g>
      <path className="v-solid" d="M92 150l5 16h46l5-16" />
      <path className="v-solid" d="M34 84c2 46 38 72 86 72s84-26 86-72" style={paint(`${id}s`)} />
      <path className="v-specular" d="M48 100c4 24 18 38 38 46" />
      <path className="v-specular v-specular-soft" d="M58 98c3 16 12 26 24 32" />
      <ellipse className="v-rim" cx="120" cy="84" rx="86" ry="19" />
      <path className="v-rim-lip" d="M42 80c18-10 48-15 78-15" />
      <ellipse cx="120" cy="85" rx="76" ry="14" style={paint(`${id}b`)} />
      <ellipse className="v-accretion" cx="120" cy="85" rx="58" ry="9.6" />
      <ellipse className="v-accretion v-accretion-inner" cx="120" cy="85" rx="34" ry="5.4" />
      <g className="v-noodles">
        <path d="M56 86c12-10 42-13 58-6 8 3 8 8 1 8" />
        <path d="M184 84c-12 10-42 13-58 6-8-3-8-8-1-8" />
        <path d="M80 93c16 5 38 3 42-4" />
      </g>
      <ellipse className="v-void" cx="120" cy="85" rx="11" ry="3.2" />
      <g className="v-chopsticks">
        <path d="M138 62l94 38" />
        <path d="M144 57l92 34" />
      </g>
    </>
  );
}

/** 02 Timewarp Shoyu: a riveted copper lunch tin, its clock-gear lid lifted off the egg. */
function TimewarpVessel() {
  const id = useId();
  return (
    <>
      <defs>
        <linearGradient id={`${id}c`} x1="0" x2="1" y1="0" y2="0">
          <stop className="v-stop-deep" offset="0%" />
          <stop className="v-stop-metal" offset="30%" />
          <stop className="v-stop-glow" offset="48%" />
          <stop className="v-stop-metal" offset="66%" />
          <stop className="v-stop-deep" offset="100%" />
        </linearGradient>
        <radialGradient cx="50%" cy="45%" id={`${id}k`} r="60%">
          <stop className="v-stop-glow" offset="0%" />
          <stop className="v-stop-deep" offset="100%" />
        </radialGradient>
      </defs>
      <g className="v-steam v-steam-side">
        <path d="M58 94c-10-2-14-8-24-6s-12-6-20-4" />
        <path d="M182 92c10-2 14-8 24-6s12-6 20-4" />
      </g>
      <path className="v-solid v-copper" d="M54 98v50c0 10 30 17 66 17s66-7 66-17V98" style={paint(`${id}c`)} />
      <path className="v-band" d="M54 114c0 10 30 17 66 17s66-7 66-17" />
      <path className="v-patina" d="M54 128c0 10 30 17 66 17s66-7 66-17" />
      <path className="v-band" d="M54 141c0 10 30 17 66 17s66-7 66-17" />
      <g className="v-rivets">
        <circle cx="62" cy="121" r="1.8" />
        <circle cx="90" cy="128" r="1.8" />
        <circle cx="120" cy="131" r="1.8" />
        <circle cx="150" cy="128" r="1.8" />
        <circle cx="178" cy="121" r="1.8" />
        <circle cx="62" cy="148" r="1.8" />
        <circle cx="90" cy="155" r="1.8" />
        <circle cx="120" cy="158" r="1.8" />
        <circle cx="150" cy="155" r="1.8" />
        <circle cx="178" cy="148" r="1.8" />
      </g>
      <path className="v-handle" d="M54 106c-12 0-13 16 0 16" />
      <path className="v-handle" d="M186 106c12 0 13 16 0 16" />
      <ellipse className="v-mouth" cx="120" cy="98" rx="66" ry="13" />
      <ellipse cx="120" cy="99" rx="58" ry="10" style={paint(`${id}k`)} />
      <g className="v-noodles v-noodle-hands">
        <path d="M120 99c-10-1-20-5-36-4" />
        <path d="M120 99c12 1 26 3 46 0" />
      </g>
      <ellipse className="v-egg" cx="120" cy="99" rx="17" ry="6.4" />
      <ellipse className="v-yolk" cx="120" cy="99" rx="8" ry="3" />
      <ellipse className="v-ticks" cx="120" cy="99" rx="13.5" ry="4.8" />
      <g className="v-lid">
        <path className="v-solid v-copper" d="M50 64v8c0 9 31 16 70 16s70-7 70-16v-8" style={paint(`${id}c`)} />
        <ellipse className="v-lid-face" cx="120" cy="64" rx="70" ry="15" />
        <ellipse className="v-gear" cx="120" cy="64" rx="34" ry="7.6" />
        <ellipse className="v-gear-inner" cx="120" cy="64" rx="27" ry="5.8" />
        <ellipse className="v-ticks" cx="120" cy="64" rx="22" ry="4.6" />
        <path className="v-clock-hand" d="M120 64l-12-2.4M120 64l17-3.4" />
        <rect className="v-latch" height="7" rx="1" width="10" x="115" y="76" />
      </g>
    </>
  );
}

/** 03 Quantum Fire Tantanmen: a folded takeout box on a wire handle, chili oil throwing sparks. */
function QuantumFireVessel() {
  const id = useId();
  return (
    <>
      <defs>
        <linearGradient id={`${id}o`} x1="0" x2="1" y1="0" y2="1">
          <stop className="v-stop-glow" offset="0%" />
          <stop className="v-stop-metal" offset="70%" />
          <stop className="v-stop-deep" offset="100%" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" x2="0" y1="0" y2="1">
          <stop className="v-stop-card" offset="0%" />
          <stop className="v-stop-deep" offset="100%" />
        </linearGradient>
      </defs>
      <path className="v-wire" d="M84 126C58 34 204 22 176 124" />
      <path className="v-flap v-flap-back" d="M114 86l68 8 8-26-70-8z" />
      <path className="v-flap v-flap-left" d="M80 100l34-14-14-22-34 14z" />
      <path className="v-oil" d="M80 100l34-14 68 8-34 14z" style={paint(`${id}o`)} />
      <g className="v-bites">
        <path d="M100 96c1-6 13-7 15-1z" />
        <path d="M132 99c1-5 11-6 13-1z" />
        <path d="M116 91c1-4 8-5 10 0z" />
      </g>
      <g className="v-chopsticks">
        <path d="M124 96l22-78" />
        <path d="M132 98l28-76" />
      </g>
      <path className="v-solid v-carton" d="M80 100l68 8-4 62-52-6z" style={paint(`${id}f`)} />
      <path className="v-solid v-carton v-carton-side" d="M148 108l34-14-12 62-26 14z" />
      <g className="v-crease">
        <path d="M80 100l18 30" />
        <path d="M148 108l-14 26" />
        <path d="M98 130l36 4" />
        <path d="M148 108l22 48" />
      </g>
      <path className="v-flap v-flap-front" d="M80 100l68 8 2 11-74-9z" />
      <path className="v-flap v-flap-right" d="M148 108l34-14 18 9-36 16z" />
      <g className="v-sparks">
        <path d="M98 70l1.2-4 1.2 4 4 1.2-4 1.2-1.2 4-1.2-4-4-1.2z" />
        <path d="M158 62l1-3.4 1 3.4 3.4 1-3.4 1-1 3.4-1-3.4-3.4-1z" />
        <path d="M112 52l.8-2.6.8 2.6 2.6.8-2.6.8-.8 2.6-.8-2.6-2.6-.8z" />
        <path d="M172 80l.8-2.6.8 2.6 2.6.8-2.6.8-.8 2.6-.8-2.6-2.6-.8z" />
        <circle cx="140" cy="74" r="1.4" />
        <circle cx="90" cy="82" r="1.1" />
      </g>
    </>
  );
}

/** 04 Nebula Miso: a wide, shallow stoneware bowl with a glaze drip and a turning nebula broth. */
function NebulaVessel() {
  const id = useId();
  return (
    <>
      <defs>
        <radialGradient cx="50%" cy="50%" id={`${id}n`} r="60%">
          <stop className="v-stop-glow" offset="0%" />
          <stop className="v-stop-metal" offset="45%" />
          <stop className="v-stop-deep" offset="100%" />
        </radialGradient>
        <radialGradient cx="50%" cy="50%" id={`${id}h`} r="50%">
          <stop className="v-stop-haze" offset="0%" />
          <stop className="v-stop-clear" offset="100%" />
        </radialGradient>
        <linearGradient id={`${id}w`} x1="0" x2="0" y1="0" y2="1">
          <stop className="v-stop-stone" offset="0%" />
          <stop className="v-stop-deep" offset="100%" />
        </linearGradient>
      </defs>
      <ellipse className="v-haze" cx="120" cy="70" rx="86" ry="22" style={paint(`${id}h`)} />
      <path className="v-solid" d="M94 130l3 8h46l3-8" />
      <path className="v-solid v-stone" d="M14 100c4 20 48 31 106 31s102-11 106-31" style={paint(`${id}w`)} />
      <g className="v-specks">
        <circle cx="46" cy="118" r=".8" />
        <circle cx="74" cy="125" r=".8" />
        <circle cx="168" cy="124" r=".8" />
        <circle cx="196" cy="116" r=".8" />
        <circle cx="132" cy="128" r=".8" />
      </g>
      <path className="v-glaze" d="M20 107c20 11 60 16 100 16s80-5 100-16" />
      <path className="v-drip" d="M82 119.6v4.4a2.4 2.4 0 0 0 4.8 0v-3.8z" />
      <path className="v-drip" d="M138 121.8v3a2 2 0 0 0 4 0v-3.2z" />
      <path className="v-drip" d="M164 118.6v3.6a2.2 2.2 0 0 0 4.4 0v-4.2z" />
      <ellipse className="v-rim" cx="120" cy="100" rx="106" ry="20" />
      <ellipse cx="120" cy="101" rx="96" ry="16" style={paint(`${id}n`)} />
      <g transform="translate(120 101) scale(1 0.17)">
        <g className="v-swirl">
          <path className="v-arm" d="M0 0c18-24 54-30 82-10" vectorEffect="non-scaling-stroke" />
          <path className="v-arm v-arm-alt" d="M0 0c18-24 54-30 82-10" transform="rotate(120)" vectorEffect="non-scaling-stroke" />
          <path className="v-arm" d="M0 0c18-24 54-30 82-10" transform="rotate(240)" vectorEffect="non-scaling-stroke" />
          <path className="v-arm v-arm-alt" d="M10 0c10-14 34-20 52-8" transform="rotate(60)" vectorEffect="non-scaling-stroke" />
        </g>
      </g>
      <g className="v-stars">
        <path d="M84 96l.8-2.6.8 2.6 2.6.8-2.6.8-.8 2.6-.8-2.6-2.6-.8z" />
        <path d="M150 104l.7-2.2.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7z" />
        <path d="M112 92l.6-1.8.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6z" />
        <path d="M70 62l.9-2.8.9 2.8 2.8.9-2.8.9-.9 2.8-.9-2.8-2.8-.9z" />
        <path d="M168 56l.7-2.2.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7z" />
        <circle cx="128" cy="108" r=".9" />
        <circle cx="98" cy="106" r=".7" />
        <circle cx="122" cy="48" r=".9" />
      </g>
      <g className="v-spoon">
        <path d="M166 96c-2-6 6-11 16-10s16 6 12 11c-4 4-24 4-28-1z" />
        <path d="M190 88l34-30" />
      </g>
    </>
  );
}

/** 05 Zero-G Shio: an open glass dish adrift, its noodles and broth floating free above it. */
function ZeroGVessel() {
  const id = useId();
  return (
    <>
      <defs>
        <linearGradient id={`${id}g`} x1="0" x2="0" y1="0" y2="1">
          <stop className="v-stop-glass" offset="0%" />
          <stop className="v-stop-clear" offset="100%" />
        </linearGradient>
      </defs>
      <ellipse className="v-shadow" cx="120" cy="171" rx="44" ry="3.6" />
      <g className="v-float">
        <path className="v-glass" d="M58 108c0 30 28 46 62 46s62-16 62-46" style={paint(`${id}g`)} />
        <ellipse className="v-broth-glass" cx="120" cy="110" rx="54" ry="9" />
        <path className="v-refract" d="M74 116c2 14 10 25 22 31" />
        <path className="v-refract" d="M166 116c-2 14-10 25-22 31" />
        <path className="v-refract v-refract-soft" d="M100 124c2 10 8 17 16 21" />
        <ellipse className="v-rim v-rim-glass" cx="120" cy="108" rx="62" ry="13" />
        <path className="v-rim-lip" d="M66 104c14-6 34-9 54-9" />
        <g className="v-noodles v-noodle-arc">
          <path d="M80 86c6-9 12 5 18-4s12 5 18-4 12 5 18-4 12 5 18-4 12 5 16-3" transform="rotate(-4 120 84)" />
          <path d="M90 66c5-8 11 4 16-4s11 4 16-4 11 4 16-4 11 4 14-2" transform="rotate(5 120 64)" />
          <path d="M102 46c4-6 9 3 13-3s9 3 13-3 9 3 12-2" transform="rotate(-6 120 44)" />
          <path d="M72 100c2-6 6-10 10-14M168 100c-2-6-6-10-10-14" />
        </g>
        <g className="v-drops">
          <circle className="v-drop" cx="72" cy="66" r="3.2" />
          <circle className="v-drop" cx="168" cy="52" r="2.4" />
          <circle className="v-drop" cx="120" cy="30" r="2" />
          <circle className="v-drop" cx="186" cy="86" r="1.6" />
          <circle className="v-drop" cx="54" cy="90" r="1.8" />
        </g>
      </g>
      <g className="v-chopsticks v-chopsticks-float">
        <path d="M186 40l40-26" />
        <path d="M196 50l38-22" />
      </g>
    </>
  );
}

/** 06 Cyberpunk Fusion: a tall cup-noodle capsule, peeled circuit lid, holo label, live scan line. */
function CyberpunkVessel() {
  const id = useId();
  return (
    <>
      <defs>
        <linearGradient id={`${id}h`} x1="0" x2="1" y1="0" y2="0">
          <stop className="v-stop-glow" offset="0%" />
          <stop className="v-stop-metal" offset="50%" />
          <stop className="v-stop-glow" offset="100%" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" x2="1" y1="0" y2="0">
          <stop className="v-stop-sheen" offset="0%" />
          <stop className="v-stop-deep" offset="40%" />
          <stop className="v-stop-void" offset="100%" />
        </linearGradient>
        <clipPath id={`${id}k`}>
          <path d="M78 54l10 104c0 5 14 9 32 9s32-4 32-9l10-104z" />
        </clipPath>
      </defs>
      <g className="v-pixels">
        <rect height="3" width="3" x="98" y="30" />
        <rect height="2.4" width="2.4" x="110" y="20" />
        <rect height="3" width="3" x="132" y="26" />
        <rect height="2" width="2" x="122" y="12" />
      </g>
      <path className="v-solid v-capsule" d="M78 54l10 104c0 5 14 9 32 9s32-4 32-9l10-104" style={paint(`${id}c`)} />
      <path className="v-holo" d="M81.6 90c0 5 17 9 38.4 9s38.4-4 38.4-9l-3.6 38c0 5-15.6 9-34.8 9s-34.8-4-34.8-9z" style={paint(`${id}h`)} />
      <g className="v-barcode">
        <path d="M128 108v16M131 108v16M135 108v16M137 108v16M141 108v16M146 108v16M148 108v16" />
      </g>
      <path className="v-holo-chip" d="M96 110h14v10H96z" />
      <path className="v-band" d="M80 66c0 5 18 9 40 9s40-4 40-9" />
      <ellipse className="v-rim" cx="120" cy="54" rx="42" ry="9" />
      <g className="v-noodles v-noodle-tangle">
        <path d="M84 56c5-8 10 4 16-3s9 6 15-1 8 5 14-2" />
        <path d="M90 58c4-5 8 3 12-2s8 4 12-1" />
      </g>
      <g className="v-fork">
        <path d="M104 56l-8-38" />
        <path d="M91 18h10M92 18l-1-10M96 18v-10M100 18l1-10" />
      </g>
      <g className="v-lid">
        <path className="v-lid-foil" d="M124 62c16 0 32-3 38-8 6-14 0-30-14-38-10 14-18 30-24 46z" />
        <path className="v-circuit" d="M134 52l8-10h8M138 58l12-4 4-12M146 30l-4 8" />
        <circle className="v-node" cx="150" cy="42" r="1.6" />
        <circle className="v-node" cx="154" cy="42" r="1.2" />
        <circle className="v-node" cx="146" cy="30" r="1.4" />
      </g>
      <g clipPath={`url(#${id}k)`}>
        <rect className="v-scan" height="2" width="96" x="72" y="56" />
      </g>
    </>
  );
}

const vessels: Record<BowlId, () => ReactElement> = {
  "black-hole": BlackHoleVessel,
  timewarp: TimewarpVessel,
  "quantum-fire": QuantumFireVessel,
  "nebula-miso": NebulaVessel,
  "zero-g": ZeroGVessel,
  cyberpunk: CyberpunkVessel,
};

/** The full illustrated vessel for a bowl. Decorative: the surrounding card or page names the bowl. */
export function RamenVessel({ bowl, className }: { bowl: BowlId; className?: string }) {
  const Vessel = vessels[bowl];
  return (
    <svg
      aria-hidden="true"
      className={`vessel vessel-${bowl}${className ? ` ${className}` : ""}`}
      data-bowl={bowl}
      focusable="false"
      viewBox="0 0 240 180"
    >
      <Vessel />
    </svg>
  );
}

const glyphs: Record<BowlId, string[]> = {
  "black-hole": ["M3 10c0 6 4 9 9 9s9-3 9-9", "M9 19l1 2.5h4l1-2.5", "M3 10c2-1.5 5.5-2.2 9-2.2s7 .7 9 2.2", "M10.5 10h3"],
  timewarp: ["M5 12v6c0 1.6 3 2.7 7 2.7s7-1.1 7-2.7v-6", "M5 12c0 1.6 3 2.7 7 2.7s7-1.1 7-2.7", "M5 15.5c0 1.6 3 2.7 7 2.7s7-1.1 7-2.7", "M4 8.4l16-3.2", "M4 8.4l.4 1.8M20 5.2l.4 1.8"],
  "quantum-fire": ["M6 11l2 10h8l2-10z", "M6 11l-2.5-3M18 11l2.5-3", "M7 14C4 1 20 1 17 14"],
  "nebula-miso": ["M2 12.5c1 4.5 5 6.5 10 6.5s9-2 10-6.5z", "M10 19l.5 2h3l.5-2", "M8.5 12.5c1.5-2 5.5-2 7 0"],
  "zero-g": ["M6 13.5c0 4 3 6 6 6s6-2 6-6z", "M7.5 11c.5-5 8.5-5 9 0", "M9.5 22.5h5", "M5 6.5h.01M19 7.5h.01M12 3.5h.01"],
  cyberpunk: ["M7 5l1.6 16h6.8L17 5z", "M7.8 11h8.4M8.3 15h7.4", "M12 5c2-3.2 5-3.2 6-1"],
};

/** A one-line mark of the vessel, sized for chips and menus. */
export function VesselGlyph({ bowl, className }: { bowl: BowlId; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`vessel-glyph${className ? ` ${className}` : ""}`}
      data-bowl={bowl}
      focusable="false"
      viewBox="0 0 24 24"
    >
      {glyphs[bowl].map((d) => (
        <path d={d} key={d} />
      ))}
    </svg>
  );
}
