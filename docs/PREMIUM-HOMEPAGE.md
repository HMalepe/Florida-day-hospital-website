# Premium homepage — top to bottom

Editorial pass ported from [sunshine-digital-care](https://github.com/HMalepe/sunshine-digital-care) (Lovable). Scoped to `index.html` via `page--editorial`.

## Checklist (top → bottom)

| # | Section | Status |
|---|---------|--------|
| 1 | **Nav** — glass header, editorial lockup, pill CTA | Done |
| 2 | **Hero** — split grid, italic accent, stat card | Done |
| 3 | **Stats band** — four editorial metrics | Done |
| 4 | **Patient & family** — image + copy care band | Done |
| 5 | **Day pathway** — vertical timeline, editorial surface | Done |
| 6 | **Services** — numbered row list (not card grid) | Done |
| 7 | **Home by sunset** — full-bleed image band | Done |
| 8 | **Visit & contact** — enquire block + map | Done |
| 9 | **Footer** — light editorial footer | Done |
| 10 | **Mobile bar** — pill Call / Contact | Done |

## Still to do (site-wide)

- [x] Port editorial shell to `about.html`, `services.html`, `contact.html`, `careers.html`
- [x] Inner pages: editorial nav lockup + footer + pathway/placeholder polish
- [x] Services page: editorial list + detail sections
- [x] Contact page: visit & contact block (homepage styling)
- [x] About page leadership band (Yonela Tenza)
- [x] Services detail discipline imagery (where assets exist)
- [x] Careers page editorial roles list + values band
- [x] Coming-soon gate aligned with editorial brand
- [x] About page visiting specialists grid (`data/providers.json`)
- [x] Launch checklist + README refresh
- [x] Launch check script + pending contact UX polish
- [ ] Enable real photography slots in `data/photography.json` when assets arrive (see `PHOTOGRAPHY-SHOT-LIST.md`)
- [ ] Optional: surgeon quote / extra Lovable sections (only with real FDH content)

## Sync from Lovable

```sh
git fetch lovable
# Review: lovable/main:src/routes/index.tsx
```

Do not copy placeholder address, phone, or fictional surgeon quote from Lovable.
