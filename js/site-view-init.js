// Apply saved or configured site view before first paint (load synchronously in <head>).
(function () {
  var MOBILE_LAYOUT_WIDTH = 390;
  var config = window.FDH_SITE_CONFIG || {};
  var stored = localStorage.getItem('fdh-site-view');
  var defaultView = config.defaultView === 'mobile' || config.defaultView === 'desktop'
    ? config.defaultView
    : null;
  var view = stored || defaultView;
  if (!view) return;

  // Deploy defaultView:"mobile" is for handheld QA — never trap a desktop/laptop
  // visitor in the 390px phone frame unless they explicitly chose Mobile site.
  if (view === 'mobile' && !stored) {
    var isHandheld =
      (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) ||
      window.screen.width < 768;
    if (!isHandheld) return;
  }

  var meta = document.querySelector('meta[name="viewport"]');
  var root = document.documentElement;

  if (view === 'desktop') {
    root.classList.add('site-view--desktop');
    if (meta) meta.setAttribute('content', 'width=1280');
    return;
  }

  if (view === 'mobile') {
    root.classList.add('site-view--mobile');
    if (window.screen.width >= 768) {
      root.classList.add('site-view--mobile-preview');
      if (meta) {
        meta.setAttribute(
          'content',
          'width=' + MOBILE_LAYOUT_WIDTH + ', initial-scale=1.0, viewport-fit=cover'
        );
      }
    } else if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    }
  }
})();
