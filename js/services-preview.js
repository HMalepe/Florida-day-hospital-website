// Services list — desktop far-right hover; mobile tap-to-peek inline thumb.
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
  const BLUR_OUT_MS = 320;

  preview.id = 'services-preview-live';

  // Inline thumbs for mobile — sit in the red-box slot on the right of each row
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

      const cached = cache.get(src);
      if (cached === true) {
        if (touch) applyThumb(row, src);
        else applyDesktopImage(row, src);
        return;
      }
      if (cached === false) {
        if (touch) {
          activeId = id;
          rows.forEach((r) => setActive(r, r === row));
        } else {
          showDesktopPlaceholder(row);
        }
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

  rows.forEach((row) => {
    row.addEventListener('pointerenter', () => {
      if (!isTouchLayout()) activate(row);
    });
    row.addEventListener('focus', () => {
      if (!isTouchLayout()) activate(row);
    });

    row.addEventListener('click', (event) => {
      if (!isTouchLayout()) return;
      const id = row.dataset.previewId;
      const thumb = row.querySelector('.services-editorial__thumb');
      const alreadyShowing =
        id === activeId &&
        thumb?.classList.contains('is-visible') &&
        thumb?.classList.contains('has-image');

      // First tap peeks the small thumb; second tap follows the link.
      if (!alreadyShowing) {
        event.preventDefault();
        activate(row);
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
