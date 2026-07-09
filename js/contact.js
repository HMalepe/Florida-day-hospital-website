// Site-wide contact hydration — edit data/contact.json, not this file.
(() => {
  const TEL_TOKEN = 'TEL_PLACEHOLDER';
  const EMAIL_TOKEN = 'EMAIL_PLACEHOLDER';

  const isPlaceholder = (value) =>
    !value || /PLACEHOLDER/i.test(String(value));

  const applyContact = (contact) => {
    const phone = contact.phone || {};
    const email = contact.email || {};

    const phoneDisplay = phone.pending || !phone.tel
      ? (phone.display || 'Enquire when booking')
      : phone.display;
    const phoneTel = phone.pending || !phone.tel ? '' : phone.tel;

    const emailDisplay = email.pending || !email.address
      ? (email.display || 'Enquire when booking')
      : email.display;
    const emailAddress = email.pending || !email.address ? '' : email.address;

    window.FDH_CONTACT = {
      phone: { display: phoneDisplay, tel: phoneTel, pending: !phoneTel },
      email: { display: emailDisplay, address: emailAddress, pending: !emailAddress },
    };

    const walk = (root) => {
      const nodes = root.querySelectorAll
        ? root.querySelectorAll('a[href*="TEL_PLACEHOLDER"], a[href*="EMAIL_PLACEHOLDER"]')
        : [];

      nodes.forEach((el) => {
        const href = el.getAttribute('href') || '';

        if (href.includes(TEL_TOKEN)) {
          if (phoneTel) {
            el.setAttribute('href', `tel:${phoneTel}`);
            el.classList.remove('contact-pending');
            el.removeAttribute('aria-disabled');
          } else {
            el.setAttribute('href', 'contact.html#book');
            el.classList.add('contact-pending');
          }
        }

        if (href.includes(EMAIL_TOKEN)) {
          if (emailAddress) {
            el.setAttribute('href', `mailto:${emailAddress}`);
            el.classList.remove('contact-pending');
          } else {
            el.setAttribute('href', 'contact.html#book');
            el.classList.add('contact-pending');
          }
        }

        const replaceText = (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            let text = node.textContent;
            if (text.includes(TEL_TOKEN)) {
              text = text.split(TEL_TOKEN).join(phoneDisplay);
              node.textContent = text;
            }
            if (text.includes(EMAIL_TOKEN)) {
              text = text.split(EMAIL_TOKEN).join(emailDisplay);
              node.textContent = text;
            }
          } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length) {
            node.childNodes.forEach(replaceText);
          }
        };

        replaceText(el);
      });
    };

    walk(document);

    if (phoneTel && window.FDH_SCHEMA?.organization) {
      window.FDH_SCHEMA.organization.telephone = phoneTel;
    }
    if (emailAddress && window.FDH_SCHEMA?.organization) {
      window.FDH_SCHEMA.organization.email = emailAddress;
    }

    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        const org = data['@graph']?.find((node) => node['@type'] === 'MedicalBusiness');
        if (!org) return;
        if (phoneTel) org.telephone = phoneTel;
        if (emailAddress) org.email = emailAddress;
        script.textContent = JSON.stringify(data);
      } catch {
        /* ignore malformed JSON-LD */
      }
    });
  };

  const load = async () => {
    try {
      const res = await fetch('data/contact.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      applyContact(data);
      document.dispatchEvent(new CustomEvent('fdh:contact-ready', { detail: window.FDH_CONTACT }));
    } catch {
      applyContact({
        phone: { display: 'Enquire when booking', tel: '', pending: true },
        email: { display: 'Enquire when booking', address: '', pending: true },
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
