# Florida Day Hospital — Website

Static site for Florida Day Hospital, a private same-day surgical facility in Florida Park, Roodepoort.

## Stack

- **HTML** — `index.html`, `about.html`, `services.html`, `contact.html`, `careers.html`
- **CSS** — `css/site.css` (FDH teal tokens, editorial layout)
- **Data** — `data/contact.json`, `data/providers.json`, `data/photography.json`
- **Deploy** — Vercel builds `_site/` via `scripts/prepare-site.sh`
- **Gate** — `middleware.js` (production domain + `*.vercel.app` allowed; other hosts → coming-soon)

## Design

Homepage and inner pages use an editorial layout ported from the Lovable prototype [sunshine-digital-care](https://github.com/HMalepe/sunshine-digital-care). Production keeps verified FDH content — not Lovable placeholders.

See `docs/DESIGN-SOURCE.md`, `docs/PREMIUM-HOMEPAGE.md`, and `docs/LAUNCH-CHECKLIST.md`.

```sh
git fetch lovable   # design reference remote
```

## Run locally

```sh
bash scripts/prepare-site.sh
python3 -m http.server 8000 --directory _site
```

Open http://localhost:8000

### Mobile preview

Set `SITE_VIEW=mobile` when building, or edit `js/site-config.js` (`defaultView: 'mobile'`). The site uses a 390px layout viewport for desktop mobile preview. On Vercel, set a `SITE_VIEW` env var: `auto` (default), `mobile`, or `desktop`.

## Content edits (no HTML changes needed)

| What | File | Helper |
|------|------|--------|
| Phone / email | `data/contact.json` | `node scripts/set-contact.js --phone … --email …` |
| Facility photos | `data/photography.json` + `assets/photos/` | `node scripts/sync-photography.js` |
| Leadership / specialists | `data/providers.json` | edit manually |

## Environment variables (Vercel)

| Variable | Effect |
|----------|--------|
| `PUBLIC_SITE=true` | Disable coming-soon gate on all hosts |
| `SITE_VIEW` | `auto`, `mobile`, or `desktop` layout default |
