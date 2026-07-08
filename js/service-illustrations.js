// Anatomical line-art service icons — thin stroke, premium clinical style
(() => {
  const S = 'illust-line'; // shared stroke class

  const ILLUSTRATIONS = {
    eye: {
      label: 'Line icon of the human eye for ophthalmic day surgery',
      svg: `<svg class="service-illust service-illust--eye" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- almond eye outline -->
          <path class="${S} illust-draw" pathLength="1" d="M12 48 C24 22 72 22 84 48 C72 74 24 74 12 48 Z"/>
          <!-- iris -->
          <circle class="${S}" cx="48" cy="48" r="14"/>
          <circle class="${S} illust-eye__pupil" cx="48" cy="48" r="5" fill="currentColor" stroke="none"/>
          <!-- corneal arc -->
          <path class="${S} illust-eye__cornea" d="M30 48 C34 36 42 32 48 32 C54 32 62 36 66 48" opacity="0.5"/>
          <!-- ophthalmic drop -->
          <path class="${S} illust-eye__drop illust-draw" pathLength="1" d="M72 68 C72 62 76 58 76 54 C76 58 80 62 80 68 C80 72 76 74 76 74 C76 74 72 72 72 68 Z"/>
          <line class="${S} illust-eye__drop-line" x1="76" y1="74" x2="76" y2="82" opacity="0"/>
        </g>
      </svg>`,
    },

    digestive: {
      label: 'Line icon of the stomach and digestive tract for gastroscopy and colonoscopy',
      svg: `<svg class="service-illust service-illust--digestive" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- oesophagus -->
          <path class="${S} illust-draw" pathLength="1" d="M48 8 L48 22"/>
          <!-- stomach body -->
          <path class="${S} illust-draw" pathLength="1" d="M48 22 C30 22 20 32 18 46 C16 58 22 70 34 74 C44 78 54 74 58 64 C62 52 58 36 48 22 Z"/>
          <!-- pylorus -->
          <path class="${S}" d="M58 64 C66 68 72 66 76 58"/>
          <!-- colon curve -->
          <path class="${S} illust-gi__colon illust-draw" pathLength="1" d="M76 58 C86 56 90 66 88 76 C86 86 74 88 64 84 C54 80 48 72 46 64"/>
          <!-- scope path (animated) -->
          <circle class="illust-gi__wave" cx="48" cy="14" r="2.5" fill="currentColor" stroke="none" opacity="0"/>
        </g>
      </svg>`,
    },

    ent: {
      label: 'Line icon of the ear, nose, and throat for ENT day surgery',
      svg: `<svg class="service-illust service-illust--ent" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- outer ear (pinna) -->
          <path class="${S} illust-draw" pathLength="1" d="M18 52 C12 40 14 24 26 18 C38 12 48 22 48 36 C48 48 40 56 32 54 C26 52 22 48 18 52 Z"/>
          <!-- ear canal -->
          <path class="${S}" d="M48 36 C54 38 58 44 58 52"/>
          <!-- cochlea spiral -->
          <path class="${S} illust-ent__cochlea" d="M60 56 C66 62 64 72 56 74 C50 76 46 68 50 62 C54 58 58 56 60 56 Z"/>
          <!-- nose profile -->
          <path class="${S} illust-draw" pathLength="1" d="M62 20 C72 18 80 28 80 40 C80 52 74 64 66 72"/>
          <!-- nasal bridge -->
          <path class="${S}" d="M62 20 L62 72" opacity="0.35"/>
          <!-- nostril -->
          <path class="${S}" d="M66 72 C70 74 76 72 78 68"/>
          <!-- pharynx / larynx -->
          <path class="${S}" d="M66 72 C68 78 72 84 76 88"/>
          <ellipse class="${S} illust-ent__larynx" cx="78" cy="90" rx="6" ry="4"/>
          <!-- sound waves -->
          <path class="${S} illust-ent__wave illust-ent__wave--1" d="M6 44 Q2 38 6 32" opacity="0"/>
          <path class="${S} illust-ent__wave illust-ent__wave--2" d="M2 48 Q-2 40 2 32" opacity="0"/>
        </g>
      </svg>`,
    },

    gynaecology: {
      label: 'Line icon of the uterus and ovaries for gynaecological day surgery',
      svg: `<svg class="service-illust service-illust--gynaecology" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- uterus -->
          <path class="${S} illust-draw" pathLength="1" d="M42 20 C34 20 28 28 26 40 C24 52 28 64 36 72 C42 78 54 78 60 72 C68 64 72 52 70 40 C68 28 62 20 54 20 C50 18 46 18 42 20 Z"/>
          <!-- fundus dome -->
          <path class="${S}" d="M42 20 C48 16 56 16 60 20" opacity="0.5"/>
          <!-- cervix -->
          <path class="${S}" d="M46 72 L46 82 C48 84 52 84 54 82 L54 72"/>
          <!-- left fallopian tube -->
          <path class="${S}" d="M26 40 C16 38 10 46 10 56 C10 62 14 66 18 66"/>
          <ellipse class="${S} illust-gyn__ovary" cx="12" cy="60" rx="7" ry="5"/>
          <!-- right fallopian tube -->
          <path class="${S}" d="M70 40 C80 38 86 46 86 56 C86 62 82 66 78 66"/>
          <ellipse class="${S} illust-gyn__ovary" cx="84" cy="60" rx="7" ry="5"/>
          <!-- endometrial cavity -->
          <path class="${S} illust-gyn__cavity" d="M46 30 C44 40 44 54 46 64 C48 54 48 40 46 30 Z" opacity="0.35"/>
        </g>
      </svg>`,
    },

    general: {
      label: 'Line icon of surgical instruments for general day surgery',
      svg: `<svg class="service-illust service-illust--general" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- scalpel handle -->
          <path class="${S} illust-draw" pathLength="1" d="M20 72 L44 48"/>
          <!-- scalpel blade -->
          <path class="${S} illust-draw" pathLength="1" d="M44 48 L58 28 L62 32 L48 52 Z" fill="currentColor" fill-opacity="0.08" stroke="currentColor"/>
          <!-- forceps arm -->
          <path class="${S}" d="M68 24 C72 32 72 44 68 52"/>
          <path class="${S}" d="M80 24 C76 32 76 44 80 52"/>
          <path class="${S}" d="M68 52 C74 58 74 58 80 52"/>
          <!-- suture line on tissue -->
          <path class="${S} illust-surg__tissue" d="M14 80 C30 76 46 78 62 74 C74 72 82 76 88 80" opacity="0.4"/>
          <path class="${S} illust-surg__suture illust-draw" pathLength="1" d="M30 76 L36 74 L42 76 L48 74 L54 76" opacity="0"/>
          <!-- medical cross -->
          <path class="${S} illust-surg__cross" d="M72 68 L72 80 M66 74 L78 74" opacity="0.35"/>
        </g>
      </svg>`,
    },

    pain: {
      label: 'Line icon of the lumbar spine and nerve pathway for pain intervention',
      svg: `<svg class="service-illust service-illust--pain" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- L3 vertebra -->
          <rect class="${S}" x="34" y="14" width="28" height="16" rx="3"/>
          <rect class="${S}" x="40" y="19" width="16" height="8" rx="1.5" opacity="0.35"/>
          <!-- L4 -->
          <rect class="${S}" x="34" y="36" width="28" height="16" rx="3"/>
          <rect class="${S}" x="40" y="41" width="16" height="8" rx="1.5" opacity="0.35"/>
          <!-- L5 -->
          <rect class="${S}" x="34" y="58" width="28" height="16" rx="3"/>
          <rect class="${S}" x="40" y="63" width="16" height="8" rx="1.5" opacity="0.35"/>
          <!-- intervertebral discs -->
          <line class="${S}" x1="30" y1="32" x2="66" y2="32" opacity="0.4"/>
          <line class="${S}" x1="30" y1="54" x2="66" y2="54" opacity="0.4"/>
          <!-- nerve root -->
          <path class="${S} illust-pain__nerve" d="M62 44 C72 42 78 50 82 58"/>
          <path class="${S} illust-pain__nerve" d="M62 66 C72 68 78 76 82 84"/>
          <!-- injection needle -->
          <line class="${S} illust-pain__needle" x1="84" y1="20" x2="66" y2="42"/>
          <!-- target facet -->
          <circle class="${S} illust-pain__target" cx="64" cy="44" r="4" fill="currentColor" fill-opacity="0" stroke="currentColor"/>
          <!-- ECG pulse (animated) -->
          <path class="${S} illust-pain__pulse illust-draw" pathLength="1" d="M8 78 L18 78 L22 64 L28 88 L34 72 L40 78 L88 78" opacity="0"/>
        </g>
      </svg>`,
    },
  };

  document.querySelectorAll('[data-illustration]').forEach((slot) => {
    const key = slot.dataset.illustration;
    const illust = ILLUSTRATIONS[key];
    if (!illust) return;
    slot.setAttribute('role', 'img');
    slot.setAttribute('aria-label', illust.label);
    slot.innerHTML = illust.svg;
  });
})();
