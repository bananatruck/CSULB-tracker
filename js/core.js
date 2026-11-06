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
  const catalogLink = (id) => 'https://csulb.catalog.acalog.com/preview_course_nopop.php?catoid=12&coid=' + byId.get(id).coid;

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
    if (raw.forceOpen === true) s.forceOpen = true;
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
  function setCourse(id, v) {
    delete S.done[id];
    S.ip = S.ip.filter((x) => x !== id);
    if (v === 'ip') S.ip.push(id);
    else if (v) S.done[id] = v;
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
    sanitize, save, setState, say, setCourse,
    register, renderAll, storageOk: () => storageOk
  };
})();
