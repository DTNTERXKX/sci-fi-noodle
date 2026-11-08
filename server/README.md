# SCI-FI NOODLES · ASP.NET Core host (InterServer)

Production stack: **.NET 8** serves static `wwwroot` plus API and SEO routes. **Bun/Vite run only at build time** on your machine (`deploy/build-production.ps1`), not on the VPS.

## Local run

```powershell
# Bun build, SPA shell, copy index.html to every menu path, dotnet publish → publish/
powershell -ExecutionPolicy Bypass -File deploy\build-production.ps1

# Run the published output or:
dotnet run --project server\SciFiNoodles.Web
```

`deploy/spa-shell.mjs` builds `index.html` from hashed `assets/index-*.js` and `assets/styles-*.css` (TanStack Start does not emit HTML). `deploy/prerender-static.mjs` copies that shell to each path in `Data/sitemap-paths.json` so `/watch/index.html`, `/host/index.html`, etc. exist for crawlers. `SpaHtmlMiddleware` serves those files for extensionless GETs.

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

## InterServer VPS (summary)

1. Install .NET 8 runtime, nginx, certbot.
2. Copy `publish/` to `/var/www/scifinoodles`.
3. systemd unit running `dotnet SciFiNoodles.Web.dll` on `127.0.0.1:5000`.
4. nginx TLS reverse proxy to Kestrel.

## Still to do (conversion roadmap)

- [ ] **Per-route titles/SEO** in the shell (today the shell uses a fixed `<title>`; crawlers still see real URLs with the same bootstrap).
- [ ] Optional: MuseTalk sidecar on the VPS if streaming lip-sync returns.
- [ ] CI job: `build-production.ps1` + artifact upload.
