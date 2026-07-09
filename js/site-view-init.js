// Apply saved site view before first paint (load synchronously in <head>).
(function () {
  if (localStorage.getItem('fdh-site-view') !== 'desktop') return;
  document.documentElement.classList.add('site-view--desktop');
  var meta = document.querySelector('meta[name="viewport"]');
  if (meta) meta.setAttribute('content', 'width=1280');
})();
