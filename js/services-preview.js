// Services list — desktop far-right hover; mobile scroll-focus inline thumbs.
// Re-binds after js/services-catalog.js renders the expandable list.
(() => {
  const stage = document.querySelector('[data-services-preview]');
  if (!stage) return;

  const preview = stage.querySelector('.services-preview');
  const frame = stage.querySelector('.services-preview__frame');
  const img = stage.querySelector('.services-preview__img');
  const caption = stage.querySelector('.services-preview__caption');
  if (!preview || !frame || !img) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const narrowViewport = window.matchMedia('(max-width: 959px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cache = new Map();
  let rows = [];
  let activeId = null;
  let loadToken = 0;
  let leaveTimer = 0;
  let swapTimer = 0;
  let focusRaf = 0;
  let scrollBound = false;
  const BLUR_OUT_MS = 320;
  // Row must be almost fully on-screen; half clipped stays blurred.
  const VISIBLE_RATIO = 0.92;

  preview.id = 'services-preview-live';

  const isMobileChrome = () =>
    document.documentElement.classList.contains('site-view--mobile') ||
    document.documentElement.classList.contains('site-view--mobile-preview');

  const isTouchLayout = () => isMobileChrome() || narrowViewport.matches || !finePointer.matches;

  // Desktop hover preview only — never on mobile chrome / coarse pointers
  const canHoverPreview = () =>
    finePointer.matches && !isMobileChrome() && !narrowViewport.matches;

  const setActive = (row, on) => {
    row.classList.toggle('is-preview-active', on);
    if (on) row.setAttribute('aria-describedby', 'services-preview-live');
    else row.removeAttribute('aria-describedby');
  };

  const clearThumbFocus = () => {
    rows.forEach((row) => {
      const thumb = row.querySelector('.services-editorial__thumb');
      thumb?.classList.remove('is-focused', 'is-popping');
      setActive(row, false);
    });
    activeId = null;
  };

  const clearThumbs = () => {
    rows.forEach((row) => {
      const thumb = row.querySelector('.services-editorial__thumb');
      const thumbImg = thumb?.querySelector('img');
      thumb?.classList.remove('is-visible', 'has-image', 'is-popping', 'is-focused');
      if (thumbImg) {
        thumbImg.removeAttribute('src');
        thumbImg.alt = '';
      }
    });
  };

  const clearAll = () => {
    window.clearTimeout(swapTimer);
    rows.forEach((row) => setActive(row, false));
    activeId = null;
    stage.classList.remove('has-preview', 'has-preview-image', 'is-preview-loading');
    preview.classList.remove('is-visible', 'has-image', 'is-popping', 'is-blurring-out');
    img.removeAttribute('src');
    img.alt = '';
    clearThumbs();
  };

  const bumpBlurIn = (el) => {
    if (reducedMotion.matches || !el) return;
    el.classList.remove('is-popping');
    void el.offsetWidth;
    el.classList.add('is-popping');
  };

  const showDesktopPlaceholder = (row) => {
    activeId = row.dataset.previewId;
    rows.forEach((r) => setActive(r, r === row));
    stage.classList.add('has-preview');
    stage.classList.remove('has-preview-image');
    preview.classList.add('is-visible');
    preview.classList.remove('has-image', 'is-blurring-out');
    img.removeAttribute('src');
    img.alt = '';
    bumpBlurIn(preview);
  };

  const applyDesktopImage = (row, src) => {
    activeId = row.dataset.previewId;
    rows.forEach((r) => setActive(r, r === row));
    stage.classList.add('has-preview', 'has-preview-image');
    stage.classList.remove('is-preview-loading');
    preview.classList.add('is-visible', 'has-image');
    preview.classList.remove('is-blurring-out');
    img.src = src;
    img.alt = row.dataset.previewAlt || '';
    bumpBlurIn(preview);
  };

  const hydrateThumb = (row) => {
    const src = row.dataset.previewSrc;
    const thumb = row.querySelector('.services-editorial__thumb');
    const thumbImg = thumb?.querySelector('img');
    if (!thumb || !thumbImg || !src) return;

    const apply = () => {
      thumbImg.src = src;
      thumbImg.alt = row.dataset.previewAlt || '';
      thumb.classList.add('is-visible', 'has-image');
    };

    if (cache.get(src) === true) {
      apply();
      return;
    }

    const probe = new Image();
    probe.decoding = 'async';
    probe.onload = () => {
      cache.set(src, true);
      apply();
    };
    probe.onerror = () => cache.set(src, false);
    probe.src = src;
  };

  const hydrateAllThumbs = () => {
    rows.forEach(hydrateThumb);
  };

  const syncThumbFocus = () => {
    if (!isTouchLayout() || !rows.length) return;

    const vh = window.innerHeight;
    const focusY = vh * 0.42;
    let best = null;
    let bestDist = Infinity;

    rows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      const height = Math.max(rect.height, 1);
      const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      const ratio = visible / height;

      // Half (or more) off-screen stays blurred — require nearly full visibility.
      if (ratio < VISIBLE_RATIO) return;

      const mid = (rect.top + rect.bottom) / 2;
      const dist = Math.abs(mid - focusY);
      if (dist < bestDist) {
        bestDist = dist;
        best = row;
      }
    });

    rows.forEach((row) => {
      const thumb = row.querySelector('.services-editorial__thumb');
      if (!thumb) return;
      const on = row === best && thumb.classList.contains('has-image');
      const was = thumb.classList.contains('is-focused');
      thumb.classList.toggle('is-focused', on);
      setActive(row, on);
      if (on && !was) bumpBlurIn(thumb);
    });

    activeId = best?.dataset.previewId || null;
    stage.classList.toggle('has-preview', Boolean(best));
    stage.classList.toggle('has-preview-image', Boolean(best));
  };

  const requestThumbFocus = () => {
    if (focusRaf) return;
    focusRaf = window.requestAnimationFrame(() => {
      focusRaf = 0;
      syncThumbFocus();
    });
  };

  const bindScrollFocus = () => {
    if (scrollBound) return;
    scrollBound = true;
    window.addEventListener('scroll', requestThumbFocus, { passive: true });
    window.addEventListener('resize', requestThumbFocus);
  };

  const unbindScrollFocus = () => {
    if (!scrollBound) return;
    scrollBound = false;
    window.removeEventListener('scroll', requestThumbFocus);
    window.removeEventListener('resize', requestThumbFocus);
  };

  const swapTo = (row, next) => {
    window.clearTimeout(swapTimer);
    const id = row.dataset.previewId;

    if (reducedMotion.matches || !activeId || !preview.classList.contains('is-visible')) {
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

  const activateDesktop = (row) => {
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
        showDesktopPlaceholder(row);
        return;
      }

      if (cache.get(src) === true) {
        applyDesktopImage(row, src);
        return;
      }

      const token = ++loadToken;
      activeId = id;
      rows.forEach((r) => setActive(r, r === row));
      stage.classList.add('is-preview-loading');
      showDesktopPlaceholder(row);

      const probe = new Image();
      probe.decoding = 'async';
      probe.onload = () => {
        cache.set(src, true);
        if (token !== loadToken || activeId !== id) return;
        applyDesktopImage(row, src);
      };
      probe.onerror = () => {
        cache.set(src, false);
        if (token !== loadToken || activeId !== id) return;
        stage.classList.remove('is-preview-loading');
        showDesktopPlaceholder(row);
      };
      probe.src = src;
    };

    activeId = id;
    rows.forEach((r) => setActive(r, r === row));
    swapTo(row, run);
  };

  const scheduleClear = () => {
    if (!canHoverPreview()) return;
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

  const ensureThumbs = () => {
    rows.forEach((row) => {
      if (row.querySelector('.services-editorial__thumb')) return;
      const thumb = document.createElement('span');
      thumb.className = 'services-editorial__thumb';
      thumb.setAttribute('aria-hidden', 'true');
      const thumbImg = document.createElement('img');
      thumbImg.alt = '';
      thumbImg.decoding = 'async';
      thumbImg.loading = 'eager';
      thumb.appendChild(thumbImg);
      row.appendChild(thumb);
    });
  };

  const bindRows = () => {
    rows.forEach((row) => {
      if (row.dataset.previewBound === '1') return;
      row.dataset.previewBound = '1';

      row.addEventListener('pointerenter', () => {
        if (!canHoverPreview()) return;
        activateDesktop(row);
      });
      row.addEventListener('focus', () => {
        if (!canHoverPreview()) return;
        activateDesktop(row);
      });
      row.addEventListener('click', () => {
        if (!isTouchLayout()) return;
        window.setTimeout(requestThumbFocus, 80);
      });
    });
  };

  const syncCapability = () => {
    const touch = isTouchLayout();
    const desktopHover = canHoverPreview();
    const wasTouch = stage.classList.contains('services-editorial-stage--touch');

    stage.classList.toggle('services-editorial-stage--hoverable', desktopHover);
    stage.classList.toggle('services-editorial-stage--touch', touch);

    if (caption) {
      caption.textContent = touch ? 'Scroll a service' : 'Hover a service';
    }

    if (touch) {
      preview.classList.remove('is-visible', 'has-image', 'is-popping', 'is-blurring-out');
      img.removeAttribute('src');
      hydrateAllThumbs();
      bindScrollFocus();
      requestThumbFocus();
    } else {
      unbindScrollFocus();
      clearThumbFocus();
      if (wasTouch) clearAll();
    }
  };

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

  const refresh = () => {
    rows = [...stage.querySelectorAll('.services-editorial__row[data-preview-id]')];
    if (!rows.length) return;
    ensureThumbs();
    bindRows();
    syncCapability();
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(warm, { timeout: 1800 });
    } else {
      window.setTimeout(warm, 700);
    }
  };

  finePointer.addEventListener('change', syncCapability);
  narrowViewport.addEventListener('change', syncCapability);
  reducedMotion.addEventListener('change', () => {
    stage.classList.toggle('services-editorial-stage--reduced', reducedMotion.matches);
  });

  const htmlObserver = new MutationObserver(() => syncCapability());
  htmlObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  stage.addEventListener('pointerleave', (event) => {
    if (!canHoverPreview()) return;
    if (!stage.contains(event.relatedTarget)) scheduleClear();
  });

  stage.addEventListener('focusout', (event) => {
    if (!canHoverPreview()) return;
    if (!stage.contains(event.relatedTarget)) scheduleClear();
  });

  stage.classList.toggle('services-editorial-stage--reduced', reducedMotion.matches);

  document.addEventListener('fdh:services-catalog-ready', refresh);
  refresh();
})();
