# Service hover-preview images

These WebPs power the far-right hover preview on the homepage / services list.

| ID | File |
|----|------|
| ophthalmology | `ophthalmology.webp` |
| gastroenterology | `gastroenterology.webp` |
| ent | `ent.webp` |
| gynaecology | `gynaecology.webp` |
| orthopaedics | `orthopaedics.webp` |
| general-surgery | `general-surgery.webp` |
| dermatology | `dermatology.webp` |
| urology | `urology.webp` |
| dental | `dental.webp` |
| pain-management | `pain-management.webp` |

Regenerate legacy 6-up crops:

```sh
node scripts/export-service-previews.js
```

Regenerate newer specialty cards:

```sh
node scripts/export-new-service-previews.js
```

Portrait 1200×1500 WebP. Hover animation is in `js/services-preview.js`. Expandable procedure lists come from `data/services.json`.
