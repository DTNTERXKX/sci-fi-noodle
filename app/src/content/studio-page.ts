// /studio copy and placeholders (The ONE CREW Method, OCM kit page).
// Sources: AUTHORS_GUILD/BOOKS/ONECREW/OCM/06_FUNNEL/OCM_FUNNEL_AND_UPSELL.md,
// 05_PUBLISH_KIT/OCM_KDP_LISTING.md, 06_FUNNEL/OCM_STUDIO_BLUEPRINT.html, OCM_PRICING_2026-11.md.
// PLACEHOLDERS: Brien fills every {TOKEN} below before deploy. No placeholder may ship.
// Refunds (Brien, OCM LOCKS Nov 11): kits = 14-day money back, no questions asked; done-with-you = full refund or reschedule before the call.

export const STUDIO_LINKS = {
  amazon: "{AMAZON_URL}",
  payhipPromptPack: "{PAYHIP_PROMPT_PACK_URL}",
  payhipStudioBox: "{PAYHIP_STUDIO_BOX_URL}",
  booking: "{BOOKING_URL}",
  mailerliteForm: "https://assets.mailerlite.com/jsonp/2789378/forms/203909266481874909/subscribe",
} as const;

export const STUDIO_KIT_GUARANTEE = "14-Day Money Back Guarantee - No Questions Asked";
export const STUDIO_SETUP_REFUND =
  "Full refund or reschedule any time before your call; final once the call happens.";
export const STUDIO_BUSINESS_ADDRESS = "{BUSINESS_ADDRESS}";

export const STUDIO_PAGE = {
  title: "Build Your Own AI Film Studio | SCI-FI NOODLES",
  description:
    "Build Your Own AI Film Studio: The Complete Start-Up Guide to the Tools, Real Costs, Crew, Rules and Hard-Won Lessons That Turn Prompts Into Finished Films",
  kicker: "The ONE CREW Method · Studio",
  headline: "Build Your Own AI Film Studio",
  lede:
    "The Complete Start-Up Guide to the Tools, Real Costs, Crew, Rules and Hard-Won Lessons That Turn Prompts Into Finished Films",
  coverAlt:
    "Book cover for The ONE CREW Method: a dark clapperboard on a wooden desk beside a keyboard, lit by an amber lamp.",
};

export const STUDIO_NAV = [
  { href: "#blueprint", label: "Studio Blueprint" },
  { href: "#book", label: "The book" },
  { href: "#kit", label: "Prompt Pack" },
  { href: "#setup", label: "Done-with-you" },
  { href: "#faq", label: "FAQ" },
];

export const STUDIO_BLUEPRINT = {
  kicker: "Free tool",
  headline: "Studio Blueprint",
  intro:
    "Twelve questions. You get your stack tier, your crew size, your hardware path and the rules to switch on, so you buy what your studio needs and nothing it doesn't.",
  optinTitle: "Get the Starter Checklist + 10 studio prompts",
  optinNote:
    "We'll email your blueprint, the one-page checklist and ten prompts from the ONE CREW Prompt Pack.",
  stackNote: "(prices as of November 2026; verify before you buy)",
  coreNote:
    "Core is always on: lock files and job sheets, anchor first, text-free frames, stills first, credit guard and QA, file naming, native audio first, a living world.",
};

export const STUDIO_BOOK = {
  headline: "The ONE CREW Method",
  author: "by Brien Bell",
  blurb: [
    "You don't need a film crew. You need a crew that never forgets.",
    "This book hands you that system, step by step, and lets you shape it to your own work.",
  ],
  formats: "Available as an ebook and a paperback.",
  cta: "Get the book on Amazon",
};

export const STUDIO_PRODUCTS = [
  {
    id: "prompt-pack",
    name: "ONE CREW Prompt Pack",
    price: "$47",
    headline: "150+ prompts from a working AI film studio. Copy, fill the slots, ship.",
    sub:
      "The same skeletons ONE CREW uses for scripts, style locks, sheets, plates, keyframes, video cards, sound, QA and release copy, cleaned up so they work in your studio.",
    inside: [
      "Studio Brain: 12 crew-role system prompts (producer, writer, prompt director, QA critic and more)",
      "Story: loglines to AI-shootable scripts with 5-second beats and state ledgers",
      "Look development: style modules, anchors, turnarounds, empty-set plates, prop realism seeds",
      "Keyframes and reference lists that keep characters on model",
      "Video cards for Seedance-style, MiniMax H3, LTX, Runway and generic engines, plus 25+ \"weak line → fixed line\" repairs",
      "Sound: voice locks, music cues, ambience beds, mix briefs",
      "QA: SHIP / FIX / REDO prompts for every stage",
      "Publish: titles, descriptions, social posts, Made for Kids copy, AI disclosure lines",
      "Five lane packs, filled in end to end",
    ],
    note: "",
    guarantee: STUDIO_KIT_GUARANTEE,
    cta: "Get the Prompt Pack — $47",
    href: STUDIO_LINKS.payhipPromptPack,
  },
  {
    id: "studio-box",
    name: "Studio-in-a-Box",
    price: "$197",
    headline: "Install a full AI film crew in an afternoon.",
    sub:
      "The files that run ONE CREW, made generic for your studio: rule files, lock and job-sheet templates, 13 agent files, naming standard, ledgers, scripts, eight setup guides and the Prompt Pack.",
    inside: [
      "Studio rule file (CLAUDE.md) with on/off modules: kids, live action, animation, action previs, ASMR, documentary, credit guard, 4K",
      "13 crew agents ready for Claude Code: producer, writer, art director, continuity, prompt director, QA critic, render wrangler, job reporter, editor, audio, growth, ops, librarian",
      "Prompt, submit and post rule files, each rule with the mistake it was born from",
      "Templates: brief, LOCKS, job sheet, style lock, content summary, social pack, cuts log, QA checklists, ledger CSV",
      "Scripts: new-project scaffold, ledger sum (spend by project and platform)",
      "Setup guides: accounts and purchases, studio brain, folders and names, hiring the crew, local GPU video, post stack, first film in 7 days, customize your studio",
      "The full Prompt Pack (a $47 value)",
    ],
    note: "Already own the Prompt Pack? Your $47 comes off for 14 days.",
    guarantee: STUDIO_KIT_GUARANTEE,
    cta: "Get Studio-in-a-Box — $197",
    href: STUDIO_LINKS.payhipStudioBox,
  },
];

export const STUDIO_SETUP = {
  headline: "We set up your studio with you, live.",
  intro:
    "Before the call: you take the Studio Blueprint quiz and send three sample prompts. On the call (90 min, screen share): we install Claude Code, your folders, your rule file, your crew, and run one card from script to job sheet together. After: your custom blueprint PDF.",
  tiers: [
    {
      id: "setup",
      name: "Done-with-you setup",
      price: "$497",
      sub: "90-min call, custom Studio Blueprint, your CLAUDE.md + crew installed live",
      refund: STUDIO_SETUP_REFUND,
      cta: "Book the $497 setup",
    },
    {
      id: "setup-qa",
      name: "Done-with-you + QA",
      price: "$997",
      sub: "Done-with-you + 30 days of async QA on your first film's cards",
      note: "The $997 tier adds 30 days of QA on your first film's cards (async, 48 h turnaround).",
      refund: STUDIO_SETUP_REFUND,
      cta: "Book the $997 setup",
    },
  ],
};

export const STUDIO_FAQ: { q: string; a: string }[] = [
  {
    q: "What do I get with the Prompt Pack?",
    a: "150+ prompts across studio roles, story, look development, keyframes, video cards, sound, QA and publishing, plus five lane packs filled in end to end.",
  },
  {
    q: "What does Studio-in-a-Box add?",
    a: "The rule file, lock and job-sheet templates, 13 crew agent files, the naming standard, ledgers, scripts and eight setup guides, with the full Prompt Pack included.",
  },
  {
    q: "Do I need a graphics card?",
    a: "No. The Studio Blueprint sizes your hardware path: cloud only, a 16 GB card, or a 32 GB card. A cloud-only studio runs on cloud credits and free editing tools.",
  },
  {
    q: "What does a studio cost each month?",
    a: "Starting stacks from the Studio Blueprint: Lean $45–$79 a month, Working about $286, Flagship about $641 before packs. Prices as of November 2026; verify before you buy.",
  },
  {
    q: "Can I upgrade from the Prompt Pack?",
    a: "Yes. Prompt Pack buyers get $47 off Studio-in-a-Box for 14 days.",
  },
  {
    q: "Who owns what I make?",
    a: "We claim no rights in what you make. Your rights depend on each tool's terms and your local law.",
  },
  {
    q: "Is the content made with AI?",
    a: "Yes. Created with AI assistance; every rule tested in production.",
  },
  {
    q: "What about refunds on the book?",
    a: "Amazon book refunds follow Amazon's policy.",
  },
];

export const STUDIO_GUARANTEE = {
  headline: "Guarantee",
  kit: STUDIO_KIT_GUARANTEE,
  setup: STUDIO_SETUP_REFUND,
};

export const STUDIO_FOOTER = {
  byline: "From The ONE CREW Method by Brien Bell. Tool names belong to their owners; no endorsement implied.",
  ai: "Created with AI assistance; every rule tested in production.",
  rights: "© 2026 NVESTED REALITY LLC. All rights reserved.",
  address: STUDIO_BUSINESS_ADDRESS,
};
