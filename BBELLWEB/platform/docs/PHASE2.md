# Phase 2 acceptance

## Automated

```bash
npm run test:fixtures
npm run lint
npm run build
```

## Visual (no horizontal scroll)

With `npm run dev`, open `/dev/fixtures`. Each industry renders at **375px** and **1280px** widths.

## Schema

- `SiteSpecV2` in `src/lib/site-schema.ts` with WCAG palette refine
- `migrateV1toV2()` for legacy v1 specs
- 18 section types under `src/components/sections/`
