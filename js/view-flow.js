(function () {
  const CT = window.CT;
  const { L, R, byId, S, $, esc, catalogLink, courseSelect } = CT;

  let selectedNode = null;

  // ---------- flowchart ----------
  const NODE_W = 108, NODE_H = 36, GAP_X = 64, GAP_Y = 14, PAD = 8, HEAD = 18;
  function chartIds() {
    const set = new Set([...R.lower, ...R.upperCore, 'PHYS 151', ...R.pickOne.flatMap((p) => p.options)]);
    const t = R.tracks[S.track];
    if ($('#allElectives').checked) R.sharedElectives.forEach((id) => set.add(id));
    if (t) [t.required, ...t.options].forEach((id) => set.add(id));
    return [...set];
  }
  function edgesOf(id) {
    const c = byId.get(id);
    const out = [];
    const walk = (e, kind) => {
      if (!e) return;
      if (typeof e === 'string') out.push({ from: e, kind });
      else if (e.all) e.all.forEach((x) => walk(x, kind));
      else e.any.forEach((x) => walk(x, 'any'));
    };
    walk(c.pre, 'all');
    walk(c.co, 'co');
    return out;
  }
  function renderChart() {
    const ids = chartIds();
    const present = new Set(ids);
    const depthMemo = new Map();
    const depth = (id) => {
      if (depthMemo.has(id)) return depthMemo.get(id);
      depthMemo.set(id, 0);
      const d = Math.max(-1, ...L.leaves(byId.get(id).pre).filter((x) => present.has(x)).map(depth)) + 1;
      depthMemo.set(id, d);
      return d;
    };
    const groupOf = (id) => R.lower.includes(id) || id === 'PHYS 151' ? 0 : R.upperCore.includes(id) ? 1 : R.pickOne.some((p) => p.options.includes(id)) ? 2 : 3;
    const cols = [];
    ids.forEach((id) => { (cols[depth(id)] = cols[depth(id)] || []).push(id); });
    cols.forEach((c, i) => { cols[i] = (c || []).sort((a, b) => groupOf(a) - groupOf(b) || a.localeCompare(b)); });
    const pos = new Map();
    let maxRows = 0;
    cols.forEach((col, ci) => {
      maxRows = Math.max(maxRows, col.length);
      col.forEach((id, ri) => pos.set(id, { x: PAD + ci * (NODE_W + GAP_X), y: PAD + HEAD + ri * (NODE_H + GAP_Y) }));
    });
    const W = PAD * 2 + cols.length * NODE_W + (cols.length - 1) * GAP_X;
    const H = PAD * 2 + HEAD + maxRows * NODE_H + (maxRows - 1) * GAP_Y;
    const doneS = L.doneSet(S), ipS = L.ipSet(S);
    const haveAll = new Set([...doneS, ...ipS]);
    const unitsNow = L.audit(S).total.projected;
    const status = (id) => doneS.has(id) ? 'ok' : ipS.has(id) ? 'prog' : L.eligible(id, haveAll, [], unitsNow) ? 'ready' : 'locked';
    const mark = { ok: '✓ done', prog: '◐ in progress', ready: '● ready', locked: 'locked' };

    // highlight set for the selected node
    let hi = null;
    if (selectedNode && present.has(selectedNode)) {
      hi = new Set([selectedNode]);
      const up = (id) => edgesOf(id).forEach((e) => { if (present.has(e.from) && !hi.has(e.from)) { hi.add(e.from); up(e.from); } });
      up(selectedNode);
      const down = (id) => ids.forEach((o) => { if (!hi.has(o) && edgesOf(o).some((e) => e.from === id)) { hi.add(o); down(o); } });
      down(selectedNode);
    }
    let edgesSvg = '';
    ids.forEach((to) => edgesOf(to).forEach((e) => {
      if (!present.has(e.from)) return;
      const a = pos.get(e.from), b = pos.get(to);
      if (b.x <= a.x) return; // same column: shown in the detail panel
      const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2, mx = (x1 + x2) / 2;
      const on = hi && hi.has(e.from) && hi.has(to);
      edgesSvg += '<path class="edge ' + e.kind + (hi ? (on ? ' hi' : ' dim') : '') + '" d="M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>';
    }));
    let nodesSvg = '';
    ids.forEach((id) => {
      const p = pos.get(id), st = status(id);
      nodesSvg += '<g class="node st-' + st + (hi && !hi.has(id) ? ' dim' : '') + (selectedNode === id ? ' sel' : '') + '" data-node="' + esc(id) + '" tabindex="0" role="button" aria-label="' + esc(id + ', ' + byId.get(id).title + ', ' + mark[st]) + '" transform="translate(' + p.x + ' ' + p.y + ')">' +
        '<rect width="' + NODE_W + '" height="' + NODE_H + '" rx="6"/><text class="t-code" x="8" y="15">' + esc(id) + '</text><text class="t-mark" x="8" y="29">' + mark[st] + '</text></g>';
    });
    const labels = cols.map((c, ci) => '<text class="col-label" x="' + (PAD + ci * (NODE_W + GAP_X)) + '" y="' + (PAD + 8) + '">' + (ci === 0 ? 'Start here' : 'After ' + ci + ' step' + (ci === 1 ? '' : 's')) + '</text>').join('');
    $('#chartWrap').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="group" aria-label="Prerequisite flowchart">' + labels + edgesSvg + nodesSvg + '</svg>';
    renderDetail();
  }
  function renderDetail() {
    const el = $('#detail');
    if (!selectedNode || !byId.has(selectedNode)) { el.innerHTML = '<p class="empty">Select a course in the chart to see its prerequisites.</p>'; return; }
    const id = selectedNode, c = byId.get(id);
    const doneS = L.doneSet(S), ipS = L.ipSet(S);
    const haveAll = new Set([...doneS, ...ipS]);
    const unitsNow = L.audit(S).total.projected;
    const unlocks = L.courses.filter((o) => L.leaves(o.pre).includes(id) || L.leaves(o.co).includes(id)).map((o) => o.id);
    const blockers = L.blockers(id, haveAll, unitsNow);
    const status = doneS.has(id) ? 'Done (' + S.done[id] + ')' : ipS.has(id) ? 'In progress' : S.done[id] ? 'Taken, grade below C' : blockers.length ? 'Locked' : 'Ready to take';
    const rows = [
      ['Status', status],
      ['Units', c.units],
      ['Needs first', c.pre ? L.exprText(c.pre) : 'Nothing in the program list'],
      ['Alongside', c.co ? L.exprText(c.co) : ''],
      ['Units rule', c.minUnits ? c.minUnits + ' units completed' : ''],
      ['Also needs', c.ext ? c.ext.join('; ') + ' (not tracked here)' : ''],
      ['Blocked by', !doneS.has(id) && blockers.length ? blockers.join('. ') : ''],
      ['Unlocks', unlocks.length ? unlocks.join(', ') : 'Nothing else in the program list'],
      ['Note', c.note || '']
    ].filter((r) => r[1] !== '');
    el.innerHTML = '<h3><span class="mono">' + esc(id) + '</span> ' + esc(c.title) + '</h3><dl>' +
      rows.map((r) => '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl>' +
      '<p><a href="' + catalogLink(id) + '" target="_blank" rel="noopener">Open the catalog entry</a></p>' +
      '<div>' + courseSelect(id) + '</div>';
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-node]');
    if (!t) return;
    selectedNode = selectedNode === t.dataset.node ? null : t.dataset.node;
    renderChart();
    const n = document.querySelector('[data-node="' + t.dataset.node + '"]');
    if (n) n.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.node')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  document.addEventListener('ct:reset', () => { selectedNode = null; });
  $('#allElectives').addEventListener('change', renderChart);
  CT.register('flow', renderChart);
})();
