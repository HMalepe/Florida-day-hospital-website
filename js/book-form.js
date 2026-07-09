// Booking form — validation + submission
(() => {
  const BOOKING_ENDPOINT = '';

  const form = document.getElementById('book-form');
  const card = document.getElementById('book-card');
  const failStrip = document.getElementById('book-fail');
  const submitBtn = document.getElementById('book-submit');
  const announce = document.getElementById('book-announce');
  if (!form) return;

  form.noValidate = true;

  const dateInput = document.getElementById('f-date');
  if (dateInput && dateInput.type === 'date') {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  const setOffline = () => {
    form.classList.add('book-form--offline');
    submitBtn.disabled = true;
    failStrip.classList.add('is-visible', 'book-fail--info');
    failStrip.innerHTML = 'Online callback requests are not live yet. Please use the call or email options above, or <a class="contact-link" href="contact.html#book">contact admissions</a>.';
    announce.textContent = failStrip.textContent;
    form.querySelectorAll('input, textarea').forEach((el) => {
      el.disabled = true;
      el.setAttribute('aria-disabled', 'true');
    });
  };

  if (!BOOKING_ENDPOINT) {
    setOffline();
  }

  const MESSAGES = {
    nameEmpty: 'We need your name so we know who to ask for.',
    phoneEmpty: 'A phone number lets us call you back — please add one.',
    phoneMalformed: "That number doesn't look complete — check the digits and try again.",
    emailMalformed: "That email doesn't look quite right — please check it.",
  };

  const fields = {
    name: {
      input: document.getElementById('f-name'),
      validate(v) { return v.trim() ? null : MESSAGES.nameEmpty; },
    },
    phone: {
      input: document.getElementById('f-phone'),
      validate(v) {
        if (!v.trim()) return MESSAGES.phoneEmpty;
        const digits = v.replace(/\D/g, '');
        return (digits.length >= 9 && digits.length <= 15) ? null : MESSAGES.phoneMalformed;
      },
    },
    email: {
      input: document.getElementById('f-email'),
      validate(v) {
        if (!v.trim()) return null;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : MESSAGES.emailMalformed;
      },
    },
  };

  let submitPressInFlight = false;
  submitBtn.addEventListener('pointerdown', () => { submitPressInFlight = true; });
  window.addEventListener('pointerup', () => {
    setTimeout(() => { submitPressInFlight = false; }, 0);
  });

  Object.values(fields).forEach((field) => {
    field.touched = false;
    const wrapper = field.input.closest('.field');
    const errorEl = wrapper.querySelector('.field__error');

    field.apply = () => {
      const message = field.validate(field.input.value);
      const invalid = message !== null;
      wrapper.classList.toggle('is-invalid', invalid);
      if (invalid) {
        errorEl.textContent = message;
        field.input.setAttribute('aria-invalid', 'true');
        field.input.setAttribute('aria-describedby', errorEl.id);
        announce.textContent = message;
      } else {
        field.input.removeAttribute('aria-invalid');
        field.input.setAttribute('aria-describedby', errorEl.id);
      }
      return !invalid;
    };

    field.input.addEventListener('blur', () => {
      field.touched = true;
      if (!submitPressInFlight) field.apply();
    });

    field.input.addEventListener('input', () => {
      if (field.touched) field.apply();
    });
  });

  const send = async (payload) => {
    if (!BOOKING_ENDPOINT) {
      throw new Error('Booking endpoint not configured');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(BOOKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
    } finally {
      clearTimeout(timeout);
    }
  };

  const showSuccess = () => {
    card.style.minHeight = card.offsetHeight + 'px';
    form.innerHTML = `
      <div class="book-success">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="19" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
          <path d="M12.5 20.5l5 5 10-11" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3 tabindex="-1" id="book-success-heading" class="t-title-sm">Thank you — we have your details</h3>
        <p>Expect a call back to confirm your appointment, usually within one working day. If your enquiry is urgent, mention that when we reach you.</p>
      </div>`;
    const heading = document.getElementById('book-success-heading');
    announce.textContent = 'Thank you — we have your details. Expect a call back within one working day.';
    heading.focus();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!BOOKING_ENDPOINT) return;

    let firstInvalid = null;
    Object.values(fields).forEach((field) => {
      field.touched = true;
      if (!field.apply() && !firstInvalid) firstInvalid = field.input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    failStrip.classList.remove('is-visible', 'book-fail--info');
    submitBtn.disabled = true;
    const restLabel = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';

    try {
      await send(Object.fromEntries(new FormData(form)));
      showSuccess();
    } catch (error) {
      failStrip.classList.remove('book-fail--info');
      failStrip.classList.add('is-visible');
      announce.textContent = failStrip.textContent;
      submitBtn.disabled = false;
      submitBtn.textContent = restLabel;
    }
  });
})();
