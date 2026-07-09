// CMS-driven facility photography — edit data/photography.json, not this file.
(() => {
  const esc = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const isPlaceholder = (value) =>
    !value || /PLACEHOLDER/i.test(String(value));

  const slotActive = (slot) => {
    if (!slot || slot.enabled === false) return false;
    const candidates = [
      slot.fallback,
      ...(slot.variants || []).map((v) => v.src),
    ];
    return candidates.some((src) => src && !isPlaceholder(src));
  };

  const escAttr = (str) => String(str).replace(/"/g, '&quot;');

  const buildSrcset = (variants) =>
    (variants || [])
      .filter((v) => v.src && !isPlaceholder(v.src))
      .map((v) => `${v.src} ${v.width}w`)
      .join(', ');

  const pickPreloadHref = (slot) => {
    const valid = (slot.variants || []).filter((v) => v.src && !isPlaceholder(v.src));
    if (!valid.length) return slot.fallback && !isPlaceholder(slot.fallback) ? slot.fallback : null;
    return valid.sort((a, b) => b.width - a.width)[0].src;
  };

  const injectHeroPreload = (slot) => {
    if (!slot?.lcp || !slotActive(slot)) return;
    if (document.querySelector('link[data-fdh-hero-preload]')) return;

    const href = pickPreloadHref(slot);
    if (!href) return;

    const srcset = buildSrcset(slot.variants);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.fetchPriority = 'high';
    link.dataset.fdhHeroPreload = '';
    if (srcset) {
      link.setAttribute('imagesrcset', srcset);
      link.setAttribute('imagesizes', slot.sizes || '100vw');
    }
    document.head.appendChild(link);
  };

  const renderImg = (slot) => {
    const srcset = buildSrcset(slot.variants);
    const fallback = slot.fallback && !isPlaceholder(slot.fallback)
      ? slot.fallback
      : (slot.variants || []).find((v) => v.src && !isPlaceholder(v.src))?.src;

    if (!fallback) return '';

    const loading = slot.loading || 'lazy';
    const fetchPriority = slot.fetchPriority ? ` fetchpriority="${esc(slot.fetchPriority)}"` : '';
    const alt = slot.decorative || !slot.alt || isPlaceholder(slot.alt)
      ? ' alt=""'
      : ` alt="${esc(slot.alt)}"`;
    const decorative = slot.decorative ? ' role="presentation"' : '';

    return `<img class="fdh-photo__img" src="${escAttr(fallback)}"${
      srcset ? ` srcset="${escAttr(srcset)}" sizes="${escAttr(slot.sizes || '100vw')}"` : ''
    } width="${slot.width}" height="${slot.height}"${alt}${decorative} loading="${loading}" decoding="async"${fetchPriority}>`;
  };

  const applySlot = (mount, slot, slotId) => {
    if (!slotActive(slot)) {
      mount.classList.remove('has-image');
      mount.innerHTML = '';
      return;
    }

    mount.classList.add('has-image');
    mount.innerHTML = renderImg(slot);

    const img = mount.querySelector('.fdh-photo__img');
    if (img) {
      img.addEventListener('error', () => {
        mount.classList.remove('has-image');
        mount.innerHTML = '';
        mount.closest('.hero')?.classList.remove('has-hero-image', 'has-hero-bg');
        mount.closest('.day-pathway')?.classList.remove('has-pathway-photo');
        mount.closest('.providers')?.classList.remove('has-providers-photo');
        mount.closest('.book')?.classList.remove('has-booking-photo');
      }, { once: true });
    }

    if (slotId === 'hero') {
      const hero = mount.closest('.hero');
      hero?.classList.add('has-hero-image');
      if (mount.classList.contains('hero__bg')) {
        hero?.classList.add('has-hero-bg');
      }
    }
    if (slotId === 'pathwayAccent') {
      mount.closest('.day-pathway')?.classList.add('has-pathway-photo');
    }
    if (slotId === 'providers') {
      mount.closest('.providers')?.classList.add('has-providers-photo');
    }
    if (slotId === 'booking') {
      mount.closest('.book')?.classList.add('has-booking-photo');
    }
  };

  let cache = null;

  const loadPhotography = async () => {
    if (cache) return cache;
    const res = await fetch('data/photography.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cache = await res.json();
    return cache;
  };

  const mountAll = async () => {
    const mounts = document.querySelectorAll('[data-photo-slot]');
    if (!mounts.length) return;

    let data;
    try {
      data = await loadPhotography();
    } catch {
      return;
    }

    const slots = data.slots || {};
    injectHeroPreload(slots.hero);

    mounts.forEach((mount) => {
      const slotId = mount.dataset.photoSlot;
      applySlot(mount, slots[slotId], slotId);
    });
  };

  if (document.querySelector('[data-photo-slot]')) {
    loadPhotography()
      .then((data) => injectHeroPreload(data.slots?.hero))
      .catch(() => {});

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountAll);
    } else {
      mountAll();
    }
  }
})();
