(function () {
  const CT = window.CT;
  const { L, R, S, $, esc, pill, courseRow, meter, save, setCourse } = CT;

  const openGroups = new Map(); // group key -> open state, kept across re-renders

  // ---------- audit ----------
  function renderAudit() {
    const a = L.audit(S);
    const open = a.groups.filter((g) => g.status === 'missing');
    const v = $('#verdict');
    let cls = a.overall, head, body;
    if (a.needsTrack && !open.length && !a.gradeIssues.length) {
      cls = 'missing'; head = 'Pick a track to finish the audit.'; body = 'Everything else is on track. The focus area and the 6 elective units depend on your track.';
    } else if (a.overall === 'met') {
      head = 'Every requirement is met.'; body = 'All groups pass with C or better and the unit total reaches ' + R.totalUnits + '. Confirm with your ARR before you apply to graduate.';
    } else if (a.overall === 'projected') {
      head = 'You finish if your in-progress courses pass.'; body = 'Every requirement is met or in progress. Each in-progress course needs a C or better.';
    } else {
      head = open.length + ' requirement' + (open.length === 1 ? '' : 's') + ' still open' + (a.gradeIssues.length ? ', and ' + a.gradeIssues.length + ' grade' + (a.gradeIssues.length === 1 ? '' : 's') + ' below C' : '') + '.';
      body = 'See "What is left" below. Courses marked in progress count as projected, not final.';
    }
    v.className = 'verdict ' + cls;
    v.innerHTML = '<strong>' + esc(head) + '</strong><span>' + esc(body) + '</span>';

    const lowerUp = [...R.lower, ...R.upperCore];
    const coreDone = lowerUp.filter((id) => L.doneSet(S).has(id)).length;
    const coreProj = lowerUp.filter((id) => L.doneSet(S).has(id) || L.ipSet(S).has(id)).length;
    const m = [];
    m.push(meter('Total units', a.total.have, a.total.projected, a.total.need, a.total.majorUnits + ' from major courses, ' + a.total.other + ' other, ' + a.total.ipUnits + ' in progress'));
    m.push(meter('Core courses', coreDone, coreProj, lowerUp.length, 'Lower and upper division, all required'));
    const sci = a.groups.find((g) => g.key === 'science');
    m.push(meter('Science units', sci.progress.have, sci.progress.projected, sci.progress.need, 'PHYS 151 or CHEM 111A, plus BIOL'));
    if (a.track) {
      m.push(meter(a.track.name + ' units', a.track.focus.have, a.track.focus.projected, a.track.focus.need, a.track.required + ' required'));
      m.push(meter('Elective units', a.track.elective.have, a.track.elective.projected, a.track.elective.need, 'Shared list, not double counted'));
    }
    $('#meters').innerHTML = m.join('');

    const needItems = open.map((g) => '<li><b>' + esc(g.title) + '.</b> ' + esc(g.need || '') + '</li>');
    if (a.needsTrack) needItems.push('<li><b>Track.</b> Choose a track in the section below.</li>');
    a.gradeIssues.forEach((id) => needItems.push('<li class="warn">' + esc(id) + ' has a grade below C. A C or better is required, so it must be retaken.</li>'));
    const gate = '<div class="gate-line"><span>Pre-major gate (C or better, before 60 units):</span>' +
      a.gate.map((i) => '<span class="pill ' + (i.status === 'met' ? 'met' : i.status === 'ip' ? 'projected' : 'missing') + '">' + esc(i.id) + '</span>').join('') + '</div>';
    $('#needs').innerHTML = '<div class="needs"><h3>What is left</h3>' +
      (needItems.length ? '<ul>' + needItems.join('') + '</ul>' : '<p>Nothing left. Every group is met.</p>') + gate + '</div>';

    const groupHtml = a.groups.filter((g) => g.key !== 'units').map((g) => {
      const isOpen = openGroups.has(g.key) ? openGroups.get(g.key) : g.status !== 'met';
      const ids = g.items.map((i) => i.id);
      return '<details class="group" data-g="' + g.key + '"' + (isOpen ? ' open' : '') + '><summary><span class="g-title">' + esc(g.title) + '</span>' + pill(g.status) +
        '<span class="g-note">' + esc(g.note) + (g.status !== 'met' && g.need ? ' Open: ' + esc(g.need) : '') + '</span></summary>' +
        '<div class="g-body"><div class="g-tools"><span>' + ids.length + ' course' + (ids.length === 1 ? '' : 's') + '</span>' +
        (ids.length > 1 ? '<button type="button" class="btn small" data-markall="' + esc(ids.join('|')) + '">Mark all passed (sets C)</button>' : '') + '</div>' +
        '<ul class="courses">' + ids.map((id) => courseRow(id)).join('') + '</ul></div></details>';
    }).join('');
    $('#groups').innerHTML = groupHtml || '';
  }

  document.addEventListener('change', (e) => {
    if (e.target.matches('select[data-course]')) { setCourse(e.target.dataset.course, e.target.value); save(); CT.renderAll(); }
  });
  document.addEventListener('toggle', (e) => {
    if (e.target.matches && e.target.matches('details.group')) openGroups.set(e.target.dataset.g, e.target.open);
  }, true);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-markall]');
    if (!t) return;
    t.dataset.markall.split('|').forEach((id) => { if (!S.done[id]) setCourse(id, 'C'); });
    save(); CT.renderAll();
  });
  CT.register('audit', renderAudit);
})();
