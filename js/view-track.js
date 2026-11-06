(function () {
  const CT = window.CT;
  const { L, R, S, $, esc, save } = CT;

  // ---------- track ----------
  function renderTrack() {
    const tp = L.trackProgress(S);
    $('#tracks').innerHTML = tp.map((t) => {
      const T = R.tracks[t.key];
      const on = S.track === t.key;
      const chip = (id, req) => {
        const st = L.doneSet(S).has(id) ? 'met' : L.ipSet(S).has(id) ? 'ip' : '';
        return '<li class="chip ' + st + (req ? ' req' : '') + '">' + esc(id) + '</li>';
      };
      return '<div class="tcard' + (on ? ' on' : '') + '"><div class="tcard-head"><h3>' + esc(T.name) + '</h3><span class="mono">' + t.units + ' / ' + t.need + ' units</span></div>' +
        '<div><p class="hint">Required</p><ul class="chips">' + chip(T.required, true) + '</ul></div>' +
        '<div><p class="hint">Plus 9 units from</p><ul class="chips">' + T.options.map((id) => chip(id)).join('') + '</ul></div>' +
        '<button type="button" class="btn ' + (on ? '' : 'primary') + '" data-track="' + t.key + '" aria-pressed="' + on + '">' + (on ? 'Selected' : 'Choose this track') + '</button></div>';
    }).join('');
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track]');
    if (!t) return;
    S.track = t.dataset.track; save(); CT.renderAll();
  });
  CT.register('track', renderTrack);
})();
