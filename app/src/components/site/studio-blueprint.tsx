import { useRef, useState } from "react";

import { STUDIO_BLUEPRINT, STUDIO_LINKS } from "@/content/studio-page";

// Ported from OCM_STUDIO_BLUEPRINT.html. Questions, options, scoring, stacks and copy are unchanged.
const Q: [string, string, string[]][] = [
  ["Your lane", "Which lane is your main one?", ["Kids animation", "Cinematic series", "Faceless / documentary", "UGC / ads", "Music video / ASMR / ambience"]],
  ["Audience age", "Who is your main viewer?", ["Under 7", "7 to 12", "13 and up"]],
  ["Main aspect", "Where will most people watch?", ["Widescreen 16:9 (YouTube, TV)", "Vertical 9:16 (Shorts, TikTok, Reels)", "Both, about equally"]],
  ["Monthly tool budget", "What can you spend each month on tools and credits?", ["Under $100", "$100 to $450", "Over $450"]],
  ["Hardware", "What graphics card do you have, or will buy in the next three months?", ["None, or a laptop", "A 16 GB card (RTX 5070 Ti or 5080 class)", "A 32 GB card (RTX 5090 class)"]],
  ["Hours per week", "How many hours a week will you put in?", ["Under 10", "10 to 25", "Over 25"]],
  ["Who's in the studio", "How many people?", ["Just me", "Two of us", "Three or more"]],
  ["Voices", "What voices does your work need?", ["None (music or ambience only)", "A narrator only", "Characters speaking on screen"]],
  ["Music", "What music does your work need?", ["None, or a simple bed", "Score and cues timed to the picture", "Songs with lyrics people need to understand"]],
  ["Action level", "How much physical action is on screen?", ["Calm: talking, walking, scenery", "Some: running, chases, objects knocked over", "Heavy: fights, crowds, vehicles, a moving camera through several actors"]],
  ["Release cadence", "How often will you publish?", ["Monthly or less", "Every week or two", "Several times a week"]],
  ["Revenue goal", "What do you want this to be in 12 months?", ["A hobby, or a skill I'm learning", "Side income", "My main income"]],
];
const LETTERS = "ABCDE";
const pts = (v: number) => Math.min(v, 2) + 1; // A=1 B=2 C=3
const TIERS = ["Lean", "Working", "Flagship"];
const CREWS = [4, 8, 13];
const CREWLIST: Record<number, string> = {
  4: "Writer, Prompt Director, QA Critic, Editor. You are the producer, wrangler and continuity desk.",
  8: "Writer, Prompt Director, QA Critic, Editor, Continuity / Art, Render Wrangler, Audio, Producer.",
  13: "Writer, Prompt Director, QA Critic, Editor, Continuity / Art, Render Wrangler, Audio, Producer, Art Director, Job Reporter, Growth, Ops, Librarian.",
};
const STACK: Record<string, [string, string][]> = {
  Lean: [["Studio brain · Claude Pro", "$20"], ["Images + cloud video · Higgsfield Starter or Plus", "$15–$49"], ["Music · Suno Pro", "$10"], ["Edit, previs, audio, design · Resolve free, Blender, ffmpeg + open-source audio, Figma free", "$0"], ["Total", "$45–$79/mo"]],
  Working: [["Studio brain · Claude Max 5x", "$100"], ["Images + cloud video · Higgsfield Ultra (3,000 credits)", "$129"], ["Narrator voice · ElevenLabs Creator", "$22"], ["Music · Suno Pro", "$10"], ["4K upscale · Topaz Video (~$299/yr)", "~$25"], ["Edit, previs, audio, design · free tools", "$0"], ["Total", "~$286/mo"]],
  Flagship: [["Studio brain · Claude Max 20x", "$200"], ["Images + cloud video · Higgsfield Ultra + packs", "$129 + packs"], ["Second cloud engine · Runway Pro", "$35"], ["Music · Suno Premier", "$30"], ["Narrator voice · ElevenLabs Creator", "$22"], ["4K upscale · Topaz Studio (~$399/yr)", "~$33"], ["Edit + grade · Resolve Studio ($295 once, over 12 mo)", "~$25"], ["Local video · RTX 5090 class (MSRP $1,999, over 12 mo)", "~$167"], ["Total", "~$641 before packs; $700+ with packs"]],
};
const HW: [string, string][] = [
  ["Cloud only", "All video from cloud credits; your computer edits."],
  ["Mid GPU", "Fast local drafts and volume; slower top-quality local video at short lengths."],
  ["High GPU", "Top-quality local video at 720p class; overnight batches; cloud for hero shots."],
];

type Blueprint = {
  tier: number;
  ts: number;
  capped: boolean;
  crew: number;
  cs: number;
  dropped: boolean;
  mods: string[];
  flags: string[];
  next: string[];
  hw: [string, string];
  json: string;
};

/** Scoring identical to the source quiz. `a` holds one option index (0-based) per question. */
export function scoreBlueprint(a: number[]): Blueprint {
  const p = (i: number) => pts(a[i]);
  const ts = p(3) + p(5) + p(9) + p(10) + p(11);
  let tier = ts <= 8 ? 0 : ts <= 11 ? 1 : 2;
  const cap = a[3] === 0 ? 0 : a[3] === 1 ? 1 : 2;
  const capped = tier > cap;
  tier = Math.min(tier, cap);
  const cs = p(5) + p(6) + p(10);
  let crew = cs <= 4 ? 0 : cs <= 7 ? 1 : 2;
  let dropped = false;
  if (crew > tier) {
    crew = Math.max(crew - 1, 0);
    dropped = true;
  }
  const mods: string[] = [];
  const m = (c: boolean, n: string) => {
    if (c) mods.push(n);
  };
  m(a[0] === 0 || a[1] <= 1, "Made for Kids");
  m(a[1] === 0, "Joy lock");
  m(a[0] === 0, "Animated motion");
  m(a[0] === 1, "Live-action performance (if photoreal)");
  m(a[2] >= 1, "Short-form hooks");
  m(a[7] === 1, "Narrator");
  m(a[7] === 2, "Voice locks");
  m(a[8] >= 1, "Music cues");
  m(a[8] === 2, "Clear lyrics");
  m(a[9] >= 1, "Action");
  m(a[9] >= 1 && a[0] !== 0, "Consequence");
  m(a[9] === 2, "Previs");
  m(a[0] === 4, "Loop build");

  const flags: string[] = [];
  if (a[4] === 0 && (a[9] === 2 || a[10] === 2))
    flags.push("Put a GPU on your six-month list: heavy action and a fast schedule eat cloud credits, and a local clip costs only power.");
  if (a[0] === 0) flags.push("Kids lane: copy speaks to parents, never to children. Master at -16 LUFS.");
  if (a[9] === 2) flags.push("Heavy action: block every fight or chase in free 3D before any paid frame.");
  flags.push("Price the kept shot, not the generation. Confirm your look on one anchor image before you buy a hundred.");

  const next = [
    "Buy only the " + TIERS[tier] + " stack above. Skip everything else for 30 days.",
    "Make your studio folder and one LOCKS.md file before your first prompt (Chapters 5 and 7).",
    "Install the " + CREWS[crew] + "-agent crew and generate one style anchor image. Get a yes on the look before anything else.",
  ];

  const json = JSON.stringify({
    answers: a.map((v) => LETTERS[v]).join(""),
    tier: TIERS[tier],
    crew: CREWS[crew],
    hardware: HW[a[4]][0],
    modules: mods,
  });

  return { tier, ts, capped, crew: CREWS[crew] as number, cs, dropped, mods, flags, next, hw: HW[a[4]], json };
}

export function StudioBlueprint() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => Q.map(() => null));
  const [result, setResult] = useState<Blueprint | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const answered = answers.filter((v) => v !== null).length;

  function choose(i: number, j: number) {
    setAnswers((prev) => prev.map((v, k) => (k === i ? j : v)));
  }

  function build() {
    const next = scoreBlueprint(answers as number[]);
    setResult(next);
    setSubscribed(false);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  function again() {
    setAnswers(Q.map(() => null));
    setResult(null);
    window.scrollTo(0, 0);
  }

  return (
    <div className="studio-blueprint">
      <div className="studio-progress">
        <div className="studio-bar" aria-hidden="true">
          <i style={{ width: `${(answered / 12) * 100}%` }} />
        </div>
        <p className="studio-count">{answered} of 12 answered</p>
      </div>

      <form className="studio-quiz" onSubmit={(e) => e.preventDefault()}>
        {Q.map(([label, question, options], i) => (
          <fieldset className="studio-q" key={label}>
            <legend>
              <span>Q{i + 1}</span> {label}
            </legend>
            <p className="studio-q-question">{question}</p>
            <div className="studio-opts">
              {options.map((option, j) => (
                <label key={option}>
                  <input
                    checked={answers[i] === j}
                    name={`studio-q${i}`}
                    onChange={() => choose(i, j)}
                    type="radio"
                    value={j}
                  />
                  <b>{LETTERS[j]}</b>
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </form>

      <div className="studio-actions">
        <button className="cta-join" disabled={answered < 12} onClick={build} type="button">
          Build my blueprint
        </button>
      </div>

      {result ? (
        <section aria-live="polite" className="studio-result" id="result" ref={resultRef}>
          <h3>Your blueprint</h3>
          <div className="studio-stats">
            <div className="studio-stat">
              <small>Stack tier</small>
              <strong>{TIERS[result.tier]}</strong>
              <em>{`score ${result.ts}/15`}{result.capped ? " · held by your budget" : ""}</em>
            </div>
            <div className="studio-stat">
              <small>Crew</small>
              <strong>{`${result.crew} agents`}</strong>
              <em>{`score ${result.cs}/9`}{result.dropped ? " · one size down to match your plan" : ""}</em>
            </div>
            <div className="studio-stat">
              <small>Hardware</small>
              <strong>{result.hw[0]}</strong>
              <em>{result.hw[1]}</em>
            </div>
          </div>
          <div className="studio-panel">
            <h4>Your crew</h4>
            <p>{CREWLIST[result.crew]}</p>
          </div>
          <div className="studio-panel">
            <h4>
              Starting stack <span className="studio-note">{STUDIO_BLUEPRINT.stackNote}</span>
            </h4>
            <table className="studio-table">
              <tbody>
                {STACK[TIERS[result.tier]].map((row) => (
                  <tr className={row[0] === "Total" ? "total" : undefined} key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="studio-panel">
            <h4>Rule modules</h4>
            <div className="studio-chips">
              {(result.mods.length ? result.mods : ["Core only"]).map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            <p className="studio-note">{STUDIO_BLUEPRINT.coreNote}</p>
          </div>
          <div className="studio-panel studio-flag">
            <h4>Watch for</h4>
            {result.flags.map((f) => (
              <p key={f}>{f}</p>
            ))}
          </div>
          <div className="studio-panel">
            <h4>Next three moves</h4>
            <ol>
              {result.next.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
          <div className="studio-panel">
            <h4>{STUDIO_BLUEPRINT.optinTitle}</h4>
            <p className="studio-note">{STUDIO_BLUEPRINT.optinNote}</p>
            {subscribed ? (
              <p className="studio-note" role="status">
                {STUDIO_BLUEPRINT.optinNote}
              </p>
            ) : (
              // MailerLite custom field: Brien must create a text custom field named "blueprint"
              // in MailerLite, or the blueprint value is dropped.
              <form
                action={STUDIO_LINKS.mailerliteForm}
                className="studio-optin"
                method="post"
                onSubmit={() => setSubscribed(true)}
                target="studio-mailerlite-frame"
              >
                <label className="sr-only" htmlFor="studio-email">
                  Email
                </label>
                <input id="studio-email" name="fields[email]" placeholder="you@example.com" required type="email" />
                <input name="ml-submit" type="hidden" value="1" />
                <input name="anticsrf" type="hidden" value="true" />
                <input name="fields[blueprint]" type="hidden" value={result.json} />
                <button className="cta-join" type="submit">
                  Send it
                </button>
              </form>
            )}
            <iframe
              name="studio-mailerlite-frame"
              style={{ display: "none" }}
              tabIndex={-1}
              title="Subscribe"
            />

          </div>
          <div className="studio-actions">
            <button className="cta-note" onClick={() => window.print()} type="button">
              Print / save PDF
            </button>
            <button className="cta-note" onClick={again} type="button">
              Start over
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
