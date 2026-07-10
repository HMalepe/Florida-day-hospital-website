// Platform UI — mobile quick actions, section jump nav, folds, desktop-site toggle
(() => {
  const STORAGE_KEY = 'fdh-site-view';
  const MOBILE_LAYOUT_WIDTH = 390;
  const VIEWPORT_MOBILE = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
  const VIEWPORT_MOBILE_LAYOUT = 'width=' + MOBILE_LAYOUT_WIDTH + ', initial-scale=1.0, viewport-fit=cover';
  const VIEWPORT_DESKTOP = 'width=1280';

  const isForcedDesktop = () =>
    document.documentElement.classList.contains('site-view--desktop');

  const isForcedMobile = () =>
    document.documentElement.classList.contains('site-view--mobile');

  const isCompactMobile = () =>
    isForcedMobile()
    || (!isForcedDesktop() && window.matchMedia('(max-width: 767px)').matches);

  const syncMobilePreviewClass = () => {
    const root = document.documentElement;
    root.classList.toggle(
      'site-view--mobile-preview',
      isForcedMobile() && window.screen.width >= 768
    );
  };

  const applySiteView = (view) => {
    const meta = document.querySelector('meta[name="viewport"]');
    const root = document.documentElement;
    root.classList.remove('site-view--desktop', 'site-view--mobile', 'site-view--mobile-preview');

    if (view === 'desktop') {
      root.classList.add('site-view--desktop');
      localStorage.setItem(STORAGE_KEY, 'desktop');
      if (meta) meta.setAttribute('content', VIEWPORT_DESKTOP);
    } else {
      localStorage.setItem(STORAGE_KEY, 'mobile');
      root.classList.add('site-view--mobile');
      if (window.screen.width >= 768) {
        syncMobilePreviewClass();
        if (meta) meta.setAttribute('content', VIEWPORT_MOBILE_LAYOUT);
      } else if (meta) {
        meta.setAttribute('content', VIEWPORT_MOBILE);
      }
    }
    window.location.reload();
  };

  window.FDH_setSiteView = applySiteView;

  const isRealHandheld = () =>
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
    || window.screen.width < 768;

  const getActiveView = () => {
    if (isForcedDesktop()) return 'desktop';
    if (isForcedMobile() || isCompactMobile()) return 'mobile';
    return 'desktop';
  };

  const createSiteViewToggle = () => {
    const wrap = document.createElement('div');
    wrap.className = 'site-view-toggle t-small';

    const desktop = document.createElement('button');
    desktop.type = 'button';
    desktop.className = 'site-view-switch';
    desktop.dataset.siteView = 'desktop';
    desktop.textContent = 'Desktop site';

    const mobile = document.createElement('button');
    mobile.type = 'button';
    mobile.className = 'site-view-switch';
    mobile.dataset.siteView = 'mobile';
    mobile.textContent = 'Mobile site';

    wrap.append(desktop, document.createTextNode(' · '), mobile);
    return wrap;
  };

  const bindSiteViewSwitches = (root) => {
    root.querySelectorAll('.site-view-switch').forEach((btn) => {
      if (btn.dataset.siteViewBound) return;
      btn.dataset.siteViewBound = 'true';
      btn.addEventListener('click', () => {
        applySiteView(btn.dataset.siteView);
      });
    });
  };

  const syncSiteViewSwitches = () => {
    const activeView = getActiveView();
    document.querySelectorAll('.site-view-switch').forEach((btn) => {
      const active = btn.dataset.siteView === activeView;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const ensureTopToolbar = () => {
    if (document.getElementById('site-view-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'site-view-toolbar';
    toolbar.className = 'site-view-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Site layout preview');
    toolbar.hidden = true;

    const label = document.createElement('p');
    label.className = 'site-view-toolbar__label t-small';
    label.textContent = 'Preview layout';

    const hint = document.createElement('p');
    hint.className = 'site-view-toolbar__hint t-small';
    hint.hidden = true;
    hint.textContent = 'Desktop layout — scroll sideways to explore the full site.';

    const toggle = createSiteViewToggle();
    toolbar.append(label, toggle, hint);
    document.body.prepend(toolbar);
    bindSiteViewSwitches(toolbar);
  };

  const syncTopToolbar = () => {
    const toolbar = document.getElementById('site-view-toolbar');
    if (!toolbar) return;

    const showOnDesktop = window.screen.width >= 768;
    const showOnPhoneDesktop = isForcedDesktop() && isRealHandheld();
    toolbar.hidden = !(showOnDesktop || showOnPhoneDesktop);

    const hint = toolbar.querySelector('.site-view-toolbar__hint');
    if (hint) hint.hidden = !showOnPhoneDesktop;
  };

  const ensureFooterToggle = () => {
    document.querySelectorAll('.site-footer__strip').forEach((strip) => {
      if (strip.querySelector('.site-view-toggle')) return;
      strip.appendChild(createSiteViewToggle());
    });

    document.querySelectorAll('.site-footer__strip').forEach((strip) => {
      bindSiteViewSwitches(strip);
    });

    syncSiteViewSwitches();
  };

  ensureTopToolbar();
  ensureFooterToggle();
  syncTopToolbar();
  syncSiteViewSwitches();

  const mobileBar = document.querySelector('.mobile-bar');
  if (mobileBar) {
    const syncBar = () => {
      document.body.classList.toggle('has-mobile-bar', isCompactMobile());
    };
    syncBar();
    window.matchMedia('(max-width: 767px)').addEventListener('change', syncBar);
  }

  const jump = document.getElementById('mobile-jump');
  if (jump) {
    const track = jump.querySelector('.mobile-jump__track');
    const links = track ? [...track.querySelectorAll('a[href^="#"]')] : [];
    const sections = links
      .map((a) => {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        return el ? { link: a, el } : null;
      })
      .filter(Boolean);

    const hero = document.querySelector('.hero');
    let jumpVisible = false;

    const setJumpVisible = (show) => {
      if (jumpVisible === show) return;
      jumpVisible = show;
      jump.classList.toggle('is-visible', show);
      jump.hidden = !show;
    };

    const onScroll = () => {
      if (!isCompactMobile()) {
        setJumpVisible(false);
        return;
      }
      const threshold = hero ? hero.offsetHeight * 0.55 : 280;
      setJumpVisible(window.scrollY > threshold);
    };

    if (sections.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const activeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const match = sections.find((s) => s.el === entry.target);
            if (!match) return;
            links.forEach((l) => l.classList.remove('is-active'));
            match.link.classList.add('is-active');
          });
        },
        { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
      );
      sections.forEach((s) => activeObserver.observe(s.el));
    }

    let ticking = false;
    const scheduleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    };

    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.matchMedia('(max-width: 767px)').addEventListener('change', onScroll);
    onScroll();
  }

  const syncFolds = () => {
    document.querySelectorAll('.fdh-fold').forEach((fold) => {
      if (!isCompactMobile()) {
        fold.setAttribute('open', '');
      } else if (fold.classList.contains('book__callback-fold')) {
        fold.removeAttribute('open');
      }
    });
  };

  window.FDH_syncFolds = syncFolds;
  syncFolds();
  window.matchMedia('(max-width: 767px)').addEventListener('change', syncFolds);
})();
