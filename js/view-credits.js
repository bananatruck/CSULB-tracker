/* Header credits meter: completed credits out of 120, with in-progress shown lighter. */
(function () {
  const CT = window.CT;
  const { L, S, $ } = CT;

  function renderCredits() {
    const a = L.audit(S);
    const t = a.total;
    const pct = (n) => Math.min(100, Math.round((n / t.need) * 100));
    const left = Math.max(0, t.need - t.projected);
    const note = a.overall === 'met' ? '<span class="done">All requirements met</span>'
      : left > 0 ? '<span>' + left + ' to go</span>' : '<span>covered if in progress passes</span>';
    $('#credits').innerHTML = '<div class="cr-top"><b>' + t.have + '<small> / ' + t.need + ' credits</small></b>' + note + '</div>' +
      '<div class="cr-bar" role="img" aria-label="' + t.have + ' of ' + t.need + ' credits done, ' + t.projected + ' with in-progress"><i class="proj" style="width:' + pct(t.projected) + '%"></i><i class="have" style="width:' + pct(t.have) + '%"></i></div>';
  }

  CT.register('credits', renderCredits);
})();
