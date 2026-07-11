document.documentElement.classList.add('js');

// Scroll-scrubbed reveals — same visual language, driven by scroll both ways
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targets = [];

  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const smoothstep = (t) => {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
  };

  const measureProgress = (el) => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // Scrub across a mid-viewport band (not a one-shot "peek" trigger).
    const start = vh * 0.78;
    const end = vh * 0.32;
    return clamp01((start - rect.top) / Math.max(1, start - end));
  };

  const apply = (el) => {
    const staggerRaw =
      el.style.getPropertyValue('--stagger-i') ||
      getComputedStyle(el).getPropertyValue('--stagger-i');
    const stagger = Number.parseFloat(staggerRaw) || 0;
    const lag = Math.min(0.42, Math.max(0, stagger) * 0.065);
    let p = measureProgress(el);
    p = clamp01((p - lag) / Math.max(0.001, 1 - lag * 0.85));
    p = smoothstep(p);
    el.style.setProperty('--reveal', p.toFixed(4));

    // Keep class hooks for any legacy CSS still keyed to .revealed
    const on = p >= 0.98;
    el.classList.toggle('revealed', on);
    if (el.hasAttribute('data-team-leader')) {
      el.classList.toggle('team-revealed', on);
    }
  };

  const sync = () => {
    for (let i = 0; i < targets.length; i += 1) apply(targets[i]);
  };

  window.FDH_syncReveals = sync;

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
    sync();
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
  if (timeline && !parallaxOK) {
    timeline.style.setProperty('--journey-progress', '1');
    stages.forEach((s) => s.classList.add('is-lit'));
  }

  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : '0');
    // Hero parallax: the visual and text drift apart at different rates
    // while the hero scrolls out. `translate` composes with the CSS
    // float animation's `transform`, so the two never fight.
    if (hero && parallaxOK && y < window.innerHeight * 1.2) {
      hero.style.setProperty('--plx-soft', (y * 0.1).toFixed(1) + 'px');
      hero.style.setProperty('--plx-faint', (y * 0.04).toFixed(1) + 'px');
    }
    if (timeline && parallaxOK) {
      const rect = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      // Scrub the rail fill with scroll — reversible both directions.
      const p = Math.min(
        1,
        Math.max(0, (vh * 0.75 - rect.top) / (rect.height * 0.85 + vh * 0.15))
      );
      timeline.style.setProperty('--journey-progress', p.toFixed(4));
      const n = stages.length;
      stages.forEach((stage, i) => {
        stage.classList.toggle('is-lit', p >= (i + 0.35) / n);
      });
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
