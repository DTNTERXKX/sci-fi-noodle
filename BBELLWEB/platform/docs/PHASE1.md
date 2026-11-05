# Phase 1 acceptance

Run after `DATABASE_URL` is set and `npm run db:migrate` has been applied.

1. **Stripe test checkout → user row**  
   Complete Checkout in test mode. Confirm webhook fires (or run verify in Studio). In Neon, `users` has your email, correct `plan`, `status = active`.

2. **Save site**  
   Studio → generate draft → **Save to dashboard**. `sites` and `site_versions` rows exist; `sites.current_version_id` points at the version.

3. **Dashboard list**  
   Open `/dashboard` — saved site appears with name and subdomain.

```bash
npm run lint
npm run build
```
