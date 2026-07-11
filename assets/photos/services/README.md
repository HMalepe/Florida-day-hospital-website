# Service hover-preview images

These WebPs power the far-right hover preview on the homepage / services list.

| ID | File | Source |
|----|------|--------|
| ophthalmology | `ophthalmology.webp` | Cropped from 6-up sheet |
| gastroenterology | `gastroenterology.webp` | Cropped from 6-up sheet |
| ent | `ent.webp` | Cropped from 6-up sheet |
| gynaecology | `gynaecology.webp` | Cropped from 6-up sheet |
| general-surgery | `general-surgery.webp` | Cropped from 6-up sheet |
| pain-management | `pain-management.webp` | Cropped from 6-up sheet |

Regenerate from `_source/grid-src.png`:

```sh
node scripts/export-service-previews.js
```

Portrait 720×900 WebP. Hover animation is in `js/services-preview.js`.

