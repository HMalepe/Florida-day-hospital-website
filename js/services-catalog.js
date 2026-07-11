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

  const renderItem = (service, index, { detailsBase }) => {
    const href = `${detailsBase}#${service.id}`;
    const procedures = (service.procedures || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');

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
          <span class="services-editorial__index">${pad(index + 1)}</span>
          <span class="services-editorial__name">${escapeHtml(service.name)}</span>
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
          <p class="services-editorial__panel-cta">
            <a class="btn-text" href="${escapeHtml(href)}">Full details →</a>
          </p>
        </div>
      </li>
    `;
  };

  const bindAccordion = (list) => {
    list.querySelectorAll('.services-editorial__row').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.services-editorial__item');
        const panel = item?.querySelector('.services-editorial__panel');
        if (!panel) return;

        const willOpen = panel.hasAttribute('hidden');

        list.querySelectorAll('.services-editorial__item').forEach((other) => {
          const otherBtn = other.querySelector('.services-editorial__row');
          const otherPanel = other.querySelector('.services-editorial__panel');
          if (!otherBtn || !otherPanel) return;
          if (other === item && willOpen) {
            otherPanel.removeAttribute('hidden');
            otherBtn.setAttribute('aria-expanded', 'true');
            other.classList.add('is-open');
          } else {
            otherPanel.setAttribute('hidden', '');
            otherBtn.setAttribute('aria-expanded', 'false');
            other.classList.remove('is-open');
          }
        });
      });
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
  };

  const mount = (services) => {
    roots.forEach((root) => {
      const detailsBase = root.getAttribute('data-details-base') || 'services.html';
      root.innerHTML = services
        .map((service, index) => renderItem(service, index, { detailsBase }))
        .join('');
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

    document.dispatchEvent(
      new CustomEvent('fdh:services-catalog-ready', { detail: { services } })
    );
  };

  const load = async () => {
    try {
      const res = await fetch('data/services.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      mount(data.services || []);
    } catch (err) {
      console.error('Failed to load services catalog', err);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
