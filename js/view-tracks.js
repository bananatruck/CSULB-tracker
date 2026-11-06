/* Header track chips. Each chip shows how many of the 12 focus units you already have in that track. */
(function () {
  const CT = window.CT;
  const { L, R, S, $, esc, save } = CT;
  const SHORT = { software: 'Software', cyber: 'Cyber', ml: 'ML / AI' };

  function renderTracks() {
    $('#trackChips').innerHTML = L.trackProgress(S).map((t) =>
      '<button type="button" class="chip-btn" data-track="' + t.key + '" aria-pressed="' + (S.track === t.key) + '" title="' + esc(R.tracks[t.key].name) + '">' +
      SHORT[t.key] + '<small>' + t.units + '/' + t.need + '</small></button>').join('');
    $('#trackChips').classList.toggle('nudge', !S.track);
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track]');
    if (!t) return;
    S.track = t.dataset.track;
    save();
    CT.renderAll();
  });

  CT.register('tracks', renderTracks);
})();
