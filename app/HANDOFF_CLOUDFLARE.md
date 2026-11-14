# SCI-FI NOODLES site: Cloudflare handoff

Last updated: 2026-11-14. Branch: `cursor/katara-host`. Commit: `76eb945`.

## Where it lives

| Thing | Value |
|---|---|
| Live site | https://www.scifinoodles.com (Cloudflare Worker `scifinoodles`) |
| Preview | https://preview.scifinoodles.com (same Worker) |
| Apex `scifinoodles.com` | Still on the old host. Not on the Worker yet. |
| Worker entry | `dist/server/server.js` (built by `bun run build`) |
| Static assets | `dist/client` (served by the Worker) |
| Config | `app/wrangler.jsonc` |
| Inbox database | D1 `scifinoodles-inbox`, binding `DB` |
| Schema | `app/d1/inbox-schema.sql` |

## Deploy (you run this in Cursor)

From the `app` folder:

```bash
bun run build
npx wrangler deploy
```

First time on a machine, log in once:

```bash
npx wrangler login
```

Run wrangler from `app` (or from any folder outside the project). The `@types/react` override was removed, so `npx` works from inside the project.

Checks after a deploy:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.scifinoodles.com/
```

Expect `200`.

Deploys are manual. Agents never deploy.

## What changed from the old host

- **Inbox (contact and join forms):** saves to D1 instead of SQLite. Code: `src/lib/inbox.server.ts`. Without the `DB` binding, the save returns `unavailable` (HTTP 500).
- **Katara:** no database. Answers come from the menu built in `src/lib/katara.server.ts` (`buildSeed`). Voice clips are static files in `public/voices/`.
- **Katara live video (MuseTalk):** off on the public site. It needs a local GPU sidecar that Cloudflare can't host.
- **Package fix:** `app/package.json` no longer overrides `@types/react`. `packages/quanta/package.json` pins `19.2.15` to match.

## Tests

```bash
bun test tests/*.test.ts
```

Expect 23 passing. The inbox test uses an in-memory stand-in for D1. The Katara test checks the menu wording. The Ball Crashers line changes once the date passes. Update that assertion when the menu changes.

## Known gaps / next steps

1. **Apex domain:** to move `scifinoodles.com` to the Worker, delete its existing DNS record in Cloudflare, then add `{ "pattern": "scifinoodles.com", "custom_domain": true }` to `routes` in `wrangler.jsonc` and deploy.
2. **Live Katara video:** not on the Worker. Needs a separate host if you want it back.
3. **Old SQLite files:** `data/katara.sqlite` and `data/inbox.sqlite` are no longer read. They're kept in git for history. Delete them when you're ready.
4. **Untracked backups:** `src/content/*.bak_*`, `public/assets/_bak_oct30/` and the `SITE_SEGMENTS_UPDATE_*` notes are not committed. Keep them out unless you need them.
5. **Daily content refresh (Webb):** the content files get updated daily. Pull before editing `src/content/site-segments.json`, and redeploy after any copy change.

## Troubleshooting

- **Deploy error about a workers.dev subdomain:** `wrangler.jsonc` sets `workers_dev: false`, so this shouldn't appear. If it does, check that the config still has that line.
- **Deploy error "externally managed DNS records":** a DNS record for the domain exists outside the Worker. Delete the old record in Cloudflare DNS, then deploy again.
- **Contact form returns "unavailable":** the D1 binding is missing from the deployed config, or the schema hasn't been applied. Re-apply it with:

  ```bash
  npx wrangler d1 execute scifinoodles-inbox --remote --file=d1/inbox-schema.sql
  ```

- **Build fails with type errors about `@types/react`:** run `bun install` again, and check that `packages/quanta/package.json` still pins `19.2.15`.
