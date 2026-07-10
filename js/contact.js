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
            el.setAttribute('href', 'contact.html');
            el.classList.add('contact-pending');
          }
        }

        if (href.includes(EMAIL_TOKEN)) {
          if (emailAddress) {
            el.setAttribute('href', `mailto:${emailAddress}`);
            el.classList.remove('contact-pending');
          } else {
            el.setAttribute('href', 'contact.html');
            el.classList.add('contact-pending');
          }
        }

        const replaceText = (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            let text = node.textContent;
            if (!phoneTel) {
              // Pending phone: compound phrases like "Call TEL_PLACEHOLDER"
              // must not become "Call Enquire when booking".
              text = text
                .replace(/,\s*or call TEL_PLACEHOLDER/g, '')
                .replace(/\b[Cc]all TEL_PLACEHOLDER/g, phoneDisplay);
            }
            if (text.includes(TEL_TOKEN)) {
              text = text.split(TEL_TOKEN).join(phoneDisplay);
            }
            if (text.includes(EMAIL_TOKEN)) {
              text = text.split(EMAIL_TOKEN).join(emailDisplay);
            }
            if (text !== node.textContent) node.textContent = text;
          } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length) {
            node.childNodes.forEach(replaceText);
          }
        };

        replaceText(el);

        // Pending phone: "Call …" labels would mislead — these links now
        // point at the booking form, so say so.
        if (!phoneTel) {
          const label = el.textContent.trim();
          if (label === 'Call now' || label === 'Call us' || label === 'Call') {
            el.textContent = el.classList.contains('nav-cta')
              ? 'Contact us'
              : el.classList.contains('mobile-bar__btn--call')
                ? 'Enquire'
                : 'Enquire when booking';
          }
        }
      });
    };

    walk(document);

    const plainContact = (container, label, text) => {
      if (!container) return;
      container.querySelectorAll('.location__item').forEach((item) => {
        const dt = item.querySelector('dt');
        const dd = item.querySelector('dd');
        if (!dt || !dd || dt.textContent.trim() !== label) return;
        dd.textContent = text;
      });
    };

    if (!phoneTel) {
      plainContact(document, 'Phone', phoneDisplay);
      document.querySelectorAll('.location__cta a.btn-solid.contact-pending').forEach((el) => {
        el.hidden = true;
      });
    }

    if (!emailAddress) {
      plainContact(document, 'Email', emailDisplay);
    }

    document.querySelectorAll('.site-footer__contact p').forEach((p) => {
      const link = p.querySelector('a.contact-pending');
      if (!link) return;
      const span = document.createElement('span');
      span.className = 'site-footer__pending';
      span.textContent = link.textContent.trim();
      p.replaceChildren(span);
    });

    // Pending phone: the submit-failure strip's "…or call us" ending has
    // no number to point at — close the sentence at "try again" instead.
    if (!phoneTel) {
      const fail = document.getElementById('book-fail');
      const form = document.getElementById('book-form');
      if (fail && !form?.classList.contains('book-form--offline')) {
        fail.textContent = "Something went wrong on our side and your message didn't send. Your details are still here — please try again.";
      }
    }

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
