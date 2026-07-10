# Launch checklist

Editorial design pass is complete. Before removing the gate or announcing the site, work through this list.

## 1. Contact details

Edit `data/contact.json` (or use the helper):

```sh
node scripts/set-contact.js --phone "+27XXXXXXXXX" --phone-display "0XX XXX XXXX" --email "info@floridadayhospital.co.za"
```

- Set `phone.tel` and `phone.display` to the confirmed hospital line
- Set `email.address` and `email.display` to the confirmed inbox
- Set `phone.pending` and `email.pending` to `false` (the script does this when values are provided)

Rebuild or redeploy — `js/contact.js` replaces `TEL_PLACEHOLDER` / `EMAIL_PLACEHOLDER` site-wide.

## 2. Facility photography

1. Shoot per `PHOTOGRAPHY-SHOT-LIST.md` (real FDH facility only)
2. Export WebP at listed widths into `assets/photos/` (see `assets/photos/README.md`)
3. Run `node scripts/sync-photography.js` — enables each slot when its fallback file exists
4. Alt text is pre-filled in `data/photography.json`; adjust if needed
5. Hard-refresh and verify hero (LCP), care band, pathway accent, and banner

## 3. Visiting specialists (optional)

Edit `data/providers.json` — replace `type: "unallocated"` entries with confirmed specialists when profiles are approved (name, photo, HPCSA, languages).

## 4. Gate and production domain

| Goal | Action |
|------|--------|
| Preview on Vercel | Default — `*.vercel.app` is allowed by `middleware.js` |
| Production domain live | `floridadayhospital.co.za` is already allowlisted |
| Disable gate entirely | Set Vercel env `PUBLIC_SITE=true` |
| Gate non-production hosts | Default when `PUBLIC_SITE` is unset |

## 5. Deploy

```sh
bash scripts/check-launch.sh   # readiness report (warnings OK pre-launch)
bash scripts/prepare-site.sh   # local preview → _site/
git push                       # Vercel builds via vercel.json
```

## 6. Post-launch smoke test

- [ ] Home, about, services, contact, careers load on production domain
- [ ] Phone and email links work on mobile
- [ ] Map and directions open correctly
- [ ] Nav current-page state on inner pages
- [ ] Mobile bar (Call / Contact) visible on phone
- [ ] `coming-soon` only appears on gated hosts (if gate kept)
