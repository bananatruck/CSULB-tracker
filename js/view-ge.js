/* GE tab: pick your GE pattern, open any requirement to see every approved course, mark what you took.
   Below that, the university-wide graduation checklist with its sources. */
(function () {
  const CT = window.CT;
  const { L, S, $, esc, save } = CT;
  const GE = L.GE;
  const open = new Map();
  let query = '';
  let takenOnly = false;

  const pct = (n, need) => Math.min(100, need ? Math.round((n / need) * 100) : 0);
  const meter = (label, have, proj, need) =>
    '<div class="mini"><div class="mini-h"><span>' + esc(label) + '</span><b>' + have + ' / ' + need + ' cr</b></div><div class="cr-bar"><i class="proj" style="width:' + pct(proj, need) + '%"></i><i class="have" style="width:' + pct(have, need) + '%"></i></div></div>';
  const pill = (st, text) => '<span class="pill ' + st + '">' + esc(text) + '</span>';

  // Sort: taken first, then courses in your major (they double-count), then tech-related, then A to Z.
  function ordered(g) {
    const taken = (id) => { const s = L.statusOf(id, S); return s === 'done' ? 0 : s === 'ip' ? 1 : 2; };
    return g.courses.slice().sort((a, b) => taken(a.id) - taken(b.id) || Number(!CT.byId.has(a.id)) - Number(!CT.byId.has(b.id)) || Number(!GE.isTech(a.id)) - Number(!GE.isTech(b.id)) || a.id.localeCompare(b.id, 'en', { numeric: true }));
  }

  function groupBody(g, row) {
    const q = query.trim().toLowerCase();
    let list = ordered(g);
    if (takenOnly) list = list.filter((c) => L.statusOf(c.id, S) !== 'none');
    if (q) list = list.filter((c) => (c.id + ' ' + c.title).toLowerCase().includes(q));
    const major = g.courses.filter((c) => CT.byId.has(c.id)).map((c) => c.id);
    const lines = [];
    if (g.note) lines.push('<p class="fine">' + esc(g.note) + '</p>');
    if (major.length) lines.push('<p class="fine hl">Also in your major: ' + esc(major.join(', ')) + '. Taking these counts for both.</p>');
    const shown = list.slice(0, 400);
    lines.push('<ul class="erows">' + (shown.length ? shown.map((c) => CT.erow(c.id, { tag: c.tag || (c.eff ? 'from ' + c.eff : '') })).join('') : '<li class="none">No courses match.</li>') + '</ul>');
    return lines.join('');
  }

  function renderGe() {
    const a = L.audit(S);
    const ge = a.ge, pat = ge.pattern;
    $('#gePattern').value = S.gePattern;
    $('#geCertified').checked = !!S.geCertified;
    $('#geInfo').innerHTML = esc(pat.who) + ' <a href="' + esc(pat.source) + '" target="_blank" rel="noopener">CSULB requirements page</a>. Students may follow the pattern from when their continuous enrollment began, or the one in effect when they graduate. Your ARR is the record.';

    $('#geSummary').innerHTML = meter('Lower division', ge.lowerHave, ge.lowerProj, ge.lowerNeed) + meter('Upper division', ge.upperHave, ge.upperProj, ge.upperNeed) + meter('GE total', ge.have, ge.proj, ge.need);

    $('#geBody').innerHTML = pat.groups.map((g) => {
      const r = ge.rows.find((x) => x.key === g.key);
      const key = pat.id + ':' + g.key;
      const isOpen = open.has(key) ? open.get(key) : false;
      const st = g.extra ? 'neutral' : r.met ? 'met' : r.projMet ? 'projected' : 'missing';
      const label = g.extra ? 'Extra' : r.met ? 'Met' : r.projMet ? 'If in-progress pass' : 'Open';
      const count = g.extra ? '' : r.have + ' / ' + r.need + ' cr';
      const names = (r.taken.length ? r.taken : r.taking).join(', ');
      return '<details class="dd ge" data-g="' + esc(key) + '"' + (isOpen || query.trim() ? ' open' : '') + '><summary><span class="dd-t">' + esc(g.name) + '<small>' + esc(g.code) + (g.was ? ' (was ' + esc(g.was) + ')' : '') + ' &middot; ' + g.courses.length + ' courses</small></span>' +
        (names ? '<span class="dd-taken">' + esc(names) + '</span>' : '') + '<span class="dd-n">' + count + '</span>' + pill(st, label) + '</summary>' +
        (isOpen || query.trim() ? '<div class="dd-b">' + groupBody(g, r) + '</div>' : '') + '</details>';
    }).join('');

    // graduation checklist
    const majorOk = a.groups.filter((g) => !['units', 'ge', 'ud', 'grad'].includes(g.key)).every((g) => g.status === 'met') && !a.needsTrack;
    const row = (label, detail, st, right, check) =>
      '<li class="gi"><span class="gi-s">' + pill(st, st === 'met' ? 'Done' : st === 'projected' ? 'In progress' : 'Open') + '</span><span class="gi-t"><b>' + esc(label) + '</b><small>' + esc(detail) + '</small></span><span class="gi-r">' + (check || esc(right || '')) + '</span></li>';
    const stU = (h, p, n) => (h >= n ? 'met' : p >= n ? 'projected' : 'missing');
    const box = (k) => '<label class="check"><input type="checkbox" data-check="' + k + '"' + (S.checks[k] ? ' checked' : '') + '> Confirmed</label>';
    const it = Object.fromEntries(GE.graduation.items.map((i) => [i.key, i]));
    $('#gradList').innerHTML =
      row(it.units.label, it.units.detail, stU(a.total.have, a.total.projected, a.total.need), a.total.have + ' / ' + a.total.need) +
      row(it.ud.label, it.ud.detail, stU(a.ud.have, a.ud.proj, a.ud.need), a.ud.have + ' / ' + a.ud.need) +
      row(it.ge.label, it.ge.detail, ge.status, ge.have + ' / ' + ge.need) +
      row(it.major.label, it.major.detail, majorOk ? 'met' : 'missing', '') +
      row(it.res.label, it.res.detail, S.checks.res ? 'met' : 'missing', '', box('res')) +
      row(it.gpa.label, it.gpa.detail, S.checks.gpa ? 'met' : 'missing', '', box('gpa')) +
      row(it.gwar.label, it.gwar.detail, S.checks.gwar ? 'met' : 'missing', '', box('gwar'));
    $('#gradRefs').innerHTML = GE.graduation.refs.map((r) => '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.label) + '</a></li>').join('');
  }

  document.addEventListener('toggle', (e) => {
    if (e.target.matches && e.target.matches('details.dd[data-g]')) {
      const was = open.get(e.target.dataset.g);
      if (was !== e.target.open) { open.set(e.target.dataset.g, e.target.open); renderGe(); }
    }
  }, true);
  $('#gePattern').addEventListener('change', (e) => { S.gePattern = e.target.value; save(); CT.renderAll(); });
  $('#geCertified').addEventListener('change', (e) => { S.geCertified = e.target.checked; save(); CT.renderAll(); });
  $('#geSearch').addEventListener('input', (e) => { query = e.target.value; renderGe(); });
  $('#geTaken').addEventListener('change', (e) => { takenOnly = e.target.checked; renderGe(); });
  document.addEventListener('change', (e) => {
    if (e.target.matches('input[data-check]')) { S.checks[e.target.dataset.check] = e.target.checked; save(); CT.renderAll(); }
  });
  document.addEventListener('ct:reset', () => { query = ''; takenOnly = false; $('#geSearch').value = ''; $('#geTaken').checked = false; });

  CT.register('ge', renderGe);
})();
