// Hero trust icons — thin line-art, animated on load
(() => {
  const D = 'hero__icon-draw';

  const ICONS = {
    calendar: `<svg class="hero__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect class="${D}" pathLength="1" x="3" y="5" width="18" height="16" rx="2"/>
      <path class="${D}" pathLength="1" d="M8 3v4M16 3v4M3 10h18"/>
      <circle class="hero__icon-accent" cx="8" cy="14" r="1" fill="currentColor" stroke="none" opacity="0"/>
      <circle class="hero__icon-accent" cx="12" cy="14" r="1" fill="currentColor" stroke="none" opacity="0"/>
      <circle class="hero__icon-accent" cx="16" cy="14" r="1" fill="currentColor" stroke="none" opacity="0"/>
      <path class="hero__icon-tick" d="M8 17l2 2 5-5" opacity="0"/>
    </svg>`,

    theatre: `<svg class="hero__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle class="${D}" pathLength="1" cx="12" cy="12" r="8"/>
      <path class="${D}" pathLength="1" d="M12 4v2M12 18v2M4 12h2M18 12h2"/>
      <path class="hero__icon-hand" d="M12 8v4l3 2"/>
      <circle class="hero__icon-pulse" cx="12" cy="12" r="2" fill="currentColor" stroke="none" opacity="0"/>
      <path class="hero__icon-accent" d="M8 8l1.5 1.5M16 8l-1.5 1.5" opacity="0"/>
    </svg>`,

    discharge: `<svg class="hero__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path class="${D}" pathLength="1" d="M4 12h10"/>
      <path class="${D}" pathLength="1" d="M12 6l6 6-6 6"/>
      <path class="hero__icon-home" pathLength="1" d="M18 8l2-2v10a2 2 0 01-2 2h-2" opacity="0.5"/>
      <path class="hero__icon-accent" d="M19 14h-2" opacity="0"/>
      <circle class="hero__icon-accent hero__icon-accent--sun" cx="20" cy="6" r="1.5" fill="var(--accent-bright)" stroke="none" opacity="0"/>
    </svg>`,
  };

  document.querySelectorAll('[data-trust-icon]').forEach((slot) => {
    const key = slot.dataset.trustIcon;
    if (ICONS[key]) slot.innerHTML = ICONS[key];
  });
})();
