# Florida Day Hospital — Website

A static website for Florida Day Hospital, a private same-day surgical facility.

## Design position

In healthcare, wealth is quiet. The premium signal is deep navy authority, enormous
whitespace, a high-contrast serif at display sizes over a precision sans body, and
long, soft, low-opacity depth. No gold, no dark-luxe treatments — those lower
perceived clinical credibility.

The three moves:

1. **Space** — `--space-unit` is `1.75rem`. Sparse density everywhere.
2. **Type** — Fraunces for display headlines only (56–72px), Inter for body.
3. **Depth** — two-layer, long, soft, low-opacity shadows.

## Architecture

- `css/tokens.css` — the entire premium treatment lives here. Colors, type scale,
  space scale, shadows, shape and motion, as CSS custom properties on `:root`.
  Re-theming the site is a legal `:root` swap.
- `css/main.css` — the structural component layer. Consumes tokens only; no raw
  color, size, shadow, or font values are permitted in this file.
- `index.html` — homepage.
- `js/main.js` — minimal progressive enhancement (mobile navigation).

## Running locally

It's a static site — open `index.html` directly, or serve it:

```sh
python3 -m http.server 8000
```

then visit http://localhost:8000.

### Preview mobile layout on desktop

Set `SITE_VIEW=mobile` when building, or edit `js/site-config.js` and set
`defaultView: 'mobile'`. The site uses a **390px layout viewport** (standard
phone width) so every mobile breakpoint, burger menu, sticky bar, and fold
matches a real handset. The dark top bar is preview chrome only — it does not
appear on real phones. Use the footer toggle (**Desktop site** / **Mobile site**)
to override; the choice is saved in `localStorage`.

On Vercel or GitHub Pages, add a `SITE_VIEW` environment/repository variable
set to `mobile` (or `desktop` to force the wide layout). Values: `auto`
(default), `mobile`, `desktop`.

## Design source (Lovable)

Homepage editorial layout is ported from the Lovable prototype
[sunshine-digital-care](https://github.com/HMalepe/sunshine-digital-care).
See `docs/DESIGN-SOURCE.md` for how the repos are linked and how to sync
design updates.

```sh
git fetch lovable   # remote already configured
```
