document.documentElement.classList.add('js');

// Scroll-scrubbed reveals — same visual language, driven by scroll both ways
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targets = [];
  const revealState = new WeakMap();

  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const smootherstep = (t) => {
    const x = clamp01(t);
    return x * x * x * (x * (x * 6 - 15) + 10);
  };

  const measureProgress = (el) => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // Compact scrub band — reveals finish while the block is still mid-viewport.
    const start = vh * 0.92;
    const end = vh * 0.38;
    return clamp01((start - rect.top) / Math.max(1, start - end));
  };

  const apply = (el, now) => {
    const staggerRaw =
      el.style.getPropertyValue('--stagger-i') ||
      getComputedStyle(el).getPropertyValue('--stagger-i');
    const stagger = Number.parseFloat(staggerRaw) || 0;
    const lag = Math.min(0.28, Math.max(0, stagger) * 0.04);
    let target = measureProgress(el);
    target = clamp01((target - lag) / Math.max(0.001, 1 - lag * 0.85));
    target = smootherstep(target);

    // Soft lag so scroll feel stays continuous instead of snapping per frame.
    let state = revealState.get(el);
    if (!state) {
      state = { value: target, last: now };
      revealState.set(el, state);
    }
    const dt = Math.min(48, Math.max(8, now - state.last));
    state.last = now;
    // Snappier follow (~14Hz) — still smooth, less “trailing fog”.
    const ease = 1 - Math.exp((-dt / 1000) * 14);
    state.value += (target - state.value) * ease;
    if (Math.abs(target - state.value) < 0.0012) state.value = target;
    state.settled = state.value === target;

    const p = state.value;
    el.style.setProperty('--reveal', p.toFixed(4));

    const on = p >= 0.985;
    el.classList.toggle('revealed', on);
    if (el.hasAttribute('data-team-leader')) {
      el.classList.toggle('team-revealed', on);
    }
  };

  let syncing = false;
  const sync = (timestamp) => {
    const now = typeof timestamp === 'number' ? timestamp : performance.now();
    let needsFrame = false;
    for (let i = 0; i < targets.length; i += 1) {
      apply(targets[i], now);
      if (!revealState.get(targets[i])?.settled) needsFrame = true;
    }
    if (needsFrame) {
      requestAnimationFrame(sync);
    } else {
      syncing = false;
    }
  };

  window.FDH_syncReveals = () => {
    if (syncing) return;
    syncing = true;
    requestAnimationFrame(sync);
  };

  window.FDH_initReveals = (root = document) => {
    const scope = root === document ? document : root;
    const found = [
      ...scope.querySelectorAll('[data-reveal], [data-reveal-fly], [data-team-leader]'),
    ];

    if (reducedMotion) {
      found.forEach((el) => {
        el.style.setProperty('--reveal', '1');
        el.classList.add('revealed');
        if (el.hasAttribute('data-team-leader')) el.classList.add('team-revealed');
      });
      return;
    }

    const set = new Set(targets);
    found.forEach((el) => set.add(el));
    targets = [...set];
    window.FDH_syncReveals();
  };

  window.FDH_initReveals();
})();

// Header scroll state + reading-progress bar — single scroll listener on the site
(() => {
  const header = document.getElementById('site-header');
  if (!header) return;

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  header.appendChild(progress);

  const hero = document.querySelector('.hero');
  const parallaxOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Day-pathway scroll fill: the rail draws itself as the timeline moves
  // through the viewport, and each stage ignites as the fill reaches it.
  const timeline = document.querySelector('.day-pathway__timeline');
  const stages = timeline
    ? [...timeline.querySelectorAll('.day-pathway__stage')]
    : [];
  const traveler = timeline
    ? timeline.querySelector('.day-pathway__flow')
    : null;

  const poseForProgress = (p) => {
    if (p >= 0.875) return 'car';
    if (p >= 0.75) return 'walk-again';
    if (p >= 0.5) return 'sleep';
    if (p >= 0.25) return 'walk';
    return 'car-arrive';
  };

  const syncTraveler = (p) => {
    if (!traveler) return;
    traveler.dataset.pose = poseForProgress(p);
    traveler.classList.toggle('is-on-rail', p > 0.015 && p < 0.985);
  };

  if (timeline && !parallaxOK) {
    timeline.style.setProperty('--journey-progress', '1');
    stages.forEach((s) => s.classList.add('is-lit'));
    syncTraveler(1);
  }

  let ticking = false;
  let journeyValue = 0;
  let journeyRaf = 0;

  const settleJourney = () => {
    if (!timeline || !parallaxOK) {
      journeyRaf = 0;
      return;
    }
    const rect = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const target = Math.min(
      1,
      Math.max(0, (vh * 0.75 - rect.top) / (rect.height * 0.85 + vh * 0.15))
    );
    const ease = 1 - Math.exp(-0.18);
    journeyValue += (target - journeyValue) * ease;
    if (Math.abs(target - journeyValue) < 0.001) journeyValue = target;
    timeline.style.setProperty('--journey-progress', journeyValue.toFixed(4));
    syncTraveler(journeyValue);
    const n = stages.length;
    stages.forEach((stage, i) => {
      stage.classList.toggle('is-lit', journeyValue >= (i + 0.35) / n);
    });
    if (Math.abs(target - journeyValue) >= 0.001) {
      journeyRaf = requestAnimationFrame(settleJourney);
    } else {
      journeyRaf = 0;
    }
  };

  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : '0');
    if (hero && parallaxOK && y < window.innerHeight * 1.2) {
      const soft = document.documentElement.classList.contains('site-view--mobile')
        || document.documentElement.classList.contains('site-view--mobile-preview')
        ? 0.04
        : 0.07;
      const faint = soft * 0.35;
      hero.style.setProperty('--plx-soft', (y * soft).toFixed(1) + 'px');
      hero.style.setProperty('--plx-faint', (y * faint).toFixed(1) + 'px');
    }
    if (timeline && parallaxOK && !journeyRaf) {
      journeyRaf = requestAnimationFrame(settleJourney);
    }
    if (typeof window.FDH_syncReveals === 'function') {
      window.FDH_syncReveals();
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  window.addEventListener('resize', update, { passive: true });
  update();
})();

// Current-page nav highlight — top links and dropdown items
(() => {
  const links = document.querySelectorAll('.nav-links > a, .nav-dropdown__menu a');
  if (!links.length) return;
  const here = location.pathname.split('/').pop() || 'index.html';
  const hash = location.hash;

  const hrefKey = (href) => {
    const [page, frag] = href.split('#');
    const file = page.split('/').pop() || 'index.html';
    return frag ? `${file}#${frag}` : file;
  };

  const pageOnly = (href) => {
    const [page] = href.split('#');
    return page.split('/').pop() || 'index.html';
  };

  const current = hash ? `${here}${hash}` : here;

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    if (hrefKey(href) !== current) return;

    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
    link.closest('.nav-dropdown')?.querySelector('.nav-dropdown__trigger')?.classList.add('is-active');
  });

  // Section pages: highlight dropdown parent when any child shares the file
  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    const childPages = [...dropdown.querySelectorAll('.nav-dropdown__menu a')]
      .map((a) => pageOnly(a.getAttribute('href') || ''))
      .filter(Boolean);
    if (childPages.includes(here)) {
      dropdown.querySelector('.nav-dropdown__trigger')?.classList.add('is-active');
    }
  });

  if (here === 'careers.html') {
    document.querySelector('.site-footer__nav a[href="careers.html"]')?.classList.add('is-active');
  }
})();

// Dropdown navigation — click on touch; hover on desktop; arrow keys on keyboard
(() => {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if (!dropdowns.length) return;

  const closeAll = (except) => {
    dropdowns.forEach((dd) => {
      if (dd === except) return;
      dd.classList.remove('is-open');
      dd.querySelector('.nav-dropdown__trigger')?.setAttribute('aria-expanded', 'false');
    });
  };

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector('.nav-dropdown__trigger');
    const menu = dropdown.querySelector('.nav-dropdown__menu');
    const items = menu ? [...menu.querySelectorAll('[role="menuitem"]')] : [];
    if (!trigger) return;

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !dropdown.classList.contains('is-open');
      closeAll(open ? dropdown : null);
      dropdown.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
      if (open && items[0]) items[0].focus();
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        if (dropdown.classList.contains('is-open')) return;
        event.preventDefault();
        closeAll(dropdown);
        dropdown.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        if (items[0]) items[0].focus();
      }
    });

    items.forEach((item, index) => {
      item.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          items[(index + 1) % items.length]?.focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          items[(index - 1 + items.length) % items.length]?.focus();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          closeAll();
          trigger.focus();
        } else if (event.key === 'Tab') {
          closeAll();
        }
      });
    });
  });

  document.addEventListener('click', () => closeAll());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
})();

// Mobile menu
(() => {
  const burger = document.querySelector('.nav-burger');
  const menu = document.getElementById('nav-menu');
  if (!burger || !menu) return;

  const closeDropdowns = () => {
    menu.querySelectorAll('.nav-dropdown.is-open').forEach((dd) => {
      dd.classList.remove('is-open');
      dd.querySelector('.nav-dropdown__trigger')?.setAttribute('aria-expanded', 'false');
    });
  };

  const setOpen = (open) => {
    if (open) closeDropdowns();
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (!open) closeDropdowns();
    if (open) {
      const firstFocusable = menu.querySelector('a, button');
      if (firstFocusable) firstFocusable.focus();
    }
  };

  burger.addEventListener('click', () => {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('.nav-dropdown__menu a')) setOpen(false);
    if (event.target.closest('.nav-links > a')) setOpen(false);
  });

  menu.addEventListener('keydown', (event) => {
    if (burger.getAttribute('aria-expanded') !== 'true' || event.key !== 'Tab') return;
    const items = [...menu.querySelectorAll('a, button')]
      .filter((el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true');
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
    }
  }, { passive: true });
})();
