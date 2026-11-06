/* Shared UI core: state, persistence, small helpers, and the view registry.
   Views register a render function; renderAll calls them in order. */
(function () {
  const L = window.CSULB_LOGIC;
  const P = window.CSULB_PROFS;
  const { byId, R, GRADES } = L;
  const KEY = 'csulb-tracker:v1';
  const TERMS = ['Fall 2026', 'Spring 2027', 'Fall 2027', 'Spring 2028', 'Fall 2028', 'Spring 2029', 'Fall 2029'];
  const UNIT_CHOICES = [6, 9, 12, 15, 18];
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const catalogLink = (id) => 'https://csulb.catalog.acalog.com/preview_course_nopop.php?catoid=8&coid=' + byId.get(id).coid;

  // ---------- state ----------
  // Anything read from storage or an imported file is whitelisted field by field.
  function sanitize(raw) {
    const s = L.emptyState();
    if (!raw || typeof raw !== 'object') return s;
    if (R.tracks[raw.track]) s.track = raw.track;
    if (raw.done && typeof raw.done === 'object') for (const [id, g] of Object.entries(raw.done)) if (byId.has(id) && GRADES.includes(g)) s.done[id] = g;
    if (Array.isArray(raw.ip)) s.ip = [...new Set(raw.ip.filter((id) => byId.has(id) && !s.done[id]))];
    const ou = Number(raw.otherUnits);
    if (Number.isFinite(ou)) s.otherUnits = Math.min(120, Math.max(0, Math.round(ou)));
    if (UNIT_CHOICES.includes(Number(raw.termUnits))) s.termUnits = Number(raw.termUnits);
    if (TERMS.includes(raw.startTerm)) s.startTerm = raw.startTerm;
    if (TERMS.includes(raw.gradTerm)) s.gradTerm = raw.gradTerm;
    return s;
  }
  function load() {
    try { return sanitize(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return L.emptyState(); }
  }
  const S = load(); // one shared object, replaced in place by setState
  let storageOk = true;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOk = false; }
  }
  function setState(next) {
    Object.keys(S).forEach((k) => delete S[k]);
    Object.assign(S, next);
    save();
    document.dispatchEvent(new Event('ct:reset'));
  }

  // ---------- helpers ----------
  const stLabel = { met: 'Met', projected: 'If in-progress pass', missing: 'Open' };
  const pill = (st) => '<span class="pill ' + st + '">' + stLabel[st] + '</span>';
  const selVal = (id) => (S.done[id] ? S.done[id] : S.ip.includes(id) ? 'ip' : '');
  const selClass = (id) => {
    const g = S.done[id];
    if (g) return L.isPassing(g) ? 'st-met' : 'st-fail';
    return S.ip.includes(id) ? 'st-ip' : '';
  };
  function setCourse(id, v) {
    delete S.done[id];
    S.ip = S.ip.filter((x) => x !== id);
    if (v === 'ip') S.ip.push(id);
    else if (v) S.done[id] = v;
  }
  function courseSelect(id) {
    const opts = [['', 'Not taken'], ['ip', 'In progress'], ...GRADES.map((g) => [g, g + (L.isPassing(g) ? '' : ' (below C)')])];
    return '<select class="cs ' + selClass(id) + '" data-course="' + esc(id) + '" aria-label="Status of ' + esc(id) + '">' +
      opts.map(([v, t]) => '<option value="' + esc(v) + '"' + (selVal(id) === v ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>';
  }
  function courseRow(id, sub) {
    const c = byId.get(id);
    return '<li class="course"><a class="code" href="' + catalogLink(id) + '" target="_blank" rel="noopener">' + esc(id) + '</a>' +
      '<span class="ctitle">' + esc(c.title) + '<small>' + c.units + ' unit' + (c.units === 1 ? '' : 's') + '</small></span>' +
      courseSelect(id) + (sub ? '<span class="c-sub">' + esc(sub) + '</span>' : '') + '</li>';
  }
  function meter(label, val, proj, need, foot) {
    const pct = (n) => Math.min(100, Math.round((n / need) * 100));
    return '<div class="meter"><div class="meter-head"><span>' + esc(label) + '</span><b>' + val + ' / ' + need + '</b></div>' +
      '<div class="bar" role="img" aria-label="' + esc(label) + ': ' + val + ' of ' + need + ' done, ' + proj + ' with in-progress"><i class="proj" style="width:' + pct(proj) + '%"></i><i class="have" style="width:' + pct(val) + '%"></i></div>' +
      '<div class="meter-foot">' + esc(foot) + '</div></div>';
  }
  function say(msg) { const el = $('#setupMsg'); if (el) el.textContent = msg; }

  // ---------- views ----------
  const views = [];
  function register(name, fn) { views.push({ name, fn }); }
  function renderAll() {
    // Re-rendering replaces the DOM, so put keyboard focus back on the same control afterwards.
    const a = document.activeElement;
    const d = a && a.dataset;
    const key = d && (d.course ? '[data-course="' + d.course + '"]' : d.node ? '[data-node="' + d.node + '"]' : d.track ? '[data-track="' + d.track + '"]' : '');
    views.forEach((v) => v.fn());
    if (key) {
      const el = document.querySelector(key);
      if (el) el.focus({ preventScroll: true });
    }
  }

  window.CT = {
    L, P, R, byId, GRADES, TERMS, UNIT_CHOICES, S, $, esc, catalogLink,
    sanitize, save, setState, say, stLabel, pill, selVal, selClass, setCourse, courseSelect, courseRow, meter,
    register, renderAll, storageOk: () => storageOk
  };
})();
