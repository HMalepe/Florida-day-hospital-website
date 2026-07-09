// Anatomical line-art service icons — thin stroke, premium clinical style
(() => {
  const S = 'illust-line';

  const ILLUSTRATIONS = {
    eye: {
      label: 'Line icon of the human eye for ophthalmic day surgery',
      svg: `<svg class="service-illust service-illust--eye" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path class="${S} illust-draw illust-draw--1" pathLength="1" d="M12 48 C24 22 72 22 84 48 C72 74 24 74 12 48 Z"/>
          <circle class="${S} illust-draw illust-draw--2" pathLength="1" cx="48" cy="48" r="14"/>
          <circle class="${S} illust-eye__pupil" cx="48" cy="48" r="5" fill="currentColor" stroke="none"/>
          <path class="${S} illust-eye__cornea" d="M30 48 C34 36 42 32 48 32 C54 32 62 36 66 48" opacity="0.5"/>
          <path class="${S} illust-eye__shine illust-draw illust-draw--3" pathLength="1" d="M54 38 C56 36 58 38 56 40" opacity="0"/>
          <path class="${S} illust-eye__lash illust-draw illust-draw--4" pathLength="1" d="M24 36 L20 30 M48 26 L48 20 M72 36 L76 30" opacity="0.55"/>
          <path class="${S} illust-eye__drop illust-draw illust-draw--5" pathLength="1" d="M72 68 C72 62 76 58 76 54 C76 58 80 62 80 68 C80 72 76 74 76 74 C76 74 72 72 72 68 Z"/>
          <line class="${S} illust-eye__drop-line" x1="76" y1="74" x2="76" y2="82" opacity="0"/>
          <circle class="illust-eye__spark" cx="58" cy="40" r="1.5" fill="var(--accent-bright)" stroke="none" opacity="0"/>
        </g>
      </svg>`,
    },

    digestive: {
      label: 'Line icon of the stomach and digestive tract for gastroscopy and colonoscopy',
      svg: `<svg class="service-illust service-illust--digestive" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path class="${S} illust-draw illust-draw--1" pathLength="1" d="M48 8 L48 22"/>
          <path class="${S} illust-draw illust-draw--2" pathLength="1" d="M48 22 C30 22 20 32 18 46 C16 58 22 70 34 74 C44 78 54 74 58 64 C62 52 58 36 48 22 Z"/>
          <path class="${S} illust-gi__ripple" d="M28 46 C32 44 36 48 40 46 C44 44 48 48 52 46" opacity="0"/>
          <path class="${S} illust-gi__ripple illust-gi__ripple--2" d="M30 56 C34 54 38 58 42 56 C46 54 50 58 54 56" opacity="0"/>
          <path class="${S}" d="M58 64 C66 68 72 66 76 58"/>
          <path class="${S} illust-gi__colon illust-draw illust-draw--3" pathLength="1" d="M76 58 C86 56 90 66 88 76 C86 86 74 88 64 84 C54 80 48 72 46 64"/>
          <circle class="illust-gi__wave" cx="48" cy="14" r="2.5" fill="currentColor" stroke="none" opacity="0"/>
          <circle class="illust-gi__scope-light" cx="48" cy="14" r="5" fill="none" stroke="var(--accent-bright)" stroke-width="1" opacity="0"/>
        </g>
      </svg>`,
    },

    ent: {
      label: 'Line icon of the ear, nose, and throat for ENT day surgery',
      svg: `<svg class="service-illust service-illust--ent" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path class="${S} illust-draw illust-draw--1" pathLength="1" d="M18 52 C12 40 14 24 26 18 C38 12 48 22 48 36 C48 48 40 56 32 54 C26 52 22 48 18 52 Z"/>
          <path class="${S}" d="M48 36 C54 38 58 44 58 52"/>
          <path class="${S} illust-ent__cochlea" d="M60 56 C66 62 64 72 56 74 C50 76 46 68 50 62 C54 58 58 56 60 56 Z"/>
          <path class="${S} illust-draw illust-draw--2" pathLength="1" d="M62 20 C72 18 80 28 80 40 C80 52 74 64 66 72"/>
          <path class="${S}" d="M62 20 L62 72" opacity="0.35"/>
          <path class="${S}" d="M66 72 C70 74 76 72 78 68"/>
          <path class="${S}" d="M66 72 C68 78 72 84 76 88"/>
          <ellipse class="${S} illust-ent__larynx" cx="78" cy="90" rx="6" ry="4"/>
          <path class="${S} illust-ent__cord" d="M74 89 L82 89" opacity="0.45"/>
          <path class="${S} illust-ent__wave illust-ent__wave--1" d="M6 44 Q2 38 6 32" opacity="0"/>
          <path class="${S} illust-ent__wave illust-ent__wave--2" d="M2 48 Q-2 40 2 32" opacity="0"/>
          <path class="${S} illust-ent__wave illust-ent__wave--3" d="M10 40 Q6 34 10 28" opacity="0"/>
        </g>
      </svg>`,
    },

    gynaecology: {
      label: 'Line icon of the uterus and ovaries for gynaecological day surgery',
      svg: `<svg class="service-illust service-illust--gynaecology" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path class="${S} illust-draw illust-draw--1" pathLength="1" d="M42 20 C34 20 28 28 26 40 C24 52 28 64 36 72 C42 78 54 78 60 72 C68 64 72 52 70 40 C68 28 62 20 54 20 C50 18 46 18 42 20 Z"/>
          <path class="${S}" d="M42 20 C48 16 56 16 60 20" opacity="0.5"/>
          <path class="${S} illust-draw illust-draw--2" pathLength="1" d="M46 72 L46 82 C48 84 52 84 54 82 L54 72"/>
          <path class="${S} illust-gyn__tube" d="M26 40 C16 38 10 46 10 56 C10 62 14 66 18 66"/>
          <ellipse class="${S} illust-gyn__ovary illust-gyn__ovary--l" cx="12" cy="60" rx="7" ry="5"/>
          <path class="${S} illust-gyn__tube" d="M70 40 C80 38 86 46 86 56 C86 62 82 66 78 66"/>
          <ellipse class="${S} illust-gyn__ovary illust-gyn__ovary--r" cx="84" cy="60" rx="7" ry="5"/>
          <path class="${S} illust-gyn__cavity" d="M46 30 C44 40 44 54 46 64 C48 54 48 40 46 30 Z" opacity="0.35"/>
          <circle class="illust-gyn__pulse" cx="48" cy="44" r="3" fill="var(--accent-bright)" stroke="none" opacity="0"/>
        </g>
      </svg>`,
    },

    general: {
      label: 'Line icon of surgical instruments for general day surgery',
      svg: `<svg class="service-illust service-illust--general" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path class="${S} illust-draw illust-draw--1" pathLength="1" d="M20 72 L44 48"/>
          <path class="${S} illust-draw illust-draw--2" pathLength="1" d="M44 48 L58 28 L62 32 L48 52 Z" fill="currentColor" fill-opacity="0.08" stroke="currentColor"/>
          <path class="${S} illust-surg__forceps illust-surg__forceps--l" d="M68 24 C72 32 72 44 68 52"/>
          <path class="${S} illust-surg__forceps illust-surg__forceps--r" d="M80 24 C76 32 76 44 80 52"/>
          <path class="${S}" d="M68 52 C74 58 74 58 80 52"/>
          <path class="${S} illust-surg__tissue" d="M14 80 C30 76 46 78 62 74 C74 72 82 76 88 80" opacity="0.4"/>
          <path class="${S} illust-surg__suture illust-draw illust-draw--3" pathLength="1" d="M30 76 L36 74 L42 76 L48 74 L54 76" opacity="0"/>
          <path class="${S} illust-surg__cross" d="M72 68 L72 80 M66 74 L78 74" opacity="0.35"/>
          <path class="${S} illust-surg__gleam" d="M54 30 L58 26" opacity="0"/>
        </g>
      </svg>`,
    },

    pain: {
      label: 'Line icon of a person stretching with red markers at painful joints for pain intervention',
      svg: `<svg class="service-illust service-illust--pain" viewBox="0 0 96 96" aria-hidden="true">
        <g class="illust-group illust-pain__figure" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle class="${S} illust-draw illust-draw--1" pathLength="1" cx="48" cy="14" r="6"/>
          <path class="${S} illust-draw illust-draw--2" pathLength="1" d="M48 20 L48 28"/>
          <path class="${S} illust-draw illust-draw--2" pathLength="1" d="M30 28 L66 28"/>
          <path class="${S} illust-draw illust-draw--3" pathLength="1" d="M30 28 L22 16 L16 8"/>
          <path class="${S} illust-draw illust-draw--3" pathLength="1" d="M66 28 L74 16 L80 8"/>
          <path class="${S} illust-draw illust-draw--4" pathLength="1" d="M48 28 L48 54"/>
          <path class="${S} illust-draw illust-draw--4" pathLength="1" d="M38 54 L58 54"/>
          <path class="${S} illust-draw illust-draw--5" pathLength="1" d="M38 54 L28 70 L24 86"/>
          <path class="${S} illust-draw illust-draw--5" pathLength="1" d="M58 54 L68 70 L74 86"/>
          <path class="${S} illust-pain__motion illust-draw illust-draw--6" pathLength="1" d="M8 52 Q14 48 8 44" opacity="0"/>
          <path class="${S} illust-pain__motion illust-draw illust-draw--6" pathLength="1" d="M88 52 Q82 48 88 44" opacity="0"/>
        </g>
        <g class="illust-pain__sites" fill="var(--brand-red)" stroke="none">
          <circle class="illust-pain__ring illust-pain__ring--1" cx="48" cy="24" r="5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--2" cx="30" cy="28" r="5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--3" cx="66" cy="28" r="5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--4" cx="22" cy="16" r="4.5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--5" cx="74" cy="16" r="4.5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--primary" cx="48" cy="42" r="6" fill="none" stroke="var(--brand-red)" stroke-width="1.25" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--6" cx="38" cy="54" r="5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--7" cx="58" cy="54" r="5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--8" cx="28" cy="70" r="4.5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__ring illust-pain__ring--9" cx="68" cy="70" r="4.5" fill="none" stroke="var(--brand-red)" stroke-width="1" opacity="0"/>
          <circle class="illust-pain__dot illust-pain__dot--1" cx="48" cy="24" r="2.25"/>
          <circle class="illust-pain__dot illust-pain__dot--2" cx="30" cy="28" r="2.25"/>
          <circle class="illust-pain__dot illust-pain__dot--3" cx="66" cy="28" r="2.25"/>
          <circle class="illust-pain__dot illust-pain__dot--4" cx="22" cy="16" r="2"/>
          <circle class="illust-pain__dot illust-pain__dot--5" cx="74" cy="16" r="2"/>
          <circle class="illust-pain__dot illust-pain__dot--primary" cx="48" cy="42" r="2.75"/>
          <circle class="illust-pain__dot illust-pain__dot--6" cx="38" cy="54" r="2.25"/>
          <circle class="illust-pain__dot illust-pain__dot--7" cx="58" cy="54" r="2.25"/>
          <circle class="illust-pain__dot illust-pain__dot--8" cx="28" cy="70" r="2"/>
          <circle class="illust-pain__dot illust-pain__dot--9" cx="68" cy="70" r="2"/>
        </g>
        <g class="illust-pain__bursts" fill="none" stroke="var(--brand-red)" stroke-width="1.25" stroke-linecap="round" opacity="0">
          <path class="illust-pain__burst" d="M48 42 L48 34"/>
          <path class="illust-pain__burst" d="M48 42 L54 38"/>
          <path class="illust-pain__burst" d="M48 42 L42 38"/>
          <path class="illust-pain__burst" d="M48 42 L52 46"/>
          <path class="illust-pain__burst" d="M48 42 L44 46"/>
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
