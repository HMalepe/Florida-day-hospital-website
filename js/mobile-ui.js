// Platform UI — mobile quick actions, section jump nav, folds, desktop-site toggle
(() => {
  const STORAGE_KEY = 'fdh-site-view';
  const VIEWPORT_MOBILE = 'width=device-width, initial-scale=1.0';
  const VIEWPORT_DESKTOP = 'width=1280';

  const isForcedDesktop = () =>
    document.documentElement.classList.contains('site-view--desktop');

  const isCompactMobile = () =>
    !isForcedDesktop() && window.matchMedia('(max-width: 767px)').matches;

  const applySiteView = (view) => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (view === 'desktop') {
      document.documentElement.classList.add('site-view--desktop');
      localStorage.setItem(STORAGE_KEY, 'desktop');
      if (meta) meta.setAttribute('content', VIEWPORT_DESKTOP);
    } else {
      document.documentElement.classList.remove('site-view--desktop');
      localStorage.setItem(STORAGE_KEY, 'mobile');
      if (meta) meta.setAttribute('content', VIEWPORT_MOBILE);
    }
    window.location.reload();
  };

  window.FDH_setSiteView = applySiteView;

  const isRealHandheld = () =>
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
    || window.screen.width < 768;

  const ensureBanner = () => {
    if (document.getElementById('site-view-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'site-view-banner';
    banner.className = 'site-view-banner';
    banner.setAttribute('role', 'status');
    banner.hidden = true;
    banner.innerHTML = `
      <p class="site-view-banner__text t-small">
        Desktop layout — scroll sideways to explore the full site.
      </p>
      <button type="button" class="site-view-banner__btn" data-site-view="mobile">
        Mobile site
      </button>`;
    document.body.prepend(banner);
    banner.querySelector('[data-site-view="mobile"]').addEventListener('click', () => {
      applySiteView('mobile');
    });
  };

  const syncBanner = () => {
    const banner = document.getElementById('site-view-banner');
    if (!banner) return;
    banner.hidden = !(isForcedDesktop() && isRealHandheld());
  };

  const ensureFooterToggle = () => {
    document.querySelectorAll('.site-footer__strip').forEach((strip) => {
      if (strip.querySelector('.site-view-toggle')) return;
      const wrap = document.createElement('p');
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
      strip.appendChild(wrap);
    });

    document.querySelectorAll('.site-view-switch').forEach((btn) => {
      btn.addEventListener('click', () => {
        applySiteView(btn.dataset.siteView);
      });
    });

    document.querySelectorAll('.site-view-switch').forEach((btn) => {
      const active = btn.dataset.siteView === (isForcedDesktop() ? 'desktop' : 'mobile');
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  ensureBanner();
  ensureFooterToggle();
  syncBanner();

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
