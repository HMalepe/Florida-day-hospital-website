/**
 * Renders expandable day-surgery disciplines from data/services.json
 * into [data-services-catalog] lists on the homepage and services page.
 */
(() => {
  const roots = [...document.querySelectorAll('[data-services-catalog]')];
  if (!roots.length) return;

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const pad = (n) => String(n).padStart(2, '0');
  const MOBILE_PREVIEW_COUNT = 4;

  const renderItem = (service, index, { detailsBase }) => {
    const localOnly = !detailsBase;
    const href = localOnly ? `#${service.id}` : `${detailsBase}#${service.id}`;
    const ctaLabel = localOnly ? 'Jump to full details' : 'Full details';
    const list = service.procedures || [];
    const procedures = list
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');
    const name = escapeHtml(service.name);
    const extra = Math.max(0, list.length - MOBILE_PREVIEW_COUNT);
    const moreBtn =
      extra > 0
        ? `<button
          type="button"
          class="services-editorial__more-btn"
          aria-expanded="false"
        >
          <span class="services-editorial__more-label">Show more</span>
        </button>`
        : '';

    return `
      <li class="services-editorial__item" data-reveal style="--stagger-i:${index}">
        <button
          type="button"
          class="services-editorial__row"
          id="service-trigger-${escapeHtml(service.id)}"
          aria-expanded="false"
          aria-controls="service-panel-${escapeHtml(service.id)}"
          data-preview-id="${escapeHtml(service.id)}"
          data-preview-src="${escapeHtml(service.preview)}"
          data-preview-alt="${escapeHtml(service.previewAlt || service.name)}"
        >
          <span class="services-editorial__index" aria-hidden="true">${pad(index + 1)}</span>
          <span class="services-editorial__name">${name}</span>
          <span class="services-editorial__tag">${escapeHtml(service.tag)}</span>
          <span class="services-editorial__chevron" aria-hidden="true"></span>
        </button>
        <div
          class="services-editorial__panel"
          id="service-panel-${escapeHtml(service.id)}"
          role="region"
          aria-labelledby="service-trigger-${escapeHtml(service.id)}"
          hidden
        >
          <ul class="services-editorial__procedures">
            ${procedures}
          </ul>
          ${moreBtn}
          <p class="services-editorial__panel-cta">
            <a
              class="btn-text"
              href="${escapeHtml(href)}"
              aria-label="${name}: ${ctaLabel}"
            >${ctaLabel} →</a>
          </p>
        </div>
      </li>
    `;
  };

  const setOpen = (item, open) => {
    const btn = item.querySelector('.services-editorial__row');
    const panel = item.querySelector('.services-editorial__panel');
    if (!btn || !panel) return;
    if (open) {
      panel.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
      item.classList.add('is-open');
    } else {
      panel.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
      item.classList.remove('is-open');
      panel.classList.remove('is-expanded');
      const moreBtn = panel.querySelector('.services-editorial__more-btn');
      if (moreBtn) {
        moreBtn.setAttribute('aria-expanded', 'false');
        const label = moreBtn.querySelector('.services-editorial__more-label');
        if (label) label.textContent = 'Show more';
      }
    }
  };

  const bindMoreToggles = (list) => {
    list.querySelectorAll('.services-editorial__more-btn').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const panel = btn.closest('.services-editorial__panel');
        if (!panel) return;
        const expanding = !panel.classList.contains('is-expanded');
        panel.classList.toggle('is-expanded', expanding);
        btn.setAttribute('aria-expanded', expanding ? 'true' : 'false');
        const label = btn.querySelector('.services-editorial__more-label');
        if (label) {
          label.textContent = expanding ? 'Show less' : 'Show more';
        }
      });
    });
  };

  const bindAccordion = (list) => {
    list.querySelectorAll('.services-editorial__row').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.services-editorial__item');
        const panel = item?.querySelector('.services-editorial__panel');
        if (!item || !panel) return;

        const willOpen = panel.hasAttribute('hidden');
        list.querySelectorAll('.services-editorial__item').forEach((other) => {
          setOpen(other, other === item && willOpen);
        });
      });
    });

    bindMoreToggles(list);

    list.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openItem = list.querySelector('.services-editorial__item.is-open');
      if (!openItem) return;
      event.preventDefault();
      setOpen(openItem, false);
      openItem.querySelector('.services-editorial__row')?.focus();
    });
  };

  /**
   * Nested procedure bodies scroll first; at the edge a short resistance
   * absorbs a little delta, then further wheel/trackpad input scrolls the page.
   */
  const bindProcedureScrollChain = (host) => {
    const RESISTANCE_PX = 48;
    const RESET_MS = 280;

    host.querySelectorAll('.services-detail__body').forEach((body) => {
      let overflow = 0;
      let lastDir = 0;
      let resetTimer = 0;

      const scheduleReset = () => {
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          overflow = 0;
          lastDir = 0;
        }, RESET_MS);
      };

      body.addEventListener(
        'wheel',
        (event) => {
          if (event.ctrlKey) return;

          const maxScroll = Math.max(0, body.scrollHeight - body.clientHeight);
          if (maxScroll < 2) {
            // List fits in the card — pass the gesture to the page.
            event.preventDefault();
            window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' });
            return;
          }

          const atTop = body.scrollTop <= 0.5;
          const atBottom = body.scrollTop >= maxScroll - 0.5;
          const goingUp = event.deltaY < 0;
          const goingDown = event.deltaY > 0;
          const atEdge =
            (atTop && goingUp) || (atBottom && goingDown);

          if (!atEdge) {
            overflow = 0;
            lastDir = 0;
            return;
          }

          const dir = goingDown ? 1 : -1;
          if (dir !== lastDir) {
            overflow = 0;
            lastDir = dir;
          }

          overflow += Math.abs(event.deltaY);
          scheduleReset();

          // Brief pause at the list edge, then chain to the page.
          event.preventDefault();
          if (overflow < RESISTANCE_PX) return;
          window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' });
        },
        { passive: false }
      );
    });
  };

  const renderDetails = (services) => {
    const host = document.querySelector('[data-services-detail]');
    if (!host) return;

    host.innerHTML = services
      .map(
        (service) => `
      <article class="services-detail__item" id="${escapeHtml(service.id)}">
        <div class="services-detail__visual">
          <img
            src="${escapeHtml(service.specialistImage)}"
            alt=""
            width="720"
            height="900"
            loading="lazy"
            decoding="async"
          >
        </div>
        <div class="services-detail__body">
          <p class="t-mono t-mono--xs services-detail__tag">${escapeHtml(service.tag)}</p>
          <h2 class="t-h3">${escapeHtml(service.name)}</h2>
          <p class="t-small">${escapeHtml(service.summary || '')}</p>
          <ul class="services-detail__procedures">
            ${(service.procedures || [])
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join('')}
          </ul>
        </div>
      </article>`
      )
      .join('');

    bindProcedureScrollChain(host);
  };

  const mount = (services) => {
    roots.forEach((root) => {
      // Empty string = same-page anchors (services.html). Missing attr = default.
      const detailsBase = root.hasAttribute('data-details-base')
        ? root.getAttribute('data-details-base')
        : 'services.html';
      root.innerHTML = services
        .map((service, index) => renderItem(service, index, { detailsBase }))
        .join('');
      root.removeAttribute('aria-busy');
      bindAccordion(root);
    });

    renderDetails(services);

    // Honour deep links after async render (e.g. services.html#orthopaedics)
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const target = document.getElementById(hash);
      if (target) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const trigger = document.getElementById(`service-trigger-${hash}`);
          if (trigger && trigger.getAttribute('aria-expanded') !== 'true') {
            trigger.click();
          }
        });
      }
    }

    // Re-bind scroll reveals for dynamically injected service rows
    // (site.js already ran before this catalog mounted).
    if (typeof window.FDH_initReveals === 'function') {
      roots.forEach((root) => window.FDH_initReveals(root));
    } else {
      roots.forEach((root) => {
        root.querySelectorAll('[data-reveal]').forEach((el) => {
          el.classList.add('revealed');
        });
      });
    }

    document.dispatchEvent(
      new CustomEvent('fdh:services-catalog-ready', { detail: { services } })
    );
  };

  const load = async () => {
    roots.forEach((root) => root.setAttribute('aria-busy', 'true'));
    try {
      const res = await fetch('data/services.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      mount(data.services || []);
    } catch (err) {
      console.error('Failed to load services catalog', err);
      roots.forEach((root) => {
        root.removeAttribute('aria-busy');
        root.innerHTML =
          '<li class="services-editorial__item"><p class="t-small" style="padding:1.25rem 0.75rem">Services could not be loaded. Please refresh the page.</p></li>';
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
