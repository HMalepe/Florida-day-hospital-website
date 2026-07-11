// Services list — desktop hover + mobile sticky preview (slow blur in / out).
(() => {
  const stage = document.querySelector('[data-services-preview]');
  if (!stage) return;

  const rows = [...stage.querySelectorAll('.services-editorial__row[data-preview-id]')];
  const preview = stage.querySelector('.services-preview');
  const frame = stage.querySelector('.services-preview__frame');
  const img = stage.querySelector('.services-preview__img');
  const caption = stage.querySelector('.services-preview__caption');
  if (!rows.length || !preview || !frame || !img) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const narrowViewport = window.matchMedia('(max-width: 959px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cache = new Map();
  let activeId = null;
  let loadToken = 0;
  let leaveTimer = 0;
  let swapTimer = 0;
  let rowObserver = null;
  const BLUR_OUT_MS = 420;

  preview.id = 'services-preview-live';

  const isMobileChrome = () =>
    document.documentElement.classList.contains('site-view--mobile') ||
    document.documentElement.classList.contains('site-view--mobile-preview');

  const isTouchLayout = () => isMobileChrome() || narrowViewport.matches || !finePointer.matches;

  const setActive = (row, on) => {
    row.classList.toggle('is-preview-active', on);
    if (on) row.setAttribute('aria-describedby', 'services-preview-live');
    else row.removeAttribute('aria-describedby');
  };

  const clearAll = () => {
    window.clearTimeout(swapTimer);
    rows.forEach((row) => setActive(row, false));
    activeId = null;
    stage.classList.remove('has-preview', 'has-preview-image', 'is-preview-loading');
    preview.classList.remove('is-visible', 'has-image', 'is-popping', 'is-blurring-out');
    img.removeAttribute('src');
    img.alt = '';
  };

  const bumpBlurIn = () => {
    if (reducedMotion.matches) return;
    preview.classList.remove('is-popping', 'is-blurring-out');
    void frame.offsetWidth;
    preview.classList.add('is-popping');
  };

  const showPlaceholder = (row) => {
    activeId = row.dataset.previewId;
    rows.forEach((r) => setActive(r, r === row));
    stage.classList.add('has-preview');
    stage.classList.remove('has-preview-image');
    preview.classList.add('is-visible');
    preview.classList.remove('has-image', 'is-blurring-out');
    img.removeAttribute('src');
    img.alt = '';
    bumpBlurIn();
  };

  const applyImage = (row, src) => {
    activeId = row.dataset.previewId;
    rows.forEach((r) => setActive(r, r === row));
    stage.classList.add('has-preview', 'has-preview-image');
    stage.classList.remove('is-preview-loading');
    preview.classList.add('is-visible', 'has-image');
    preview.classList.remove('is-blurring-out');
    img.src = src;
    img.alt = row.dataset.previewAlt || '';
    bumpBlurIn();
  };

  const swapTo = (row, next) => {
    window.clearTimeout(swapTimer);
    const id = row.dataset.previewId;

    if (reducedMotion.matches || !preview.classList.contains('is-visible') || !activeId) {
      next();
      return;
    }

    preview.classList.add('is-blurring-out');
    preview.classList.remove('is-popping');
    swapTimer = window.setTimeout(() => {
      if (activeId !== id) return;
      next();
    }, BLUR_OUT_MS);
  };

  const activate = (row) => {
    window.clearTimeout(leaveTimer);

    const id = row.dataset.previewId;
    const src = row.dataset.previewSrc;
    if (!id) return;
    if (
      id === activeId &&
      preview.classList.contains('is-visible') &&
      !preview.classList.contains('is-blurring-out')
    ) {
      return;
    }

    const run = () => {
      if (!src) {
        showPlaceholder(row);
        return;
      }

      const cached = cache.get(src);
      if (cached === true) {
        applyImage(row, src);
        return;
      }
      if (cached === false) {
        showPlaceholder(row);
        return;
      }

      const token = ++loadToken;
      showPlaceholder(row);
      stage.classList.add('is-preview-loading');

      const probe = new Image();
      probe.decoding = 'async';
      probe.onload = () => {
        cache.set(src, true);
        if (token !== loadToken || activeId !== id) return;
        applyImage(row, src);
      };
      probe.onerror = () => {
        cache.set(src, false);
        if (token !== loadToken || activeId !== id) return;
        stage.classList.remove('is-preview-loading');
        showPlaceholder(row);
      };
      probe.src = src;
    };

    activeId = id;
    rows.forEach((r) => setActive(r, r === row));
    swapTo(row, run);
  };

  const scheduleClear = () => {
    if (isTouchLayout()) return;
    window.clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(() => {
      if (reducedMotion.matches) {
        clearAll();
        return;
      }
      preview.classList.add('is-blurring-out');
      window.setTimeout(clearAll, 520);
    }, 140);
  };

  const pickCenteredRow = () => {
    const mid = window.innerHeight * 0.42;
    let best = null;
    let bestDist = Infinity;
    rows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      if (rect.bottom < 80 || rect.top > window.innerHeight - 40) return;
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = row;
      }
    });
    return best;
  };

  const syncFromScroll = () => {
    if (!isTouchLayout()) return;
    const row = pickCenteredRow();
    if (row) activate(row);
  };

  const bindRowObserver = () => {
    if (rowObserver) {
      rowObserver.disconnect();
      rowObserver = null;
    }
    if (!isTouchLayout() || !('IntersectionObserver' in window)) return;

    rowObserver = new IntersectionObserver(
      () => {
        syncFromScroll();
      },
      {
        root: null,
        rootMargin: '-28% 0px -48% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );
    rows.forEach((row) => rowObserver.observe(row));
  };

  rows.forEach((row) => {
    row.addEventListener('pointerenter', () => {
      if (!isTouchLayout()) activate(row);
    });
    row.addEventListener('focus', () => activate(row));

    row.addEventListener('click', (event) => {
      if (!isTouchLayout()) return;
      const id = row.dataset.previewId;
      const alreadyShowing =
        id === activeId &&
        preview.classList.contains('is-visible') &&
        preview.classList.contains('has-image');

      // First tap peeks the HD preview; second tap follows the link.
      if (!alreadyShowing) {
        event.preventDefault();
        activate(row);
        row.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      }
    });
  });

  stage.addEventListener('pointerleave', (event) => {
    if (isTouchLayout()) return;
    if (!stage.contains(event.relatedTarget)) scheduleClear();
  });

  stage.addEventListener('focusout', (event) => {
    if (isTouchLayout()) return;
    if (!stage.contains(event.relatedTarget)) scheduleClear();
  });

  let scrollTick = 0;
  const onScroll = () => {
    if (!isTouchLayout()) return;
    if (scrollTick) return;
    scrollTick = window.requestAnimationFrame(() => {
      scrollTick = 0;
      syncFromScroll();
    });
  };

  const syncCapability = () => {
    const touch = isTouchLayout();
    const desktopHover = finePointer.matches && !touch;
    const wasTouch = stage.classList.contains('services-editorial-stage--touch');

    stage.classList.toggle('services-editorial-stage--hoverable', desktopHover);
    stage.classList.toggle('services-editorial-stage--touch', touch);

    if (caption) {
      caption.textContent = touch ? 'Tap a service' : 'Hover a service';
    }

    bindRowObserver();

    if (touch) {
      window.addEventListener('scroll', onScroll, { passive: true });
      if (!wasTouch || !activeId) {
        window.requestAnimationFrame(() => {
          const seed = pickCenteredRow() || rows[0];
          if (seed) activate(seed);
        });
      }
    } else {
      window.removeEventListener('scroll', onScroll);
      if (wasTouch) clearAll();
    }
  };

  finePointer.addEventListener('change', syncCapability);
  narrowViewport.addEventListener('change', syncCapability);
  reducedMotion.addEventListener('change', () => {
    stage.classList.toggle('services-editorial-stage--reduced', reducedMotion.matches);
  });

  // Desktop preview chrome can toggle mobile classes without a resize.
  const htmlObserver = new MutationObserver(() => syncCapability());
  htmlObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  stage.classList.toggle('services-editorial-stage--reduced', reducedMotion.matches);
  syncCapability();

  const warm = () => {
    rows.forEach((row) => {
      const src = row.dataset.previewSrc;
      if (!src || cache.has(src)) return;
      const probe = new Image();
      probe.decoding = 'async';
      probe.onload = () => cache.set(src, true);
      probe.onerror = () => cache.set(src, false);
      probe.src = src;
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(warm, { timeout: 1800 });
  } else {
    window.setTimeout(warm, 700);
  }
})();
