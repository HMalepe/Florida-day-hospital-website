// CMS-driven trust ledger — edit data/trust.json, not this file.
(() => {
  const esc = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const isPlaceholder = (value) =>
    !value || /PLACEHOLDER/i.test(String(value));

  const renderPending = (value) =>
    `<span class="trust-strip__pending t-mono t-mono--xs" title="Confirm with FDH before publishing">${esc(value)}</span>`;

  const renderValue = (value) =>
    isPlaceholder(value) ? renderPending(value) : esc(value);

  const hasPending = (data) => {
    if (isPlaceholder(data.registration?.number) || isPlaceholder(data.registration?.authority)) {
      return true;
    }
    if ((data.accreditations || []).some((item) =>
      isPlaceholder(item.body) || isPlaceholder(item.reference))) {
      return true;
    }
    if ((data.medicalAids || []).some((item) => isPlaceholder(item.name))) {
      return true;
    }
    return false;
  };

  const renderRegistration = (registration) => {
    const label = registration?.label || 'Facility registration';
    const number = registration?.number || 'FACILITY_REGISTRATION_NUMBER_PLACEHOLDER';
    const authority = registration?.authority || 'REGISTRATION_AUTHORITY_PLACEHOLDER';

    return `
      <div class="trust-strip__block">
        <h3 class="trust-strip__label t-mono t-mono--xs">${esc(label)}</h3>
        <p class="trust-strip__value">${renderValue(number)}</p>
        <p class="trust-strip__meta t-small">${renderValue(authority)}</p>
      </div>`;
  };

  const renderAccreditations = (accreditations) => {
    const items = (accreditations || []).map((item) => `
      <li class="trust-strip__accreditation">
        <span class="trust-strip__value">${renderValue(item.body)}</span>
        <span class="trust-strip__meta t-mono t-mono--xs">${renderValue(item.reference)}</span>
      </li>`).join('');

    return `
      <div class="trust-strip__block">
        <h3 class="trust-strip__label t-mono t-mono--xs">Accreditation</h3>
        <ul class="trust-strip__accreditations">${items}</ul>
      </div>`;
  };

  const renderSchemesList = (medicalAids, headingLevel = 'h3') => {
    const items = (medicalAids || []).map((item) =>
      `<li>${renderValue(item.name)}</li>`).join('');

    return `
      <${headingLevel} class="trust-schemes__heading t-h3">Accepted medical aids</${headingLevel}>
      <ul class="trust-schemes__list t-small" aria-label="Accepted medical aid schemes">${items}</ul>
      <p class="trust-schemes__note t-small">Cover depends on your plan and procedure — confirm yours when you book. Scheme list is provisional until FDH confirms the final roster.</p>`;
  };

  const renderPendingNote = () =>
    '<p class="trust-strip__editor-note t-mono t-mono--xs">CONFIRM WITH FDH — placeholder values below must be verified before launch.</p>';

  const renderFull = (data) => {
    const medicalAidHref = document.getElementById('medical-aid')
      ? '#medical-aid'
      : 'index.html#medical-aid';

    return `
    <section class="trust-strip trust-strip--full" id="trust-ledger" aria-labelledby="trust-ledger-heading">
      <div class="wrap trust-strip__inner">
        <header class="trust-strip__header">
          <p class="t-eyebrow">Verifiable credentials</p>
          <h2 class="t-h3" id="trust-ledger-heading">Registered facility &amp; accepted cover</h2>
        </header>
        ${hasPending(data) ? renderPendingNote() : ''}
        <div class="trust-strip__ledger">
          ${renderRegistration(data.registration)}
          ${renderAccreditations(data.accreditations)}
          <div class="trust-strip__block trust-strip__block--schemes" id="trust-schemes">
            ${renderSchemesList(data.medicalAids)}
            <p class="trust-schemes__crosslink t-small"><a href="${medicalAidHref}">How we help with medical aid &amp; payment ↑</a></p>
          </div>
        </div>
      </div>
    </section>`;
  };

  const renderSchemes = (data) => `
    <div class="trust-schemes" id="accepted-schemes">
      ${renderSchemesList(data.medicalAids, 'h3')}
      <p class="trust-schemes__crosslink t-small"><a href="#trust-ledger">Registration &amp; accreditation details ↓</a></p>
    </div>`;

  const renderBooking = (data) => {
    const number = data.registration?.number || 'FACILITY_REGISTRATION_NUMBER_PLACEHOLDER';
    const label = data.registration?.label || 'Facility registration';
    const schemeCount = (data.medicalAids || []).length;
    const onHome = /(^|\/)index\.html?$/.test(window.location.pathname)
      || window.location.pathname.endsWith('/');
    const onMedicalAid = /medical-aid\.html$/i.test(window.location.pathname);
    const schemesHref = (onHome || onMedicalAid) ? '#accepted-schemes' : 'index.html#accepted-schemes';
    const ledgerHref = '#trust-ledger';

    return `
      <aside class="trust-strip trust-strip--booking" aria-label="Facility credentials">
        <dl class="trust-strip__compact">
          <div class="trust-strip__compact-row">
            <dt class="t-mono t-mono--xs">${esc(label)}</dt>
            <dd>${renderValue(number)}</dd>
          </div>
        </dl>
        <p class="trust-strip__booking-note t-small">
          ${schemeCount} scheme slots in the trust ledger —
          <a href="${schemesHref}">accepted medical aids</a>
          · <a href="${ledgerHref}">full credentials</a>
        </p>
      </aside>`;
  };

  const renderVariant = (data, variant) => {
    switch (variant) {
      case 'schemes': return renderSchemes(data);
      case 'booking': return renderBooking(data);
      default: return renderFull(data);
    }
  };

  let cache = null;

  const loadTrust = async () => {
    if (cache) return cache;
    const res = await fetch('data/trust.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cache = await res.json();
    return cache;
  };

  const mountAll = async () => {
    const mounts = document.querySelectorAll('[data-trust-mount]');
    if (!mounts.length) return;

    let data;
    try {
      data = await loadTrust();
    } catch {
      mounts.forEach((el) => {
        el.innerHTML = '<p class="t-small">Credentials could not be loaded. Please refresh, or call us directly.</p>';
      });
      return;
    }

    mounts.forEach((mount) => {
      const variant = mount.dataset.trustVariant || 'full';
      mount.innerHTML = renderVariant(data, variant);
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
