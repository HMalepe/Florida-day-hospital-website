document.documentElement.classList.add('js');

// D-01 reveal-stagger — one observer, compositor-only, never re-hide
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveal = (el) => {
    if (el.hasAttribute('data-team-leader')) {
      el.classList.add('team-revealed');
    } else {
      el.classList.add('revealed');
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

// Current-page nav highlight — mark the link matching this page
(() => {
  const links = document.querySelectorAll('.nav-links a');
  if (!links.length) return;
  const here = location.pathname.split('/').pop() || 'index.html';
  links.forEach((link) => {
    const target = (link.getAttribute('href') || '').split('/').pop().split('#')[0];
    if (target && target === here) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
})();

// Mobile menu
(() => {
  const burger = document.querySelector('.nav-burger');
  const menu = document.getElementById('nav-menu');
  if (!burger || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) {
      const firstLink = menu.querySelector('a');
      if (firstLink) firstLink.focus();
    }
  };

  burger.addEventListener('click', () => {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
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
