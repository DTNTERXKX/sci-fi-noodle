# CURSOR_SPEC.md · BBellWeb AI Website Builder

Build spec for Cursor (Agent mode). Work through the phases in order. One phase per session; each ends with `npm run lint` and `npm run build` passing and the acceptance checks met. Product context: `../../_OPS/DOMAINS/BBELLWEB_AI_BUILDER_SPEC.md`.

## 0. Ground rules for the agent
- **Extend, don't rewrite.** The app works today: marketing page (`src/app/page.tsx`), Stripe checkout + webhook (`src/app/api/stripe/*`), email-verified HMAC cookie session (`src/lib/session.ts`, `src/app/api/auth/verify`), and `/studio` that turns a brief into JSON (`src/app/api/generate/site/route.ts`) validated by Zod (`src/lib/site-schema.ts`) and rendered by `src/components/site-preview.tsx`.
- Stack stays: Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4, Zod v4, Stripe, OpenAI. Add only the packages named in this spec.
- **The AI never writes HTML.** It returns JSON that Zod validates; React components render it. Invalid JSON gets one automatic retry with the Zod error fed back, then a clean error.
- Server-only code (DB, Stripe, OpenAI, secrets) lives in `src/lib/server/*` with `import "server-only"`.
- Every API route: Zod-parse input, check the session, check plan limits, return `{ error }` with a proper status on failure. Match the style of the existing routes.
- No fake testimonials, reviews or stats in generated copy. Sections that need real customer data (testimonials, team) start empty with a placeholder note in the editor only, never on the published site.
- Secrets only in `.env.local`; add every new variable to `.env.example` with a comment.

## Decisions (defaults, change here if Brien decides otherwise)
| Topic | Choice |
|---|---|
| Hosting | Vercel |
| Database | Postgres on Neon, via **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`) |
| Uploads | Vercel Blob (`@vercel/blob`) |
| Email | Resend (`resend`) |
| AI | OpenAI via existing `OPENAI_MODEL`; wrap calls in `src/lib/server/ai.ts` so the provider can be swapped |
| Published sites | Multi-tenant rendering in this same app: `middleware.ts` maps `*.bbellweb.site` and custom domains to `/_sites/[host]`. No per-site deploys. |
| Custom domains | Vercel Domains API (add domain to project, show DNS records, poll verification) |
| Trial | Free preview before payment; no free trial period |
| Done-for-you | +$50/mo Stripe add-on price on Pro or Agency |

## Plans and limits (`src/lib/plans.ts`)
Add a `limits` field to each plan and use it everywhere limits are checked.

| | starter | pro | agency |
|---|---|---|---|
| sites | 1 | 3 | 1000 |
| pagesPerSite | 1 | 5 | 10 |
| chatEditsPerMonth | 20 | 1000 | 3000 |
| customDomain | false | true | true |
| blog | false | true | true |
| monthlyRefresh | false | true | true |
| htmlExport | false | false | true |

---

## Phase 1 · Database, users, saved sites
**Add:** Drizzle + Neon. `drizzle.config.ts`, `src/lib/server/db.ts`, `src/lib/server/schema.ts`, `npm run db:generate` / `db:migrate` scripts.

**Tables**
- `users`: id (uuid), email (unique, lowercase), stripe_customer_id, plan (`starter|pro|agency|null`), addon_dfy (bool), status (`active|past_due|canceled`), created_at
- `sites`: id, user_id, name, subdomain (unique), custom_domain (unique, nullable), domain_status (`none|pending|verified`), status (`draft|published|paused`), current_version_id, published_version_id, created_at, updated_at
- `site_versions`: id, site_id, spec (jsonb), source (`ai_build|ai_edit|user_edit|refresh`), note, created_at
- `uploads`: id, user_id, site_id, url, kind, created_at
- `form_submissions`: id, site_id, data (jsonb), created_at, read (bool)
- `ai_jobs`: id, user_id, site_id, kind (`build|edit|refresh`), model, input_tokens, output_tokens, cost_usd, ok (bool), created_at
- `usage_counters`: user_id, month (`YYYY-MM`), chat_edits

**Change:**
- Stripe webhook (`api/stripe/webhook`) upserts `users` (plan from price ID, status) on `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Verify the signature with `STRIPE_WEBHOOK_SECRET`.
- `api/auth/verify`: check `users` first; fall back to the existing Stripe lookup and backfill the row.
- Add `src/lib/server/auth.ts` → `requireUser()` returns the user row or throws 401.

**Acceptance:** a test-mode checkout creates a user row with the right plan; `/studio` "Save" stores a site + version; reloading `/dashboard` lists it.

## Phase 2 · Multi-page schema + section library
**Change `src/lib/site-schema.ts`** to v2 (keep the v1 types exported for migration):

```ts
SiteSpecV2 = {
  version: 2,
  brand: { name, tagline, palette: { primary, accent, bg, text } /* hex */, fontPair: FontPairId, tone: "friendly"|"premium"|"bold"|"faith", logoUrl?: string },
  seo: { title, description, city?, businessType },
  pages: Page[] // 1..10
}
Page = { slug: string /* "/" first */, title, sections: Section[] /* 1..12 */ }
```

**Sections** (discriminated union on `type`, each with `id` and `variant: "a"|"b"|"c"`):
hero · features · services (name, blurb, price?) · about · gallery (images) · testimonials (empty by default) · pricing · faq · hours (days + map address) · contact (form on/off, email, phone, address) · cta · team · logos · menu (restaurants) · events (churches) · beforeAfter · blogList · announcement.

- Components in `src/components/sections/<type>.tsx`, one file each, three variants via props. A `SectionRenderer` switches on `type`. `SitePage` renders a page with header nav (from pages) and footer.
- `fontPair` comes from a fixed list of 8 Google font pairs in `src/lib/fonts.ts`. Palettes must pass WCAG AA (text on bg ≥ 4.5:1); add `src/lib/contrast.ts` and enforce it in Zod `.refine`.
- Replace `site-preview.tsx` internals with `SitePage`; keep its export name.
- `migrateV1toV2(spec)` maps old saved specs.

**Acceptance:** a hand-written fixture for each of 6 industries (`src/fixtures/*.json`) validates and renders at 375 px and 1280 px with no horizontal scroll.

## Phase 3 · Intake + generation pipeline
**Replace the free-text brief** in `studio-client.tsx` with a 10-step intake form (one question per screen, back/next, progress bar): business name · industry (select: barber/salon, church, contractor, restaurant, coach/consultant, creator/artist, other) · city/service area · offerings (3–5 rows) · ideal customers · tone · colors (pickers or "choose for me") · logo upload · photos upload (up to 10) · main goal (calls, bookings, sales, info).

**`src/lib/server/ai.ts` pipeline** (called by `api/generate/site`):
1. `planSite(intake)` → page list + section types/variants (structured JSON).
2. `writeSite(intake, plan)` → full `SiteSpecV2`.
3. Validate with Zod; on failure retry once with the error message; then fail cleanly.
4. Fill images: uploads first, then Unsplash API (`UNSPLASH_ACCESS_KEY`) by section keyword, store attribution.
5. Log an `ai_jobs` row with token counts and cost.

System prompt rules: plain reading level (grade 8 or below), local SEO phrases used naturally, no invented facts (prices, years in business, awards, certifications) unless given in the intake, no testimonials.

**Acceptance:** intake → preview in under 60 s; 10 runs across industries all validate; cost per build logged.

## Phase 4 · Chat editing, versions, undo
- Editor layout at `/studio/[siteId]`: preview (desktop/mobile toggle) left, chat right, page tabs on top.
- `POST /api/sites/[id]/edit` `{ message }` → model returns **RFC 6902 JSON Patch** against the current spec (use `fast-json-patch`). Apply, validate, save a new `site_versions` row (`ai_edit`), return the new spec.
- Direct edits: click any text in the preview to edit inline → `user_edit` version.
- Version history drawer: list, preview, restore (creates a new version, never deletes).
- Enforce `chatEditsPerMonth` via `usage_counters`; show remaining edits.

**Acceptance:** "make the hero darker", "add an FAQ page with 5 questions", "change Saturday hours to 9–2" each work; undo restores the previous version exactly.

## Phase 5 · Publishing, subdomains, custom domains
- `middleware.ts`: if host is `<sub>.bbellweb.site` or a verified `custom_domain`, rewrite to `/_sites/[host]/[[...slug]]`. Main-domain traffic is untouched.
- `/_sites/[host]/[[...slug]]/page.tsx`: load `published_version_id` spec, render `SitePage`, `generateMetadata` from `seo`, ISR with `revalidateTag(siteId)` on publish. Add `sitemap.xml`, `robots.txt` and LocalBusiness JSON-LD per site.
- Paused sites render a neutral "This site is temporarily unavailable" page.
- Publish button: copies `current_version_id` → `published_version_id`, revalidates.
- Custom domains (Pro+): `POST /api/sites/[id]/domain` calls Vercel's add-domain API (`VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`), shows required DNS records, `GET` polls verification and updates `domain_status`. SSL is automatic on Vercel.
- Contact forms on published sites → `POST /api/forms/[siteId]` (honeypot + rate limit per IP) → `form_submissions` + Resend email to the owner.

**Acceptance:** a published site loads at `https://<sub>.bbellweb.site` and at a test custom domain with SSL; form submission arrives by email and in the dashboard inbox.

## Phase 6 · Dashboard, billing, limits
- `/dashboard`: site cards (status, domain, last edit), new site (respects `sites` limit), forms inbox, plan + usage, "Manage billing" → Stripe Customer Portal.
- Upgrade prompts when a limit blocks an action (pages, sites, custom domain, edits).
- Done-for-you add-on: `STRIPE_PRICE_DFY` as a second subscription item; flag `addon_dfy`.
- Failed payment: webhook sets `past_due`; after 14 days a daily cron (`vercel.json` cron → `/api/cron/billing`) sets sites to `paused`. Canceled accounts keep data 90 days, then the cron marks them for Brien to review (never auto-delete).

## Phase 7 · Monthly refresh, reports, export
- Cron `/api/cron/monthly` (1st of month, Pro+): AI drafts one seasonal update (blog post or announcement bar) as an **unpublished** version and emails the owner an approve link. Nothing publishes without approval.
- Monthly email report: visits (Vercel Web Analytics per host, or a simple page-view counter table), form submissions, uptime, 3 SEO suggestions.
- Agency HTML export: `GET /api/sites/[id]/export` renders every page to static HTML + assets, zipped (`jszip`).

## Phase 8 · Marketing site updates
- `src/app/page.tsx`: hero "Your website, built while you watch" with a 30 s demo video slot, how-it-works (3 steps), examples gallery (published NVESTED sites), industry pages `/for/[industry]` (6), pricing from `PLANS` with limits, FAQ, Terms, Privacy, Acceptable Use (no illegal, adult, or impersonating sites).

---

## New env vars (add to `.env.example`)
```
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
RESEND_API_KEY=
EMAIL_FROM=BBellWeb <hello@bbellweb.info>
UNSPLASH_ACCESS_KEY=
VERCEL_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=
SITES_ROOT_DOMAIN=bbellweb.site
STRIPE_PRICE_DFY=
CRON_SECRET=
```

## Definition of done (whole build)
- Intake → published site on a subdomain in 15 minutes or less for a non-technical user.
- All three plans enforce their limits; Stripe test-mode flows pass end to end (subscribe, upgrade, fail payment, cancel).
- Lighthouse on a published site: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 (mobile).
- AI cost per build logged and under $2.
- `npm run lint` and `npm run build` clean.

## Out of scope (v1)
E-commerce carts, member logins on customer sites, multi-language sites, domain resale, a drag-and-drop editor.
