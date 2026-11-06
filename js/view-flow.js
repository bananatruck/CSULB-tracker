/* The flowchart: the main screen.
   Rows are lanes (math, foundations, upper core, picks, track, electives), columns are prerequisite depth.
   Click a course to cycle not taken > in progress > completed. Locked courses open the sheet instead. */
(function () {
  const CT = window.CT;
  const { L, R, byId, S, $, esc, save, setCourse, catalogLink, GRADES } = CT;

  const NODE_W = 104, NODE_H = 46, GAP_X = 52, GAP_Y = 10, MAX_ROWS = 2;
  const LEFT = 20, TOP = 14, HEAD = 40, LANE_GAP = 10, LANE_PAD = 12;
  const MIN_ZOOM = 0.45, MAX_ZOOM = 1.6;

  let selected = null;
  let elecOpen = false;
  let zoom = 1;
  let userZoomed = false;
  let geo = null; // last layout: { W, H, pos }

  // Prerequisite edges: solid = needs, dashed = one of several, dotted = alongside.
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

  function layout() {
    const lanes = L.lanes(S);
    const ctx = L.flowCtx(S);
    const ipS = L.ipSet(S);
    // The elective list is long, so it stays closed until asked for. Started electives always show.
    lanes.forEach((l) => {
      l.shown = l.key === 'elec' && !elecOpen ? l.ids.filter((id) => ctx.done.has(id) || ipS.has(id)) : l.ids;
    });
    const present = new Set(lanes.flatMap((l) => l.shown));
    const memo = new Map();
    const depth = (id) => {
      if (memo.has(id)) return memo.get(id);
      memo.set(id, 0);
      const d = Math.max(-1, ...L.leaves(byId.get(id).pre).filter((x) => present.has(x)).map(depth)) + 1;
      memo.set(id, d);
      return d;
    };
    let maxCol = 0;
    lanes.forEach((l) => {
      l.cols = [];
      l.shown.forEach((id) => {
        const d = depth(id);
        (l.cols[d] = l.cols[d] || []).push(id);
        maxCol = Math.max(maxCol, d);
      });
    });
    // A depth gets as many sub-columns as its fullest lane needs (at most MAX_ROWS nodes tall), so the
    // chart grows wide instead of tall and fits on one screen.
    const subs = [];
    for (let d = 0; d <= maxCol; d++) subs[d] = Math.max(1, ...lanes.map((l) => Math.ceil((l.cols[d] || []).length / MAX_ROWS)));
    const colX = [];
    let acc = LEFT;
    for (let d = 0; d <= maxCol; d++) { colX[d] = acc; acc += subs[d] * (NODE_W + GAP_X); }
    const pos = new Map();
    let y = TOP;
    lanes.forEach((l) => {
      const rows = Math.max(1, ...Array.from(l.cols, (c) => Math.min(MAX_ROWS, c ? c.length : 0)));
      l.top = y;
      l.h = HEAD + rows * NODE_H + (rows - 1) * GAP_Y + LANE_PAD;
      l.cols.forEach((col, d) => (col || []).forEach((id, i) => {
        pos.set(id, { x: colX[d] + Math.floor(i / MAX_ROWS) * (NODE_W + GAP_X), y: y + HEAD + (i % MAX_ROWS) * (NODE_H + GAP_Y) });
      }));
      y += l.h + LANE_GAP;
    });
    return { lanes, present, pos, ctx, W: acc - GAP_X + LEFT, H: y + TOP };
  }

  function nodeState(id, ctx) {
    const st = L.statusOf(id, S);
    const lk = L.lock(id, ctx, S.forceOpen);
    let cls = st === 'done' ? 'done' : st === 'ip' ? 'ip' : st === 'fail' ? 'fail' : lk.open ? 'open' : lk.waiting ? 'wait' : 'locked';
    return { st, lk, cls, warn: (st === 'done' || st === 'ip') && !lk.open };
  }

  const GLYPH = {
    done: '<text class="n-glyph" x="' + (NODE_W - 16) + '" y="30">&#10003;</text>',
    ip: '<text class="n-glyph" x="' + (NODE_W - 16) + '" y="30">&#9680;</text>',
    fail: '<text class="n-glyph" x="' + (NODE_W - 16) + '" y="30">!</text>',
    wait: '<text class="n-glyph" x="' + (NODE_W - 16) + '" y="30">&hellip;</text>',
    locked: '<g class="n-lock" transform="translate(' + (NODE_W - 24) + ' 17)"><rect y="5" width="10" height="8" rx="1.8"/><path d="M2 5V3.6a3 3 0 0 1 6 0V5" fill="none"/></g>'
  };

  function render() {
    const stage = $('#stage');
    geo = layout();
    const { lanes, present, pos, ctx, W, H } = geo;

    // Selecting a course highlights everything it needs and everything it unlocks.
    let hi = null;
    if (selected && present.has(selected)) {
      hi = new Set([selected]);
      const up = (id) => edgesOf(id).forEach((e) => { if (present.has(e.from) && !hi.has(e.from)) { hi.add(e.from); up(e.from); } });
      const down = (id) => [...present].forEach((o) => { if (!hi.has(o) && edgesOf(o).some((e) => e.from === id)) { hi.add(o); down(o); } });
      up(selected);
      down(selected);
    }

    let bands = '';
    lanes.forEach((l, i) => {
      const barX = LEFT + 214, barW = 130;
      const px = (n) => (l.need ? Math.round((n / l.need) * barW) : 0);
      bands += '<rect class="band b' + (i % 2) + '" x="0" y="' + l.top + '" width="' + W + '" height="' + l.h + '"/>' +
        '<text class="lane-t" x="' + LEFT + '" y="' + (l.top + 24) + '">' + esc(l.label) + '</text>' +
        '<rect class="bar-bg" x="' + barX + '" y="' + (l.top + 17) + '" width="' + barW + '" height="7" rx="3.5"/>' +
        '<rect class="bar-proj" x="' + barX + '" y="' + (l.top + 17) + '" width="' + px(l.proj) + '" height="7" rx="3.5"/>' +
        '<rect class="bar-have" x="' + barX + '" y="' + (l.top + 17) + '" width="' + px(l.have) + '" height="7" rx="3.5"/>' +
        '<text class="lane-n" x="' + (barX + barW + 10) + '" y="' + (l.top + 24) + '">' + l.have + ' / ' + l.need + ' cr</text>';
      if (l.key === 'elec') {
        const label = elecOpen ? 'Hide list' : 'Show ' + l.ids.length;
        bands += '<g class="tgl" data-toggle="elec" tabindex="0" role="button" aria-label="' + esc(elecOpen ? 'Hide the elective list' : 'Show all electives') + '" transform="translate(' + (barX + barW + 100) + ' ' + (l.top + 9) + ')"><rect width="92" height="24" rx="12"/><text x="46" y="16">' + label + '</text></g>';
        if (!l.shown.length) bands += '<text class="hint-t" x="' + LEFT + '" y="' + (l.top + HEAD + 26) + '">Open the list to pick two electives.</text>';
      }
      if (l.key === 'track' && !S.track) {
        bands += '<text class="hint-t" x="' + LEFT + '" y="' + (l.top + HEAD + 26) + '">Pick Software, Cyber or ML / AI at the top.</text>';
      }
    });

    let edges = '';
    [...present].forEach((to) => edgesOf(to).forEach((e) => {
      if (!present.has(e.from)) return;
      const a = pos.get(e.from), b = pos.get(to);
      if (b.x <= a.x) return;
      const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2, mx = (x1 + x2) / 2;
      const on = hi && hi.has(e.from) && hi.has(to);
      const fromDone = L.doneSet(S).has(e.from);
      edges += '<path class="edge ' + e.kind + (fromDone ? ' e-done' : '') + (hi ? (on ? ' hi' : ' dim') : '') + '" d="M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>';
    }));

    let nodes = '';
    [...present].forEach((id) => {
      const p = pos.get(id), n = nodeState(id, ctx), c = byId.get(id);
      const label = id + ', ' + c.title + ', ' + (n.cls === 'locked' ? 'locked' : n.cls === 'wait' ? 'waiting on in-progress course' : n.cls === 'open' ? 'open' : n.cls === 'ip' ? 'in progress' : n.cls === 'done' ? 'completed' : 'grade below C');
      nodes += '<g class="node n-' + n.cls + (n.warn ? ' warn' : '') + (hi && !hi.has(id) ? ' dim' : '') + (selected === id ? ' sel' : '') + '" data-node="' + esc(id) + '" tabindex="0" role="button" aria-label="' + esc(label) + '" transform="translate(' + p.x + ' ' + p.y + ')">' +
        '<title>' + esc(id + ' ' + c.title) + '</title>' +
        '<rect width="' + NODE_W + '" height="' + NODE_H + '" rx="9"/>' +
        '<text class="n-code" x="11" y="20">' + esc(id) + '</text>' +
        '<text class="n-cr" x="11" y="37">' + c.units + ' cr</text>' + (GLYPH[n.cls] || '') + '</g>';
    });

    stage.innerHTML = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" width="' + Math.round(W * zoom) + '" height="' + Math.round(H * zoom) + '" role="group" aria-label="Course flowchart">' + bands + edges + nodes + '</svg>';
    renderSheet();
  }

  // ---------- sheet: the one small card for the selected course ----------
  function renderSheet() {
    const el = $('#sheet');
    if (!selected || !byId.has(selected)) { el.hidden = true; el.innerHTML = ''; return; }
    const id = selected, c = byId.get(id);
    const ctx = L.flowCtx(S);
    const n = nodeState(id, ctx);
    const unlocks = L.courses.filter((o) => L.leaves(o.pre).includes(id) || L.leaves(o.co).includes(id)).length;
    const needs = c.pre ? 'Needs ' + L.exprText(c.pre) : 'No prerequisites';
    const grade = L.statusOf(id, S) === 'done' || L.statusOf(id, S) === 'fail' ? S.done[id] : '';
    const canSet = n.lk.open || L.statusOf(id, S) !== 'none';
    const seg = (v, label) => '<button type="button" data-set="' + v + '" aria-pressed="' + ((v === '' && n.st === 'none') || (v === 'ip' && n.st === 'ip') || (v === 'P' && (n.st === 'done' || n.st === 'fail'))) + '"' + (!canSet && v !== '' ? ' disabled' : '') + '>' + label + '</button>';
    const lockLine = !n.lk.open && n.st === 'none' ? '<p class="sh-lock">' + (n.lk.waiting ? 'Waiting on ' : 'Finish ') + esc(n.lk.missing.join(' and ')) + (n.lk.waiting ? ' to finish.' : ' first.') + '</p>' : '';
    const gradeSel = grade ? '<label class="sh-grade">Grade <select data-grade>' + GRADES.map((g) => '<option value="' + g + '"' + (g === grade ? ' selected' : '') + '>' + (g === 'P' ? 'Passed (C or better)' : g + (L.isPassing(g) ? '' : ' (below C)')) + '</option>').join('') + '</select></label>' : '';
    el.hidden = false;
    el.innerHTML = '<div class="sh-top"><div class="sh-name"><span class="sh-code">' + esc(id) + '</span><span class="sh-title">' + esc(c.title) + '</span></div><button type="button" class="sh-x" data-close aria-label="Close">&times;</button></div>' +
      '<p class="sh-meta">' + c.units + ' cr &middot; ' + esc(needs) + (unlocks ? ' &middot; unlocks ' + unlocks : '') + '</p>' + lockLine +
      '<div class="seg" role="group" aria-label="Status">' + seg('', 'Not taken') + seg('ip', 'In progress') + seg('P', 'Completed') + '</div>' + gradeSel +
      '<a class="sh-link" href="' + catalogLink(id) + '" target="_blank" rel="noopener">Catalog page</a>';
  }

  // ---------- actions ----------
  function apply(id, v) {
    setCourse(id, v);
    save();
    CT.renderAll();
  }
  function clickNode(id) {
    selected = id;
    const n = nodeState(id, L.flowCtx(S));
    if (n.lk.open || n.st !== 'none') apply(id, L.cycleNext(id, S));
    else render();
  }

  $('#stage').addEventListener('click', (e) => {
    const tgl = e.target.closest('[data-toggle]');
    if (tgl) { elecOpen = !elecOpen; render(); return; }
    const t = e.target.closest('[data-node]');
    if (t) { clickNode(t.dataset.node); return; }
    if (selected) { selected = null; render(); }
  });
  $('#stage').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-node],[data-toggle]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selected) { selected = null; render(); }
  });
  $('#sheet').addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { selected = null; render(); return; }
    const b = e.target.closest('[data-set]');
    if (b && !b.disabled) apply(selected, b.dataset.set);
  });
  $('#sheet').addEventListener('change', (e) => {
    if (e.target.matches('[data-grade]')) apply(selected, e.target.value);
  });
  document.addEventListener('ct:reset', () => { selected = null; });
  document.addEventListener('ct:select', (e) => {
    selected = e.detail;
    location.hash = '#flow';
    render();
    requestAnimationFrame(() => centerOn(selected));
  });

  // ---------- pan and zoom ----------
  function resize() {
    const s = $('#stage svg');
    if (!s || !geo) return;
    s.setAttribute('width', Math.round(geo.W * zoom));
    s.setAttribute('height', Math.round(geo.H * zoom));
  }
  function setZoom(z, manual) {
    zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    if (manual) userZoomed = true;
    resize();
  }
  // Fit the whole chart on screen when that stays readable; otherwise fit the width and scroll down.
  function fit() {
    const w = $('#stage').clientWidth, h = $('#stage').clientHeight;
    if (!w || !geo) return;
    userZoomed = false;
    const zw = (w - 24) / geo.W, zh = (h - 24 - 84) / geo.H; // 84 = the space under the chart for the floating controls
    let z = Math.min(zw, zh);
    if (z < 0.62) z = Math.max(Math.min(zw, 1), 0.7);
    setZoom(Math.min(z, 1.25));
  }
  function centerOn(id) {
    const p = geo && geo.pos.get(id);
    const st = $('#stage');
    if (!p) return;
    st.scrollTo({ left: Math.max(0, (p.x + NODE_W / 2) * zoom - st.clientWidth / 2), top: Math.max(0, (p.y + NODE_H / 2) * zoom - st.clientHeight / 2), behavior: 'smooth' });
  }
  $('#zIn').addEventListener('click', () => setZoom(zoom + 0.15, true));
  $('#zOut').addEventListener('click', () => setZoom(zoom - 0.15, true));
  $('#zFit').addEventListener('click', fit);
  $('#stage').addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92), true);
  }, { passive: false });

  // Mouse drag pans the canvas. Touch uses the browser's own scrolling.
  let drag = null;
  $('#stage').addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.target.closest('[data-node],[data-toggle]')) return;
    const st = $('#stage');
    drag = { x: e.clientX, y: e.clientY, l: st.scrollLeft, t: st.scrollTop, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    drag.moved = true;
    $('#stage').classList.add('panning');
    $('#stage').scrollLeft = drag.l - dx;
    $('#stage').scrollTop = drag.t - dy;
  });
  window.addEventListener('pointerup', () => {
    if (drag && drag.moved) {
      // swallow the click that follows a pan so it does not close the sheet
      const swallow = (ev) => { ev.stopPropagation(); };
      $('#stage').addEventListener('click', swallow, { capture: true, once: true });
    }
    drag = null;
    $('#stage').classList.remove('panning');
  });

  document.addEventListener('ct:show', (e) => { if (e.detail === 'flow' && !userZoomed) fit(); });
  window.addEventListener('resize', () => { if (!userZoomed) fit(); });

  CT.register('flow', render);
  CT.fitFlow = fit;
})();
