// Adds a menu toggle to a page nav that has no mobile menu. Paired with
// assets/mobile-nav.css. Expects <nav> containing .nav-inner > .nav-links.
(function () {
  var nav = document.querySelector('nav');
  var links = nav && nav.querySelector('.nav-links');
  if (!links || nav.querySelector('.mnav-toggle')) return;

  if (!links.id) links.id = 'mnavLinks';
  nav.classList.add('mnav-host');

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mnav-toggle';
  btn.setAttribute('aria-label', 'Open menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', links.id);
  btn.innerHTML =
    '<svg class="mnav-open-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>' +
    '<svg class="mnav-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
  links.parentNode.insertBefore(btn, links);

  function setOpen(open) {
    nav.classList.toggle('mnav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', function () {
    setOpen(!nav.classList.contains('mnav-open'));
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) setOpen(false);
  });
})();
