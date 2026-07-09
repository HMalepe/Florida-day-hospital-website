// Site-wide utility icons — location, pathway, medical aid pillars
(() => {
  const S = 'site-icon__line';
  const D = `${S} site-icon__draw`;

  const wrap = (cls, inner) =>
    `<svg class="site-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const ICONS = {
    pin: wrap('site-icon--pin', `
      <path class="${D}" pathLength="1" d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"/>
      <circle class="${S}" cx="12" cy="10" r="2.5"/>
    `),

    clock: wrap('site-icon--clock', `
      <circle class="${D}" pathLength="1" cx="12" cy="12" r="8"/>
      <path class="${D}" pathLength="1" d="M12 8v4l3 2"/>
    `),

    phone: wrap('site-icon--phone', `
      <path class="${D}" pathLength="1" d="M6.5 4h3l1.5 4-2 1.5a11 11 0 005 5L14.5 12.5 18.5 14v3a2 2 0 01-2 2A14 14 0 014 6.5a2 2 0 012-2.5z"/>
      <path class="site-icon__accent" d="M16 4l2 2" opacity="0"/>
    `),

    email: wrap('site-icon--email', `
      <rect class="${D}" pathLength="1" x="3" y="6" width="18" height="12" rx="2"/>
      <path class="${D}" pathLength="1" d="M3 8l9 6 9-6"/>
      <path class="site-icon__accent" d="M7 14h10" opacity="0"/>
    `),

    shield: wrap('site-icon--shield', `
      <path class="${D}" pathLength="1" d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>
      <path class="site-icon__accent" d="M9 12l2 2 4-4" opacity="0"/>
    `),

    authorisation: wrap('site-icon--authorisation', `
      <path class="${D}" pathLength="1" d="M7 4h10v16H7z"/>
      <path class="${D}" pathLength="1" d="M10 8h6M10 12h6M10 16h4"/>
      <path class="site-icon__accent" d="M16 16l1.5 1.5L20 14" opacity="0"/>
    `),

    transparency: wrap('site-icon--transparency', `
      <circle class="${D}" pathLength="1" cx="12" cy="12" r="8"/>
      <path class="${D}" pathLength="1" d="M12 8v8"/>
      <path class="${D}" pathLength="1" d="M8 12h8"/>
      <circle class="site-icon__accent" cx="12" cy="12" r="2" fill="currentColor" stroke="none" opacity="0"/>
    `),

    arrival: wrap('site-icon--arrival', `
      <path class="${D}" pathLength="1" d="M4 18h16"/>
      <path class="${D}" pathLength="1" d="M8 18V8l4-3 4 3v10"/>
      <path class="site-icon__accent" d="M11 13h2" opacity="0"/>
    `),

    preparation: wrap('site-icon--preparation', `
      <rect class="${D}" pathLength="1" x="5" y="4" width="14" height="16" rx="2"/>
      <path class="${D}" pathLength="1" d="M9 8h6M9 12h6"/>
      <circle class="site-icon__accent" cx="12" cy="16" r="1" fill="currentColor" stroke="none" opacity="0"/>
    `),

    procedure: wrap('site-icon--procedure', `
      <circle class="${D}" pathLength="1" cx="12" cy="12" r="7"/>
      <path class="${D}" pathLength="1" d="M12 5v14M5 12h14"/>
      <circle class="site-icon__accent" cx="12" cy="12" r="2" fill="currentColor" stroke="none" opacity="0"/>
    `),

    recovery: wrap('site-icon--recovery', `
      <path class="${D}" pathLength="1" d="M4 16c3-4 13-4 16 0"/>
      <path class="${D}" pathLength="1" d="M8 12v4M16 12v4"/>
      <path class="site-icon__accent" d="M10 10c1-1 3-1 4 0" opacity="0"/>
    `),

    home: wrap('site-icon--home', `
      <path class="${D}" pathLength="1" d="M4 11l8-6 8 6"/>
      <path class="${D}" pathLength="1" d="M6 10v9h12v-9"/>
      <path class="site-icon__accent" d="M10 19v-4h4v4" opacity="0"/>
    `),
  };

  document.querySelectorAll('[data-site-icon]').forEach((slot) => {
    const key = slot.dataset.siteIcon;
    if (ICONS[key]) slot.innerHTML = ICONS[key];
  });
})();
