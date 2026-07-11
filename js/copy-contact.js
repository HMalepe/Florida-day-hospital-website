// Copy-to-clipboard for phone, email, and address / directions.
(() => {
  const ADDRESS =
    '25 Jan Hofmeyr Avenue, Florida Park, Roodepoort, 1709';

  const resolveValue = (btn) => {
    const kind = btn.dataset.copyKind;
    if (kind === 'address') return ADDRESS;
    if (kind === 'phone') {
      return (
        window.FDH_CONTACT?.phone?.display ||
        btn.dataset.copyFallback ||
        ''
      ).trim();
    }
    if (kind === 'email') {
      return (
        window.FDH_CONTACT?.email?.address ||
        window.FDH_CONTACT?.email?.display ||
        btn.dataset.copyFallback ||
        ''
      ).trim();
    }
    return (btn.dataset.copy || '').trim();
  };

  const flash = (btn, ok) => {
    const label = btn.getAttribute('aria-label') || 'Copy';
    btn.classList.toggle('is-copied', ok);
    btn.classList.toggle('is-copy-failed', !ok);
    btn.setAttribute('aria-label', ok ? 'Copied' : 'Copy failed');
    window.setTimeout(() => {
      btn.classList.remove('is-copied', 'is-copy-failed');
      btn.setAttribute('aria-label', label);
    }, 1600);
  };

  const write = async (text) => {
    if (!text) throw new Error('Nothing to copy');
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('Copy command failed');
  };

  const onClick = async (event) => {
    const btn = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    try {
      await write(resolveValue(btn));
      flash(btn, true);
    } catch {
      flash(btn, false);
    }
  };

  const bind = () => {
    document.querySelectorAll('[data-copy-kind], [data-copy]').forEach((btn) => {
      if (btn.dataset.copyBound === '1') return;
      btn.dataset.copyBound = '1';
      btn.addEventListener('click', onClick);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  document.addEventListener('fdh:contact-ready', bind);
})();
