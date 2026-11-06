/* Electives tab: your focus area, the shared CS electives, and how the 120 credits split. */
(function () {
  const CT = window.CT;
  const { L, R, S, $, esc } = CT;
  const open = new Map();

  const meter = (label, have, proj, need) => {
    const pct = (n) => Math.min(100, Math.round((n / need) * 100));
    return '<div class="mini"><div class="mini-h"><span>' + esc(label) + '</span><b>' + have + ' / ' + need + ' cr</b></div><div class="cr-bar"><i class="proj" style="width:' + pct(proj) + '%"></i><i class="have" style="width:' + pct(have) + '%"></i></div></div>';
  };
  const section = (key, title, counter, body, isOpen) =>
    '<details class="dd" data-dd="' + key + '"' + ((open.has(key) ? open.get(key) : isOpen) ? ' open' : '') + '><summary><span class="dd-t">' + esc(title) + '</span><span class="dd-n">' + counter + '</span></summary><div class="dd-b">' + body + '</div></details>';

  function renderElectives() {
    const a = L.audit(S);
    const plan = L.creditPlan(S);
    const t = R.tracks[S.track];

    const covered = plan.covered.map((c) => c.ids.join(', ')).join('; ');
    $('#creditPlan').innerHTML =
      '<div class="plan-eq"><div><b>' + plan.majorNeed + '</b><span>major courses</span></div><i>+</i>' +
      '<div><b>' + plan.geSeparate + '</b><span>GE your major does not cover</span></div><i>+</i>' +
      '<div><b>' + plan.free + '</b><span>free electives</span></div><i>=</i><div><b>' + plan.total + '</b><span>credits to graduate</span></div></div>' +
      '<p class="fine">Your required major courses (' + esc(covered) + ') also count for ' + plan.overlap + ' of the ' + plan.geNeed + ' GE credits (' + esc(a.ge.pattern.label) + ' pattern), so a CS degree leaves ' + (plan.free ? 'about ' + plan.free : 'little or no room for') + ' free-elective credits.</p>';

    let focusBody = '<p class="empty-note">Pick Software, Cyber or ML / AI at the top to see your focus-area courses.</p>', focusCount = '';
    if (t && a.track) {
      const f = a.track.focus;
      focusCount = f.have + ' / ' + f.need + ' cr';
      const used = new Set(f.chosenProj);
      focusBody = meter(t.name, f.have, f.projected, f.need) + '<p class="fine">' + esc(t.required) + ' is required. Pick courses from the rest to reach ' + f.need + ' credits.</p>' +
        '<ul class="erows">' + [t.required, ...t.options].map((id) => CT.erow(id, { tag: id === t.required ? 'required' : used.has(id) ? 'counts here' : '' })).join('') + '</ul>';
    }
    const e = a.track ? a.track.elective : { have: 0, projected: 0, need: R.electiveUnits, chosenProj: [] };
    const inFocus = new Set(a.track ? a.track.focus.chosenProj : []);
    const elecBody = meter('CS electives', e.have, e.projected, e.need) +
      '<p class="fine">Any ' + R.electiveUnits / 3 + ' courses from this list. A course counts once: it cannot fill both your focus area and your electives.</p>' +
      '<ul class="erows">' + R.sharedElectives.map((id) => CT.erow(id, { tag: inFocus.has(id) ? 'used in focus area' : '' })).join('') + '</ul>';
    const freeBody = '<p class="fine">Free electives are any courses beyond the major and GE. Enter transfer, AP or other credits below. ' + (plan.free ? 'You need about ' + plan.free + ' to reach 120.' : 'Your major plus the GE not covered by it already reaches 120.') + '</p>';

    $('#elecBody').innerHTML =
      section('focus', t ? 'Focus area: ' + t.name : 'Focus area', focusCount, focusBody, true) +
      section('elec', 'CS electives', e.have + ' / ' + e.need + ' cr', elecBody, true) +
      section('free', 'Free electives and other credits', plan.free + ' cr needed', freeBody, false);
  }

  document.addEventListener('toggle', (e) => {
    if (e.target.matches && e.target.matches('details.dd[data-dd]')) open.set(e.target.dataset.dd, e.target.open);
  }, true);

  CT.register('electives', renderElectives);
})();
