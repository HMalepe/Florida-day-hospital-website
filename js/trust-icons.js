// Hero trust icons — thin line-art, animated on load
(() => {
  const ICONS = {
    calendar: `<svg class="hero__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect class="hero__icon-draw" pathLength="1" x="3" y="5" width="18" height="16" rx="2"/>
      <path class="hero__icon-draw" pathLength="1" d="M8 3v4M16 3v4M3 10h18"/>
      <path class="hero__icon-tick" d="M8 14l2 2 5-5" opacity="0"/>
    </svg>`,
    theatre: `<svg class="hero__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle class="hero__icon-draw" pathLength="1" cx="12" cy="12" r="8"/>
      <path class="hero__icon-hand" d="M12 8v4l3 2" opacity="0.9"/>
      <circle class="hero__icon-pulse" cx="12" cy="12" r="2" fill="currentColor" stroke="none" opacity="0"/>
    </svg>`,
    discharge: `<svg class="hero__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path class="hero__icon-draw" pathLength="1" d="M4 12h12"/>
      <path class="hero__icon-draw" pathLength="1" d="M12 6l6 6-6 6"/>
      <path class="hero__icon-home" pathLength="1" d="M20 10v8a2 2 0 01-2 2h-2" opacity="0.5"/>
    </svg>`,
  };

  document.querySelectorAll('[data-trust-icon]').forEach((slot) => {
    const key = slot.dataset.trustIcon;
    if (ICONS[key]) slot.innerHTML = ICONS[key];
  });
})();
