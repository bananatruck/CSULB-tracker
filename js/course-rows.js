/* One course row, shared by the Electives and GE tabs.
   Status is the same state the flowchart uses, so marking a course here updates the Flow tab too. */
(function () {
  const CT = window.CT;
  const { L, byId, S, esc, save, setCourse, catalogLink } = CT;
  let ctx = null;
  CT.register('row-context', () => { ctx = null; });

  const statusValue = (id) => {
    const s = L.statusOf(id, S);
    return s === 'done' ? 'P' : s === 'ip' ? 'ip' : s === 'fail' ? 'F' : '';
  };

  // opts: tag (text badge), note (small text under the row)
  CT.erow = function (id, opts = {}) {
    ctx = ctx || L.flowCtx(S);
    const prog = byId.get(id);
    const ge = L.GE.byId.get(id);
    const title = prog ? prog.title : (ge && ge.title) || '';
    const st = statusValue(id);
    const lk = prog ? L.lock(id, ctx, S.forceOpen) : { open: true, missing: [] };
    const locked = !lk.open && st === '';
    const u = L.unitsOfAny(id, S);
    const code = prog ? '<a class="code" href="' + catalogLink(id) + '" target="_blank" rel="noopener">' + esc(id) + '</a>' : '<span class="code">' + esc(id) + '</span>';
    const badges = [prog ? '<span class="tag major">in your major</span>' : '', !prog && L.GE.isTech(id) ? '<span class="tag tech">tech</span>' : '', opts.tag ? '<span class="tag">' + esc(opts.tag) + '</span>' : ''].join('');
    const credits = !prog && st !== '' && st !== 'F'
      ? '<select class="cr" data-units="' + esc(id) + '" aria-label="Credits for ' + esc(id) + '">' + [1, 2, 3, 4, 5].map((n) => '<option value="' + n + '"' + (n === u ? ' selected' : '') + '>' + n + ' cr</option>').join('') + '</select>'
      : '<span class="cru">' + u + ' cr</span>';
    const sel = '<select class="cs ' + (st === 'P' ? 'st-met' : st === 'ip' ? 'st-ip' : st === 'F' ? 'st-fail' : '') + '" data-ec="' + esc(id) + '" data-course="' + esc(id) + '" aria-label="Status of ' + esc(id) + '"' + (locked ? ' title="Locked"' : '') + '>' +
      '<option value=""' + (st === '' ? ' selected' : '') + '>Not taken</option>' +
      '<option value="ip"' + (st === 'ip' ? ' selected' : '') + (locked ? ' disabled' : '') + '>In progress</option>' +
      '<option value="P"' + (st === 'P' ? ' selected' : '') + (locked ? ' disabled' : '') + '>Completed</option>' +
      (st === 'F' ? '<option value="F" selected disabled>Below C</option>' : '') + '</select>';
    const note = locked ? 'Finish ' + lk.missing.join(' and ') + ' first' : (opts.note || '') + (ge && ge.eff ? '' : '');
    return '<li class="erow' + (st === 'P' ? ' taken' : st === 'ip' ? ' taking' : '') + '"><span class="ecode">' + code + '</span><span class="etitle">' + esc(title) + badges + '</span>' + credits + sel +
      (note ? '<span class="enote">' + esc(note) + '</span>' : '') + '</li>';
  };

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('select[data-ec]')) {
      setCourse(t.dataset.ec, t.value === 'F' ? '' : t.value);
      save();
      CT.renderAll();
    } else if (t.matches('select[data-units]')) {
      S.units[t.dataset.units] = Number(t.value);
      save();
      CT.renderAll();
    }
  });
})();
