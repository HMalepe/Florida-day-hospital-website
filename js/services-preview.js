// Services list — desktop far-right hover; mobile tap-to-peek inline thumb.
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
  const BLUR_OUT_MS = 320;

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

  const clearThumbs = () => {
    rows.forEach((row) => {
      const thumb = row.querySelector('.services-editorial__thumb');
      const thumbImg = thumb?.querySelector('img');
      thumb?.classList.remove('is-visible', 'has-image', 'is-popping');
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

  const applyThumb = (row, src) => {
    activeId = row.dataset.previewId;
    rows.forEach((r) => {
      setActive(r, r === row);
      const thumb = r.querySelector('.services-editorial__thumb');
      const thumbImg = thumb?.querySelector('img');
      if (!thumb || !thumbImg) return;
      if (r !== row) {
        thumb.classList.remove('is-visible', 'has-image', 'is-popping');
        thumbImg.removeAttribute('src');
        thumbImg.alt = '';
        return;
      }
      thumb.classList.add('is-visible', 'has-image');
      thumbImg.src = src;
      thumbImg.alt = row.dataset.previewAlt || '';
      bumpBlurIn(thumb);
    });
    stage.classList.add('has-preview', 'has-preview-image');
    stage.classList.remove('is-preview-loading');
    preview.classList.remove('is-visible', 'has-image', 'is-popping', 'is-blurring-out');
  };

  const swapTo = (row, next) => {
    window.clearTimeout(swapTimer);
    const id = row.dataset.previewId;
    const touch = isTouchLayout();

    if (reducedMotion.matches || !activeId || (touch ? activeId === id : !preview.classList.contains('is-visible'))) {
      next();
      return;
    }

    if (!touch) {
      preview.classList.add('is-blurring-out');
      preview.classList.remove('is-popping');
    }

    swapTimer = window.setTimeout(() => {
      if (activeId !== id) return;
      next();
    }, touch ? 80 : BLUR_OUT_MS);
  };

  const activate = (row) => {
    window.clearTimeout(leaveTimer);

    const id = row.dataset.previewId;
    const src = row.dataset.previewSrc;
    const touch = isTouchLayout();
    if (!id) return;

    if (touch) {
      const thumb = row.querySelector('.services-editorial__thumb');
      if (
        id === activeId &&
        thumb?.classList.contains('is-visible') &&
        thumb?.classList.contains('has-image')
      ) {
        return;
      }
    } else if (
      id === activeId &&
      preview.classList.contains('is-visible') &&
      !preview.classList.contains('is-blurring-out')
    ) {
      return;
    }

    const run = () => {
      if (!src) {
        if (touch) {
          activeId = id;
          rows.forEach((r) => setActive(r, r === row));
          clearThumbs();
        } else {
          showDesktopPlaceholder(row);
        }
        return;
      }

      if (cache.get(src) === true) {
        if (touch) applyThumb(row, src);
        else applyDesktopImage(row, src);
        return;
      }

      const token = ++loadToken;
      activeId = id;
      rows.forEach((r) => setActive(r, r === row));
      stage.classList.add('is-preview-loading');

      if (!touch) showDesktopPlaceholder(row);

      const probe = new Image();
      probe.decoding = 'async';
      probe.onload = () => {
        cache.set(src, true);
        if (token !== loadToken || activeId !== id) return;
        if (touch) applyThumb(row, src);
        else applyDesktopImage(row, src);
      };
      probe.onerror = () => {
        cache.set(src, false);
        if (token !== loadToken || activeId !== id) return;
        stage.classList.remove('is-preview-loading');
        if (!touch) showDesktopPlaceholder(row);
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

  const ensureThumbs = () => {
    rows.forEach((row) => {
      if (row.querySelector('.services-editorial__thumb')) return;
      const thumb = document.createElement('span');
      thumb.className = 'services-editorial__thumb';
      thumb.setAttribute('aria-hidden', 'true');
      const thumbImg = document.createElement('img');
      thumbImg.alt = '';
      thumbImg.decoding = 'async';
      thumbImg.loading = 'lazy';
      thumb.appendChild(thumbImg);
      row.appendChild(thumb);
    });
  };

  const bindRows = () => {
    rows.forEach((row) => {
      if (row.dataset.previewBound === '1') return;
      row.dataset.previewBound = '1';

      row.addEventListener('pointerenter', () => {
        if (!isTouchLayout()) activate(row);
      });
      row.addEventListener('focus', () => {
        if (!isTouchLayout()) activate(row);
      });

      // Touch: peek preview while the accordion opens (do not block expand).
      row.addEventListener('click', () => {
        if (!isTouchLayout()) return;
        activate(row);
      });
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

    if (touch) {
      preview.classList.remove('is-visible', 'has-image', 'is-popping', 'is-blurring-out');
      img.removeAttribute('src');
      if (!wasTouch) clearAll();
    } else if (wasTouch) {
      clearAll();
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
    if (isTouchLayout()) return;
    if (!stage.contains(event.relatedTarget)) scheduleClear();
  });

  stage.addEventListener('focusout', (event) => {
    if (isTouchLayout()) return;
    if (!stage.contains(event.relatedTarget)) scheduleClear();
  });

  stage.classList.toggle('services-editorial-stage--reduced', reducedMotion.matches);

  document.addEventListener('fdh:services-catalog-ready', refresh);
  refresh();
})();
