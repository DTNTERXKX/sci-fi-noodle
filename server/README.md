# SCI-FI NOODLES · ASP.NET Core host

Production stack: **.NET 8** serves static `wwwroot` plus API and SEO routes. **Bun/Vite run only at build time** on your machine (`deploy/build-production.ps1`), not on the host.

## Local run

```powershell
# Bun build, prerender every menu path, dotnet publish → publish/
powershell -ExecutionPolicy Bypass -File deploy\build-production.ps1

# Run the published output or:
dotnet run --project server\SciFiNoodles.Web
```

`deploy/prerender-pages.mjs` renders each path in `Data/sitemap-paths.json` through the built TanStack Start server bundle (`app/dist/server/server.js`) and writes `wwwroot/index.html`, `wwwroot/watch/index.html`, etc. `SpaHtmlMiddleware` serves those files for extensionless GETs, and `wwwroot/index.html` for `/` and unknown page paths. Do not replace them with a hand-written shell: the client entry hydrates the whole document and throws `Invariant failed` without the server's `$_TSR` payload, which leaves a black page.

Open `http://127.0.0.1:5000`. Katara: `POST /api/katara/talk` with JSON `{ "message": "...", "mode": "chill" }`.

## Endpoints (Kestrel)

| Route | Handler |
|-------|---------|
| `GET /*` | Static files + `index.html` fallback |
| `POST /api/katara/talk` | SQLite menu answers (same contract as Bun app) |
| `GET /sitemap.xml` | From `Data/sitemap-paths.json` |
| `GET /robots.txt` | Disallow `/app` |
| `GET /app` | 301 to `/` |

## Configuration

`appsettings.json`:

- `Site:PublicUrl` — canonical URL for sitemap/robots (production: `https://www.scifinoodles.com`)
- `Katara:DatabasePath` — path to `katara.sqlite` (linked from `app/data/katara.sqlite` at build)

## Tests

```powershell
dotnet test server\SciFiNoodles.sln
```

## Live host (Plesk on Windows IIS)

The app is running on Plesk. IIS can change the path of `/` before it reaches Kestrel. `SpaHtmlMiddleware` serves `wwwroot/index.html` for any GET/HEAD that would otherwise 404, except `/api`, `/app`, `/.well-known`, `/robots.txt`, `/sitemap.xml`, `/assets/*` and static-asset extensions, and it honors `X-Original-URL` / `X-Rewrite-URL`. Every 404, and every shell served for a remapped path, carries an `X-SFN-Path` header with the path Kestrel received, so `curl.exe -i https://scifinoodles.com/` shows what IIS sent.

Brien deploys. Upload the whole `publish/` (DLL, `web.config`, `wwwroot/`, `Data/`). `build-production.ps1` no longer puts shell copies (`index.html`, `Default.htm`, `Default.asp`, `index.htm`, `iisstart.htm`, `default.aspx`) next to the DLL; delete those from the server folder too, since IIS remaps `/` to them and 404s them itself. The .NET 8 ASP.NET Core Hosting Bundle stays required.

`web.config` clears inherited URL Rewrite rules (`<rewrite><rules><clear /></rules>…</rewrite>`) because rules from the Plesk site config 404 the homepage; if the site then shows HTTP 500.19, the URL Rewrite module is missing on the server, so remove the `<rewrite>` block.

Do not use nginx, certbot, `/var/www/scifinoodles`, or a systemd unit on port 5000 for this domain. Hosting was not agreed as InterServer (`LOCKS.md`, Nov 5).

## Still to do (conversion roadmap)

- [ ] **Per-route titles/SEO** in the shell (today the shell uses a fixed `<title>`; crawlers still see real URLs with the same bootstrap).
- [ ] Optional: MuseTalk sidecar on the VPS only if streaming lip-sync returns. The SQLite menu and locked mp3s answer without it. Local start leaves it off unless `-MuseTalk`.
- [ ] CI job: `build-production.ps1` + artifact upload.
