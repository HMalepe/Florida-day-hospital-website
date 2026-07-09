// CMS-driven trust ledger — edit data/trust.json, not this file.
(() => {
  const esc = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const isPlaceholder = (value) =>
    !value || /PLACEHOLDER/i.test(String(value));

  // PUBLIC-SAFETY RULE: unverified values are never rendered. A pending
  // credential is invisible, not flagged — visitors must never see raw
  // tokens or editorial notes. Edit data/trust.json to publish values.

  const renderRegistration = (registration) => {
    // A registration claim needs a real number; the authority alone is
    // not a verifiable credential.
    if (isPlaceholder(registration?.number)) return '';
    const label = registration?.label || 'Facility registration';
    const authority = isPlaceholder(registration?.authority)
      ? ''
      : `<p class="trust-strip__meta t-small">${esc(registration.authority)}</p>`;

    return `
      <div class="trust-strip__block">
        <h3 class="trust-strip__label t-mono t-mono--xs">${esc(label)}</h3>
        <p class="trust-strip__value">${esc(registration.number)}</p>
        ${authority}
      </div>`;
  };

  const renderAccreditations = (accreditations) => {
    const verified = (accreditations || []).filter((item) => !isPlaceholder(item.body));
    if (!verified.length) return '';
    const items = verified.map((item) => `
      <li class="trust-strip__accreditation">
        <span class="trust-strip__value">${esc(item.body)}</span>
        ${isPlaceholder(item.reference) ? '' : `<span class="trust-strip__meta t-mono t-mono--xs">${esc(item.reference)}</span>`}
      </li>`).join('');

    return `
      <div class="trust-strip__block">
        <h3 class="trust-strip__label t-mono t-mono--xs">Accreditation</h3>
        <ul class="trust-strip__accreditations">${items}</ul>
      </div>`;
  };

  // The scheme roster is a factual acceptance claim. Until FDH confirms
  // it (medicalAidsProvisional: false in trust.json), no scheme names
  // are published — only an honest "we confirm when you book" line.
  const isProvisional = (data) => data.medicalAidsProvisional !== false;

  const renderSchemesList = (data, headingLevel = 'h3') => {
    if (isProvisional(data)) {
      return `
      <${headingLevel} class="trust-schemes__heading t-h3">Medical aid cover</${headingLevel}>
      <p class="trust-schemes__note t-small">Most major medical aid schemes are recognised for day procedures. We confirm your scheme, plan and benefits when you book — before you travel.</p>`;
    }
    const verified = (data.medicalAids || []).filter((item) => !isPlaceholder(item.name));
    const items = verified.map((item) => `<li>${esc(item.name)}</li>`).join('');
    return `
      <${headingLevel} class="trust-schemes__heading t-h3">Accepted medical aids</${headingLevel}>
      <ul class="trust-schemes__list t-small" aria-label="Accepted medical aid schemes">${items}</ul>
      <p class="trust-schemes__note t-small">Cover depends on your plan and procedure — confirm yours when you book.</p>`;
  };

  const renderFull = (data) => {
    const medicalAidHref = document.getElementById('medical-aid')
      ? '#medical-aid'
      : 'index.html#medical-aid';

    const registration = renderRegistration(data.registration);
    const accreditations = renderAccreditations(data.accreditations);
    const hasCredentials = Boolean(registration || accreditations);

    const eyebrow = hasCredentials ? 'Verifiable credentials' : 'Cover &amp; payment';
    const heading = hasCredentials
      ? 'Registered facility &amp; accepted cover'
      : 'Medical aid &amp; payment';

    const ledger = `
        <div class="trust-strip__ledger">
          ${registration}
          ${accreditations}
          <div class="trust-strip__block trust-strip__block--schemes" id="trust-schemes">
            ${renderSchemesList(data)}
            <p class="trust-schemes__crosslink t-small"><a href="${medicalAidHref}">How we help with medical aid &amp; payment ↑</a></p>
          </div>
        </div>`;

    const isMobile = window.matchMedia('(max-width: 767px)').matches
      && !document.documentElement.classList.contains('site-view--desktop');

    const ledgerBlock = isMobile
      ? `<details class="trust-fold fdh-fold">
          <summary>
            View registration &amp; scheme details
            <span class="fdh-fold__chevron" aria-hidden="true">▼</span>
          </summary>
          ${ledger}
        </details>`
      : ledger;

    return `
    <section class="trust-strip trust-strip--full" id="trust-ledger" aria-labelledby="trust-ledger-heading">
      <div class="wrap trust-strip__inner">
        <header class="trust-strip__header">
          <p class="t-eyebrow">${eyebrow}</p>
          <h2 class="t-h3" id="trust-ledger-heading">${heading}</h2>
        </header>
        ${ledgerBlock}
      </div>
    </section>`;
  };

  const renderSchemes = (data) => `
    <div class="trust-schemes" id="accepted-schemes">
      ${renderSchemesList(data, 'h3')}
    </div>`;

  const renderBooking = (data) => {
    const number = data.registration?.number;
    const label = data.registration?.label || 'Facility registration';
    const registrationRow = isPlaceholder(number) ? '' : `
        <dl class="trust-strip__compact">
          <div class="trust-strip__compact-row">
            <dt class="t-mono t-mono--xs">${esc(label)}</dt>
            <dd>${esc(number)}</dd>
          </div>
        </dl>`;

    const onMedicalAid = /medical-aid\.html$/i.test(window.location.pathname);
    const medicalAidHref = onMedicalAid ? '#accepted-schemes' : 'medical-aid.html';

    return `
      <aside class="trust-strip trust-strip--booking" aria-label="Medical aid and facility information">
        ${registrationRow}
        <p class="trust-strip__booking-note t-small">
          We confirm your medical aid cover and costs when you book —
          <a href="${medicalAidHref}">how cover works</a>
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

    if (typeof window.FDH_syncFolds === 'function') {
      window.FDH_syncFolds();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }
})();
