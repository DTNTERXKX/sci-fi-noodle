# BBellWeb platform (production)

Self-hosted marketing site, Stripe subscriptions ($19 / $49 / $99), and **Site Studio** (`/studio`) powered by OpenAI.

## Setup

```bash
npm install
cp .env.example .env.local
# fill DATABASE_URL (Neon), Stripe, OpenAI, SESSION_SECRET, NEXT_PUBLIC_APP_URL
npm run db:migrate
npm run dev
```

Phase 1 checklist: [docs/PHASE1.md](./docs/PHASE1.md).  
Phase 2 (schema + sections): [docs/PHASE2.md](./docs/PHASE2.md) · preview at `/dev/fixtures`.

## Deploy (Vercel)

**Full checklist:** [docs/PRODUCTION.md](./docs/PRODUCTION.md)

- Vercel **Root Directory:** `BBELLWEB/platform`
- Set all production env vars (see `.env.example`)
- Custom domain: **bbellweb.info**
- Health check: `/api/health`

## Stripe

1. Create three recurring **Products/Prices** in Stripe; copy Price IDs into `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_AGENCY`.
2. Webhook endpoint (production): `https://bbellweb.info/api/stripe/webhook`  
   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`  
   Studio access is confirmed via live Stripe lookup when users verify email; the webhook is ready for future logging or a database.

## DNS

Point **bbellweb.info** (and optionally **www**) at your deployment. Studio lives at `/studio` on the same domain.
