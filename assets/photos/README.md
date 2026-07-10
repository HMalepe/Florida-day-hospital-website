# Facility photos — drop folder

Export WebP files here after the shoot. **Real Florida Day Hospital facility only** — see `PHOTOGRAPHY-SHOT-LIST.md`.

## Required filenames

| Slot | Files |
|------|-------|
| **hero** | `hero-640.webp`, `hero-960.webp`, `hero-1280.webp`, `hero-1920.webp` |
| **pathwayAccent** | `pathway-accent-960.webp`, `pathway-accent-1280.webp`, `pathway-accent-1920.webp` |
| **providers** | `providers-640.webp`, `providers-960.webp`, `providers-1280.webp`, `providers-1920.webp` |
| **booking** | `booking-480.webp`, `booking-800.webp`, `booking-1200.webp` |

Minimum to enable a slot: the **fallback** file listed in `data/photography.json` (usually the mid-width export).

## Enable on the site

After copying files into this folder:

```sh
node scripts/sync-photography.js
bash scripts/check-launch.sh
git add assets/photos data/photography.json
git commit -m "Enable facility photography."
git push
```

`sync-photography.js` sets `enabled: true` for each slot whose fallback file exists, and `false` when files are missing.

Dry run: `node scripts/sync-photography.js --dry-run`
