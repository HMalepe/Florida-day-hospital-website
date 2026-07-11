# Service hover-preview images

These WebPs power the far-right hover preview on the homepage / services list.
Services detail portraits live in `assets/specialists/` and can differ from these previews.

| ID | File |
|----|------|
| ophthalmology | `ophthalmology.webp` |
| gastroenterology | `gastroenterology.webp` |
| ent | `ent.webp` |
| gynaecology | `gynaecology.webp` |
| orthopaedics | `orthopaedics.webp` |
| general-surgery | `general-surgery.webp` |
| urology | `urology.webp` |
| dental | `dental.webp` |
| pain-management | `pain-management.webp` |

```sh
node scripts/export-service-previews.js
node scripts/export-new-service-previews.js
node scripts/export-specialist-portraits.js
```
