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
  let dwellTimer = 0;
  let settleTimer = 0;
  let focusRaf = 0;
  let thumbSettleTimer = 0;
  let scrollBound = false;
  let desktopScrollBound = false;
  let pendingRow = null;
  let hoverStartedAt = 0;
  let lastScrollAt = 0;
  // Start unsettled so the first image also waits for settle + hover dwell.
  let pageSettled = false;

  const SCROLL_SETTLE_MS = 3000;
  const HOVER_DWELL_MS = 2500;
  const THUMB_SETTLE_MS = 48;
  const BLUR_OUT_MS = 180;
  const BLUR_CLEAR_MS = 220;
  // Partial visibility is enough — strict ratios made focus skip mid-list rows.
  const VISIBLE_RATIO = 0.32;
  const FOCUS_HYSTERESIS_PX = 40;
  let focusedRow = null;

  preview.id = 'services-preview-live';

  const isMobileChrome = () =>
    document.documentElement.classList.contains('site-view--mobile') ||
    document.documentElement.classList.contains('site-view--mobile-preview');

  const isTouchLayout = () => isMobileChrome() || narrowViewport.matches || !finePointer.matches;

  // Desktop hover preview only — never on mobile chrome / coarse pointers
  const canHoverPreview = () =>
    finePointer.matches && !isMobileChrome() && !narrowViewport.matches;

  const settleMs = () => (reducedMotion.matches ? 200 : SCROLL_SETTLE_MS);
  const dwellMs = () => (reducedMotion.matches ? 150 : HOVER_DWELL_MS);

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
    focusedRow = null;
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

  let swapTimer = 0;

  const bumpBlurIn = (el) => {
    if (reducedMotion.matches || !el) return;
    el.classList.remove('is-popping');
    void el.offsetWidth;
    el.classList.add('is-popping');
  };

  const hideDesktopPreview = (opts = {}) => {
    const { blur = false } = opts;
    window.clearTimeout(dwellTimer);
    window.clearTimeout(swapTimer);
    dwellTimer = 0;
    swapTimer = 0;

    const finish = () => {
      rows.forEach((row) => setActive(row, false));
      activeId = null;
      stage.classList.remove('has-preview', 'has-preview-image', 'is-preview-loading');
      preview.classList.remove('is-visible', 'has-image', 'is-popping', 'is-blurring-out');
      img.removeAttribute('src');
      img.alt = '';
    };

    if (
      blur &&
      !reducedMotion.matches &&
      preview.classList.contains('is-visible')
    ) {
      preview.classList.add('is-blurring-out');
      preview.classList.remove('is-popping');
      swapTimer = window.setTimeout(finish, BLUR_CLEAR_MS);
      return;
    }

    finish();
  };

  const clearAll = () => {
    window.clearTimeout(dwellTimer);
    window.clearTimeout(swapTimer);
    dwellTimer = 0;
    swapTimer = 0;
    pendingRow = null;
    hoverStartedAt = 0;
    rows.forEach((row) => setActive(row, false));
    activeId = null;
    stage.classList.remove('has-preview', 'has-preview-image', 'is-preview-loading');
    preview.classList.remove('is-visible', 'has-image', 'is-popping', 'is-blurring-out');
    img.removeAttribute('src');
    img.alt = '';
    clearThumbs();
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

  const swapThen = (next) => {
    window.clearTimeout(swapTimer);
    if (
      reducedMotion.matches ||
      !preview.classList.contains('is-visible') ||
      !preview.classList.contains('has-image')
    ) {
      next();
      return;
    }

    preview.classList.add('is-blurring-out');
    preview.classList.remove('is-popping');
    swapTimer = window.setTimeout(() => {
      swapTimer = 0;
      next();
    }, BLUR_OUT_MS);
  };

  const revealDesktop = (row) => {
    if (!canHoverPreview() || !pageSettled || row !== pendingRow) return;

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
      if (row !== pendingRow || !pageSettled) return;

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
        if (token !== loadToken || activeId !== id || row !== pendingRow || !pageSettled) return;
        applyDesktopImage(row, src);
      };
      probe.onerror = () => {
        cache.set(src, false);
        if (token !== loadToken || activeId !== id || row !== pendingRow || !pageSettled) return;
        stage.classList.remove('is-preview-loading');
        showDesktopPlaceholder(row);
      };
      probe.src = src;
    };

    swapThen(run);
  };

  const scheduleDesktopReveal = () => {
    window.clearTimeout(dwellTimer);
    dwellTimer = 0;
    if (!canHoverPreview() || !pendingRow) return;

    if (!pageSettled) return;

    const hoveredFor = Date.now() - hoverStartedAt;
    const wait = Math.max(0, dwellMs() - hoveredFor);

    if (wait === 0) {
      revealDesktop(pendingRow);
      return;
    }

    dwellTimer = window.setTimeout(() => {
      dwellTimer = 0;
      if (!pageSettled || !pendingRow) return;
      revealDesktop(pendingRow);
    }, wait);
  };

  const queuePendingRow = (row) => {
    if (!canHoverPreview() || !row) return;
    window.clearTimeout(leaveTimer);

    if (
      pendingRow === row &&
      preview.classList.contains('is-visible') &&
      pageSettled &&
      !preview.classList.contains('is-blurring-out')
    ) {
      return;
    }

    // Moving to a different heading: clear any visible preview immediately,
    // then restart the 1s dwell for the new row.
    if (pendingRow !== row) {
      if (preview.classList.contains('is-visible') || stage.classList.contains('has-preview')) {
        hideDesktopPreview({ blur: false });
      }
      pendingRow = row;
      hoverStartedAt = Date.now();
    }

    scheduleDesktopReveal();
  };

  const markSettledSoon = () => {
    if (!canHoverPreview()) {
      pageSettled = true;
      return;
    }
    lastScrollAt = Date.now();
    pageSettled = false;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (Date.now() - lastScrollAt < settleMs() - 30) return;
      pageSettled = true;
      // Require a fresh 1s hover after scrolling — don't resume mid-dwell.
      if (pendingRow) hoverStartedAt = Date.now();
      scheduleDesktopReveal();
    }, settleMs());
  };

  const onDesktopScroll = () => {
    if (!canHoverPreview()) return;

    lastScrollAt = Date.now();
    pageSettled = false;
    window.clearTimeout(settleTimer);
    window.clearTimeout(dwellTimer);
    dwellTimer = 0;
    // Fast scroll: drop any pending reveal so nothing pops mid-pass.
    pendingRow = null;
    hoverStartedAt = 0;

    // Instant hide — no blur lag while scrolling.
    if (preview.classList.contains('is-visible') || stage.classList.contains('has-preview')) {
      hideDesktopPreview({ blur: false });
    }

    settleTimer = window.setTimeout(() => {
      if (Date.now() - lastScrollAt < settleMs() - 30) return;
      pageSettled = true;
      // Only restart dwell if the cursor is still resting on a heading.
      const hovered = rows.find((row) => row.matches(':hover'));
      if (hovered) queuePendingRow(hovered);
    }, settleMs());
  };

  const bindDesktopScrollGate = () => {
    if (desktopScrollBound) return;
    desktopScrollBound = true;
    window.addEventListener('scroll', onDesktopScroll, { passive: true });
    window.addEventListener('wheel', onDesktopScroll, { passive: true });
    markSettledSoon();
  };

  const unbindDesktopScrollGate = () => {
    if (!desktopScrollBound) return;
    desktopScrollBound = false;
    window.removeEventListener('scroll', onDesktopScroll);
    window.removeEventListener('wheel', onDesktopScroll);
    window.clearTimeout(settleTimer);
    settleTimer = 0;
    pageSettled = true;
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
    const focusY = vh * 0.4;
    let best = null;
    let bestDist = Infinity;

    rows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      const height = Math.max(rect.height, 1);
      const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      const ratio = visible / height;

      if (ratio < VISIBLE_RATIO) return;
      // Prefer the row whose mid-point is nearest the reading line.
      const mid = (rect.top + rect.bottom) / 2;
      const dist = Math.abs(mid - focusY);
      if (dist < bestDist) {
        bestDist = dist;
        best = row;
      }
    });

    // Keep current focus unless a neighbour is clearly closer — stops skip-flicker.
    if (
      focusedRow &&
      best &&
      focusedRow !== best &&
      rows.includes(focusedRow)
    ) {
      const currentRect = focusedRow.getBoundingClientRect();
      const currentVisible = Math.max(
        0,
        Math.min(currentRect.bottom, vh) - Math.max(currentRect.top, 0)
      );
      const currentRatio = currentVisible / Math.max(currentRect.height, 1);
      if (currentRatio >= VISIBLE_RATIO) {
        const currentMid = (currentRect.top + currentRect.bottom) / 2;
        const currentDist = Math.abs(currentMid - focusY);
        if (currentDist - bestDist < FOCUS_HYSTERESIS_PX) {
          best = focusedRow;
        }
      }
    }

    focusedRow = best;

    rows.forEach((row) => {
      const thumb = row.querySelector('.services-editorial__thumb');
      if (!thumb) return;
      const on = row === best && thumb.classList.contains('has-image');
      thumb.classList.toggle('is-focused', on);
      setActive(row, on);
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

  const scheduleThumbFocus = () => {
    requestThumbFocus();
    window.clearTimeout(thumbSettleTimer);
    thumbSettleTimer = window.setTimeout(requestThumbFocus, THUMB_SETTLE_MS);
  };

  const bindScrollFocus = () => {
    if (scrollBound) return;
    scrollBound = true;
    window.addEventListener('scroll', scheduleThumbFocus, { passive: true });
    window.addEventListener('resize', requestThumbFocus);
  };

  const unbindScrollFocus = () => {
    if (!scrollBound) return;
    scrollBound = false;
    window.clearTimeout(thumbSettleTimer);
    thumbSettleTimer = 0;
    window.removeEventListener('scroll', scheduleThumbFocus);
    window.removeEventListener('resize', requestThumbFocus);
  };

  const scheduleClear = () => {
    if (!canHoverPreview()) return;
    window.clearTimeout(leaveTimer);
    leaveTimer = 0;
    pendingRow = null;
    hoverStartedAt = 0;
    window.clearTimeout(dwellTimer);
    dwellTimer = 0;
    // Leave heading: hide immediately (no blur wait).
    hideDesktopPreview({ blur: false });
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
        queuePendingRow(row);
      });
      row.addEventListener('pointerleave', (event) => {
        if (!canHoverPreview()) return;
        const next = event.relatedTarget?.closest?.('.services-editorial__row[data-preview-id]');
        if (next && stage.contains(next)) return;
        if (pendingRow === row || activeId === row.dataset.previewId) {
          scheduleClear();
        }
      });
      row.addEventListener('focus', () => {
        if (!canHoverPreview()) return;
        queuePendingRow(row);
      });
      row.addEventListener('click', () => {
        if (canHoverPreview()) {
          queuePendingRow(row);
          return;
        }
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
      unbindDesktopScrollGate();
      preview.classList.remove('is-visible', 'has-image', 'is-popping', 'is-blurring-out');
      img.removeAttribute('src');
      hydrateAllThumbs();
      bindScrollFocus();
      requestThumbFocus();
    } else {
      unbindScrollFocus();
      clearThumbFocus();
      bindDesktopScrollGate();
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
