# Design source — Lovable prototype

The editorial homepage layout is ported from the Lovable prototype:

**Repository:** [github.com/HMalepe/sunshine-digital-care](https://github.com/HMalepe/sunshine-digital-care)

This production site keeps verified FDH content (Roodepoort address, real services, JSON-driven contact) and the existing static HTML / Vercel deploy pipeline. The Lovable repo is a React + TanStack Start reference — not deployed to production as-is.

## Git remote

```sh
git fetch lovable
git log lovable/main --oneline -5   # preview Lovable changes
```

Remote name: `lovable` → `https://github.com/HMalepe/sunshine-digital-care.git`

## What we port

| From Lovable | Into static site |
|---|---|
| Split hero grid + stat card | `hero--editorial` on `index.html` |
| Stats band | `.stats-band` section |
| Editorial typography rhythm | `css/site.css` (FDH teal tokens, not Lovable blue) |
| Service list hover rows | `services.html` editorial list + detail |
| Inner page shell | `page--editorial` on about, services, contact, careers |
| Leadership band | Yonela Tenza on `about.html` |

## What stays production-only

- Multi-page structure (about, services, contact, careers)
- `data/contact.json`, `data/providers.json`, middleware gate
- Florida Park, Roodepoort address — not Lovable placeholder copy
- Vercel `_site` build via `scripts/prepare-site.sh`

## Syncing design updates

When the Lovable prototype changes:

1. `git fetch lovable`
2. Review `lovable/main:src/routes/index.tsx` and `src/styles.css`
3. Port layout / spacing changes into static HTML + `css/site.css`
4. Do **not** merge the React codebase into this repo wholesale
