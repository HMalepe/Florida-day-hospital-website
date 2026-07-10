# Florida Day Hospital — Photography Shot List

Hand this page to the client and photographer before the shoot. **Every image must be of the real Florida Day Hospital facility in Florida Park, Roodepoort.** No stock photography, no images from other hospitals, no identifiable patients without written consent.

Export all deliverables as **WebP** at the widths listed. Keep filenames aligned with `data/photography.json`.

---

## 1. Hero — `hero` slot (LCP, above the fold)

| Field | Spec |
|-------|------|
| **Subject** | Main **reception / admissions desk** *or* **theatre anteroom** (unoccupied, clean, lights on) |
| **Orientation** | Portrait **4:5** (vertical) |
| **Mood** | Calm, well-lit, uncluttered — patient arrives here |
| **Avoid** | Patients in frame, blood, open procedures, branded scheme collateral, clutter |
| **Deliver widths** | 640, 960, 1280, 1920 px |
| **Save as** | `assets/photos/hero-{width}.webp` |
| **Alt text** | Plain description for CMS — e.g. “Reception area at Florida Day Hospital, Roodepoort” |

---

## 2. Day pathway accent — `pathwayAccent` slot (decorative background)

| Field | Spec |
|-------|------|
| **Subject** | **Wide interior** — corridor, waiting area depth, or reception looking into the facility |
| **Orientation** | Landscape **16:9** |
| **Mood** | Soft, slightly defocused or evenly lit OK — sits at ~12% opacity behind timeline |
| **Avoid** | Signage with unreadable private data, people, harsh shadows |
| **Deliver widths** | 960, 1280, 1920 px |
| **Save as** | `assets/photos/pathway-accent-{width}.webp` |
| **Alt text** | Leave decorative (empty) |

---

## 3. Providers section — `providers` slot

| Field | Spec |
|-------|------|
| **Subject** | **Care environment** — nursing station, prep/recovery bay exterior, or theatre corridor (empty) |
| **Orientation** | Landscape **21:9** (wide banner) |
| **Mood** | Professional, quiet competence — supports “the people behind your procedure” |
| **Avoid** | Staged stock poses; only include staff if FDH supplies consent |
| **Deliver widths** | 640, 960, 1280, 1920 px |
| **Save as** | `assets/photos/providers-{width}.webp` |
| **Alt text** | Plain facility description for CMS |

---

## 4. Booking section — `booking` slot

| Field | Spec |
|-------|------|
| **Subject** | **Admissions / phone desk** — where patients call or check in (no faces) |
| **Orientation** | Portrait **4:5** |
| **Mood** | Welcoming, reachable — pairs with “Call admissions to book” |
| **Avoid** | Visible phone numbers on signage (use site placeholders in design), patients |
| **Deliver widths** | 480, 800, 1200 px |
| **Save as** | `assets/photos/booking-{width}.webp` |
| **Alt text** | Plain description for CMS |

---

## After the shoot

1. Copy WebP files into **`assets/photos/`** (filenames in `assets/photos/README.md`).
2. Run **`node scripts/sync-photography.js`** — sets `"enabled": true` per slot when files exist.
3. Adjust alt text in **`data/photography.json`** if needed.
4. Reload the homepage — hero preload is injected automatically when hero is enabled.
5. Run **`bash scripts/check-launch.sh`** then deploy.

---

## Minimum viable set

If budget is tight, shoot in this order: **Hero → Booking → Providers → Pathway accent**.
