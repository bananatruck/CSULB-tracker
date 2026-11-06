/* Tabs: one full-screen view at a time, chosen by the URL hash (#flow, #semesters, #profs, #guide). */
(function () {
  const CT = window.CT;
  const { $ } = CT;
  const VIEWS = ['flow', 'semesters', 'profs', 'guide'];

  function show() {
    const h = location.hash.slice(1);
    const name = VIEWS.includes(h) ? h : 'flow';
    VIEWS.forEach((v) => { $('#v-' + v).hidden = v !== name; });
    document.querySelectorAll('#tabs a').forEach((a) => {
      if (a.dataset.tab === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    $('#menu').open = false;
    document.dispatchEvent(new CustomEvent('ct:show', { detail: name }));
  }
  window.addEventListener('hashchange', show);
  CT.showCurrent = show;
})();
