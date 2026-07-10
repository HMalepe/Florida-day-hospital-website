// CMS-driven provider cards — edit data/providers.json, not this file.
(() => {
  const PLACEHOLDER_PHOTO = 'PHOTO_PLACEHOLDER';

  const esc = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const isPlaceholderPhoto = (photo) =>
    !photo || photo === PLACEHOLDER_PHOTO || photo.includes('PLACEHOLDER');

  const renderMeta = (provider) => {
    const rows = [];

    if (provider.hpcsa) {
      rows.push(`<div class="provider-card__meta-row"><dt class="t-mono t-mono--xs">HPCSA</dt><dd>${esc(provider.hpcsa)}</dd></div>`);
    }

    if (provider.languages?.length) {
      rows.push(`<div class="provider-card__meta-row"><dt class="t-mono t-mono--xs">Languages</dt><dd>${esc(provider.languages.join(', '))}</dd></div>`);
    }

    if (!rows.length) return '';
    return `<dl class="provider-card__meta">${rows.join('')}</dl>`;
  };

  const renderPhoto = (provider, type) => {
    if (type === 'unallocated') return '';

    const usePlaceholderSlot = type === 'placeholder' || isPlaceholderPhoto(provider.photo);

    if (usePlaceholderSlot) {
      return `
        <div class="provider-card__photo provider-card__photo--empty">
          <span class="t-mono t-mono--xs provider-card__photo-label">${esc(provider.photo || PLACEHOLDER_PHOTO)}</span>
        </div>`;
    }

    const grain = provider.leaderReveal
      ? '<div class="leader-card__grain" aria-hidden="true"></div>'
      : '';

    return `
      <div class="provider-card__photo">
        ${grain}
        <img src="${esc(provider.photo)}" alt="${esc(provider.photoAlt || provider.name)}" width="320" height="240" loading="lazy">
      </div>`;
  };

  const renderConfirmed = (provider, index) => {
    const leaderAttrs = provider.leaderReveal ? ' data-team-leader aria-labelledby="provider-yonela"' : '';
    const nameId = provider.leaderReveal ? ' id="provider-yonela"' : '';

    return `
      <li class="providers-grid__item">
        <article class="provider-card provider-card--confirmed${provider.type === 'placeholder' ? ' provider-card--placeholder' : ''}" data-reveal-fly style="--fly-i:${index}"${leaderAttrs}>
          ${renderPhoto(provider, provider.type)}
          <div class="provider-card__body">
            ${provider.type === 'placeholder' ? '<p class="t-mono t-mono--xs provider-card__badge">Profile pending — replace placeholders in data/providers.json</p>' : ''}
            <h3 class="t-title-sm provider-card__name"${nameId}>${esc(provider.name)}</h3>
            <p class="provider-card__role">${esc(provider.role)}</p>
            <p class="provider-card__discipline">${esc(provider.discipline)}</p>
            ${provider.note ? `<p class="t-small provider-card__note">${esc(provider.note)}</p>` : ''}
            ${renderMeta(provider)}
          </div>
        </article>
      </li>`;
  };

  const renderUnallocated = (provider, index) => `
    <li class="providers-grid__item">
      <article class="provider-card provider-card--unallocated" data-reveal-fly style="--fly-i:${index}">
        <div class="provider-card__body">
          <p class="t-title-sm provider-card__discipline">${esc(provider.discipline)}</p>
          <p class="t-mono t-mono--sm provider-card__status">Visiting specialist — allocated at booking</p>
          ${provider.description ? `<p class="t-small provider-card__note">${esc(provider.description)}</p>` : ''}
        </div>
      </article>
    </li>`;

  const renderProvider = (provider, index) => {
    if (provider.type === 'unallocated') return renderUnallocated(provider, index);
    return renderConfirmed(provider, index);
  };

  const mountAll = async () => {
    const mounts = document.querySelectorAll('[data-providers-mount]');
    if (!mounts.length) return;

    let data;
    try {
      const res = await fetch('data/providers.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      mounts.forEach((el) => {
        el.innerHTML = '<li class="providers-grid__item"><p class="t-small">Provider profiles could not be loaded. Please refresh, or call us directly.</p></li>';
      });
      return;
    }

    const providers = data.providers || [];

    mounts.forEach((mount) => {
      let list = providers;
      const filter = mount.dataset.providersFilter;
      if (filter === 'visiting') {
        list = list.filter((p) => p.type === 'unallocated');
      } else if (filter === 'confirmed') {
        list = list.filter((p) => p.type === 'confirmed' || p.type === 'placeholder');
      }

      const html = list.map((p, i) => renderProvider(p, i)).join('');
      mount.innerHTML = html;
    });

    if (typeof window.FDH_initReveals === 'function') {
      window.FDH_initReveals();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }
})();
