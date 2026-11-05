# BBellWeb platform · production on Vercel

## 1. Vercel project

1. Import **sci-fi-noodle** from GitHub.
2. Set **Root Directory** to `BBELLWEB/platform`.
3. Framework: Next.js (auto-detected).
4. Production branch: your deploy branch (e.g. `main` or `cursor/katara-host` after merge).

`vercel.json` runs **`npm run db:migrate`** before **`npm run build`**. `DATABASE_URL` must be set for **Production** (and Preview if you want migrate there too).

## 2. Environment variables (Production)

Copy from `.env.example`. Required in production:

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://bbellweb.info` (no trailing slash) |
| `DATABASE_URL` | Neon Postgres connection string |
| `SESSION_SECRET` | Random string, **≥ 32 characters** |
| `STRIPE_SECRET_KEY` | Live key when going live |
| `STRIPE_WEBHOOK_SECRET` | From live webhook endpoint |
| `STRIPE_PRICE_STARTER` / `_PRO` / `_AGENCY` | Live recurring Price IDs |
| `OPENAI_API_KEY` | Studio generation |
| `OPENAI_MODEL` | Optional; default `gpt-4o-mini` |

Optional later: `STRIPE_PRICE_DFY`, `SITES_ROOT_DOMAIN`, Vercel domain API vars (Phase 5).

## 3. Neon

1. Create project + database.
2. Paste connection string into `DATABASE_URL`.
3. First deploy runs migrations from `drizzle/`.

## 4. Stripe (live)

1. Create Products / Prices matching Starter ($19), Pro ($49), Agency ($99).
2. **Webhook:** `https://bbellweb.info/api/stripe/webhook`  
   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
3. Success URL uses `NEXT_PUBLIC_APP_URL` — must match your domain.

## 5. Domain

1. Vercel → Project → Domains → add `bbellweb.info` and `www.bbellweb.info`.
2. Apply DNS records at your registrar.
3. Wait for SSL, then set `NEXT_PUBLIC_APP_URL=https://bbellweb.info`.

## 6. Smoke test after deploy

```text
GET https://bbellweb.info/api/health     → { "status": "ok", "database": "ok" }
GET https://bbellweb.info/               → marketing home
POST checkout (test or live)             → user row in Neon after webhook
/dev/fixtures                            → 404 in production
```

## 7. Local parity

```bash
cd BBELLWEB/platform
cp .env.example .env.local
npm run db:migrate
npm run dev
```
