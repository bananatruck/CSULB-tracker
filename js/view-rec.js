/* Semesters board: what to take, term by term. Click a course to jump to it in the flowchart. */
(function () {
  const CT = window.CT;
  const { L, byId, S, $, esc, save, TERMS, UNIT_CHOICES } = CT;

  const chip = (id, units, reason) =>
    '<li><button type="button" class="cchip" data-pick="' + esc(id) + '"' + (reason ? ' title="' + esc(reason) + '"' : '') + '><span class="mono">' + esc(id) + '</span><small>' + units + ' cr</small></button></li>';
  const column = (title, note, items, late) =>
    '<section class="col' + (late ? ' late' : '') + '"><div class="col-h"><b>' + esc(title) + '</b><span>' + esc(note) + '</span></div><ul>' + items + '</ul></section>';

  function renderRec() {
    const r = L.recommend(S);
    const v = $('#boardVerdict');
    let text, cls;
    if (!S.track) { text = 'Pick a track first'; cls = 'off'; }
    else if (!r.wanted.length) { text = 'Nothing left to schedule'; cls = 'on'; }
    else if (r.onPace) { text = 'On pace for ' + r.targetTerm; cls = 'on'; }
    else if (r.finishTerm) { text = 'Not on pace. Earliest finish ' + r.finishTerm; cls = 'off'; }
    else { text = 'Some courses are blocked'; cls = 'off'; }
    v.className = 'verdict ' + cls;
    v.textContent = text;

    const cols = [];
    if (S.ip.length) {
      const ipIds = L.courses.filter((c) => L.ipSet(S).has(c.id));
      cols.push(column('In progress', L.sumUnits(ipIds.map((c) => c.id)) + ' cr', ipIds.map((c) => chip(c.id, c.units)).join(''), false));
    }
    r.plan.forEach((t, i) => {
      const items = t.courses.length ? t.courses.map((c) => chip(c.id, c.units, c.reason)).join('') : '<li class="none">Nothing open this term</li>';
      cols.push(column(t.term, t.units + ' cr', items, i >= r.horizon));
    });
    $('#board').innerHTML = cols.length ? cols.join('') : '<p class="empty-note">Nothing planned. Mark what you have finished in the Flow view first.</p>';
  }

  $('#termUnits').innerHTML = UNIT_CHOICES.map((u) => '<option value="' + u + '">' + u + ' credits</option>').join('');
  const termOpts = TERMS.map((x) => '<option>' + x + '</option>').join('');
  $('#startTerm').innerHTML = termOpts;
  $('#gradTerm').innerHTML = termOpts;
  const sync = () => { $('#termUnits').value = S.termUnits; $('#startTerm').value = S.startTerm; $('#gradTerm').value = S.gradTerm; };
  sync();
  $('#termUnits').addEventListener('change', (e) => { S.termUnits = Number(e.target.value); save(); renderRec(); });
  $('#startTerm').addEventListener('change', (e) => { S.startTerm = e.target.value; save(); renderRec(); });
  $('#gradTerm').addEventListener('change', (e) => { S.gradTerm = e.target.value; save(); renderRec(); });
  $('#board').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (b && byId.has(b.dataset.pick)) document.dispatchEvent(new CustomEvent('ct:select', { detail: b.dataset.pick }));
  });
  document.addEventListener('ct:reset', sync);

  CT.register('rec', renderRec);
})();
