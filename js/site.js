document.documentElement.classList.add('js');

// D-01 reveal-stagger — one observer, compositor-only, never re-hide
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveal = (el) => {
    // An element can carry both mechanisms (e.g. the leader provider card
    // has data-reveal-fly for entry AND data-team-leader for its photo
    // choreography). Always satisfy the :not(.revealed) hide rule, and
    // additionally run the team choreography when marked.
    el.classList.add('revealed');
    if (el.hasAttribute('data-team-leader')) {
      el.classList.add('team-revealed');
    }
  };

  const observed = new WeakSet();
  let observer;

  if (!reducedMotion) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -4% 0px' });
  }

  window.FDH_initReveals = (root = document) => {
    const scope = root === document ? document : root;
    const targets = scope.querySelectorAll('[data-reveal], [data-reveal-fly], [data-team-leader]');
    if (!targets.length) return;

    if (reducedMotion) {
      targets.forEach(reveal);
      return;
    }

    targets.forEach((el) => {
      if (el.classList.contains('revealed') || el.classList.contains('team-revealed')) return;
      if (observed.has(el)) return;
      observed.add(el);
      observer.observe(el);
    });
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
  const stages = timeline ? [...timeline.querySelectorAll('.day-pathway__stage')] : [];
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
      // Starts as the timeline's top crosses 85% of the viewport and
      // completes shortly after it is fully in view — gradual on the
      // tall mobile rail, a clean sweep on the short desktop track.
      const p = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / (rect.height + vh * 0.3)));
      timeline.style.setProperty('--journey-progress', p.toFixed(4));
      const n = stages.length;
      stages.forEach((stage, i) => {
        stage.classList.toggle('is-lit', p >= (i + 0.5) / n);
      });
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

  const current = hash ? `${here}${hash}` : here;

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    if (hrefKey(href) !== current) return;

    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
    link.closest('.nav-dropdown')?.querySelector('.nav-dropdown__trigger')?.classList.add('is-active');
  });
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
