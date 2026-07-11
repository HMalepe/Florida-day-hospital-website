// Services list — far-right hover preview (slow blur in / out).
(() => {
  const stage = document.querySelector('[data-services-preview]');
  if (!stage) return;

  const rows = [...stage.querySelectorAll('.services-editorial__row[data-preview-id]')];
  const preview = stage.querySelector('.services-preview');
  const frame = stage.querySelector('.services-preview__frame');
  const img = stage.querySelector('.services-preview__img');
  if (!rows.length || !preview || !frame || !img) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cache = new Map();
  let activeId = null;
  let loadToken = 0;
  let leaveTimer = 0;
  let swapTimer = 0;
  const BLUR_OUT_MS = 420;

  preview.id = 'services-preview-live';

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
    if (!finePointer.matches) return;
    window.clearTimeout(leaveTimer);

    const id = row.dataset.previewId;
    const src = row.dataset.previewSrc;
    if (!id) return;
    if (id === activeId && preview.classList.contains('is-visible') && !preview.classList.contains('is-blurring-out')) {
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

    // Mark intent early so rapid hover doesn't thrash
    activeId = id;
    rows.forEach((r) => setActive(r, r === row));
    swapTo(row, run);
  };

  const scheduleClear = () => {
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
    row.addEventListener('pointerenter', () => activate(row));
    row.addEventListener('focus', () => activate(row));
  });

  stage.addEventListener('pointerleave', (event) => {
    if (!stage.contains(event.relatedTarget)) scheduleClear();
  });

  stage.addEventListener('focusout', (event) => {
    if (!stage.contains(event.relatedTarget)) scheduleClear();
  });

  const syncCapability = () => {
    stage.classList.toggle('services-editorial-stage--hoverable', finePointer.matches);
    if (!finePointer.matches) clearAll();
  };

  finePointer.addEventListener('change', syncCapability);
  reducedMotion.addEventListener('change', () => {
    stage.classList.toggle('services-editorial-stage--reduced', reducedMotion.matches);
  });

  syncCapability();
  stage.classList.toggle('services-editorial-stage--reduced', reducedMotion.matches);

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
