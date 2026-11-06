/* Pure logic: audit, eligibility, recommender. No DOM access, so it runs in Node tests too. */
(function (root) {
  const DATA = typeof module !== 'undefined' && module.exports ? require('./data-courses.js') : root.CSULB_DATA;
  const GE = typeof module !== 'undefined' && module.exports ? require('./data-ge.js') : root.CSULB_GE;
  const { courses, requirements: R } = DATA;
  const byId = new Map(courses.map((c) => [c.id, c]));

  // 'P' means "passed, C or better". Clicking a course to completed stores P, so no guessed letter grade.
  const GRADES = ['P', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'CR', 'C-', 'D+', 'D', 'D-', 'F'];
  const PASSING = new Set(['P', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'CR']);
  const DONE_DEFAULT = 'P';
  const isPassing = (g) => PASSING.has(g);

  const units = (id) => (byId.get(id) ? byId.get(id).units : 0);
  const sumUnits = (ids) => ids.reduce((s, id) => s + units(id), 0);

  // ---------- expressions ----------
  const holds = (expr, have) => {
    if (!expr) return true;
    if (typeof expr === 'string') return have.has(expr);
    if (expr.all) return expr.all.every((e) => holds(e, have));
    if (expr.any) return expr.any.some((e) => holds(e, have));
    return true;
  };
  const leaves = (expr) => {
    if (!expr) return [];
    if (typeof expr === 'string') return [expr];
    return (expr.all || expr.any || []).flatMap(leaves);
  };
  const exprText = (expr) => {
    if (!expr) return '';
    if (typeof expr === 'string') return expr;
    if (expr.all) return expr.all.map((e) => (e.any ? '(' + exprText(e) + ')' : exprText(e))).join(' and ');
    return expr.any.map(exprText).join(' or ');
  };

  // ---------- state helpers ----------
  const emptyState = () => ({ track: '', done: {}, ip: [], otherUnits: 0, termUnits: 15, startTerm: 'Spring 2027', gradTerm: 'Spring 2027', forceOpen: false, gePattern: '2025', geCertified: false, units: {}, checks: {} });
  const doneSet = (state) => new Set(Object.keys(state.done).filter((id) => isPassing(state.done[id])));
  const ipSet = (state) => new Set(state.ip.filter((id) => !doneSet(state).has(id)));

  // ---------- focus / elective allocation ----------
  // A course counts toward the focus area or the shared electives, never both.
  function allocate(trackKey, have) {
    const t = R.tracks[trackKey];
    if (!t) return null;
    const shared = new Set(R.sharedElectives);
    const needFocus = R.focusUnits;
    const focus = [];
    if (have.has(t.required)) focus.push(t.required);
    let focusUnits = sumUnits(focus);
    // Prefer options that are not in the shared list (they cannot count anywhere else).
    const opts = t.options.filter((id) => have.has(id)).sort((a, b) => Number(shared.has(a)) - Number(shared.has(b)));
    for (const id of opts) {
      if (focusUnits >= needFocus) break;
      focus.push(id);
      focusUnits += units(id);
    }
    const pool = [...have].filter((id) => shared.has(id) && !focus.includes(id));
    const elective = [];
    let electiveUnits = 0;
    for (const id of pool) {
      elective.push(id);
      electiveUnits += units(id);
    }
    return {
      focus, focusUnits, hasRequired: have.has(t.required),
      elective, electiveUnits
    };
  }

  // ---------- audit ----------
  function itemStatus(id, state) {
    const g = state.done[id];
    if (g && isPassing(g)) return 'met';
    if (ipSet(state).has(id)) return 'ip';
    if (g) return 'fail';
    return 'missing';
  }
  const groupStatus = (items) =>
    items.every((i) => i.status === 'met') ? 'met' : items.every((i) => i.status === 'met' || i.status === 'ip') ? 'projected' : 'missing';

  function audit(state) {
    const done = doneSet(state);
    const ip = ipSet(state);
    const haveAll = new Set([...done, ...ip]);
    const groups = [];
    const mk = (id) => ({ id, status: itemStatus(id, state), grade: state.done[id] || '' });

    groups.push({ key: 'lower', title: 'Lower division core', note: 'All required. C or better in each.', items: R.lower.map(mk) });
    groups.push({ key: 'upper', title: 'Upper division core', note: 'All required. C or better in each.', items: R.upperCore.map(mk) });

    for (const p of R.pickOne) {
      const items = p.options.map(mk);
      const met = items.find((i) => i.status === 'met');
      const ipi = items.find((i) => i.status === 'ip');
      groups.push({
        key: p.key, title: 'Pick one: ' + p.label, note: 'Take one of these.', items,
        status: met ? 'met' : ipi ? 'projected' : 'missing',
        need: met || ipi ? '' : 'Take either ' + p.label + '.'
      });
    }

    // Science
    const sciItems = R.science.pool.map(mk);
    const sciUnits = (set) => sumUnits(R.science.pool.filter((id) => set.has(id)));
    const startOk = (set) => R.science.startOneOf.some((id) => set.has(id));
    const sciMet = startOk(done) && sciUnits(done) >= R.science.minUnits;
    const sciProj = startOk(haveAll) && sciUnits(haveAll) >= R.science.minUnits;
    groups.push({
      key: 'science', title: 'Approved science electives',
      note: 'At least ' + R.science.minUnits + ' units, starting with PHYS 151 or CHEM 111A; remaining units from BIOL 200, 205 or 207.',
      items: sciItems, status: sciMet ? 'met' : sciProj ? 'projected' : 'missing',
      progress: { have: sciUnits(done), projected: sciUnits(haveAll), need: R.science.minUnits },
      need: sciProj ? '' : (startOk(haveAll) ? '' : 'Need PHYS 151 or CHEM 111A. ') + (sciUnits(haveAll) < R.science.minUnits ? (R.science.minUnits - sciUnits(haveAll)) + ' more science units.' : '')
    });

    // Track
    const trackKey = state.track;
    let track = null;
    if (R.tracks[trackKey]) {
      const t = R.tracks[trackKey];
      const aDone = allocate(trackKey, done);
      const aProj = allocate(trackKey, haveAll);
      const focusItems = [t.required, ...t.options].map(mk);
      const reqOk = aProj.hasRequired;
      track = {
        key: trackKey, name: t.name, required: t.required, options: t.options,
        focus: { have: aDone.focusUnits, projected: aProj.focusUnits, need: R.focusUnits, chosenDone: aDone.focus, chosenProj: aProj.focus },
        elective: { have: aDone.electiveUnits, projected: aProj.electiveUnits, need: R.electiveUnits, chosenDone: aDone.elective, chosenProj: aProj.elective }
      };
      const fMet = aDone.hasRequired && aDone.focusUnits >= R.focusUnits;
      const fProj = reqOk && aProj.focusUnits >= R.focusUnits;
      groups.push({
        key: 'focus', title: t.name + ' focus area (' + R.focusUnits + ' units)',
        note: t.required + ' is required, plus 9 units from the list.',
        items: focusItems, status: fMet ? 'met' : fProj ? 'projected' : 'missing',
        progress: track.focus,
        need: fProj ? '' : (reqOk ? '' : 'Need ' + t.required + '. ') + (aProj.focusUnits < R.focusUnits ? (R.focusUnits - aProj.focusUnits) + ' more focus units.' : '')
      });
      const eMet = aDone.electiveUnits >= R.electiveUnits;
      const eProj = aProj.electiveUnits >= R.electiveUnits;
      groups.push({
        key: 'electives', title: 'Upper-division electives (' + R.electiveUnits + ' units)',
        note: 'From the shared list. A course cannot count for both focus and electives.',
        items: track.elective.chosenProj.map(mk), status: eMet ? 'met' : eProj ? 'projected' : 'missing',
        progress: track.elective,
        need: eProj ? '' : (R.electiveUnits - aProj.electiveUnits) + ' more elective units.'
      });
    }

    for (const g of groups) {
      if (!g.status) g.status = groupStatus(g.items);
      if (g.status !== 'met' && !g.need) g.need = g.items.filter((i) => i.status === 'missing' || i.status === 'fail').map((i) => i.id).join(', ');
    }

    // C-or-better issues: any attempted program course below C
    const gradeIssues = Object.keys(state.done).filter((id) => !isPassing(state.done[id]) && byId.has(id));

    // Pre-major gate
    const gate = R.preMajor.map(mk);

    // Units
    const majorUnits = sumUnits([...done]);
    const ipUnits = sumUnits([...ip]);
    // GE and free-elective courses outside the major program count toward the 120 once, at their own credits.
    const outside = (set) => [...set].filter((id) => !byId.has(id)).reduce((s, id) => s + unitsOfAny(id, state), 0);
    const geOnly = outside(done), geIp = outside(ip);
    const other = Math.max(0, Number(state.otherUnits) || 0);
    const total = { have: majorUnits + geOnly + other, projected: majorUnits + ipUnits + geOnly + geIp + other, need: R.totalUnits, majorUnits, ipUnits, geOnly, geIp, other };

    const totalGroup = {
      key: 'units', title: 'Total units (' + R.totalUnits + ')', note: 'Program courses plus your other units (GE, transfer, electives).',
      items: [], status: total.have >= total.need ? 'met' : total.projected >= total.need ? 'projected' : 'missing',
      progress: total, need: total.projected >= total.need ? '' : (total.need - total.projected) + ' more units.'
    };
    groups.push(totalGroup);

    const ge = geAudit(state);
    groups.push({
      key: 'ge', title: 'General Education (' + ge.pattern.label + ')', note: ge.pattern.groups.length + ' requirements', items: [], status: ge.status,
      progress: { have: ge.have, projected: ge.proj, need: ge.need }, need: ge.status === 'met' ? '' : ge.missingText
    });
    const ud = udUnits(state);
    groups.push({
      key: 'ud', title: 'Upper-division units (' + ud.need + ')', note: 'Courses numbered 300 to 499.', items: [],
      status: ud.have >= ud.need ? 'met' : ud.proj >= ud.need ? 'projected' : 'missing', progress: ud,
      need: ud.proj >= ud.need ? '' : (ud.need - ud.proj) + ' more upper-division units.'
    });
    const checks = state.checks || {};
    const grad = ['res', 'gpa', 'gwar'].filter((k) => !checks[k]);
    groups.push({
      key: 'grad', title: 'Residency, GPA and GWAR', note: 'Confirm each on your ARR.', items: [],
      status: grad.length ? 'missing' : 'met', need: grad.length ? 'Confirm: ' + grad.map((k) => ({ res: 'residency', gpa: '2.0 GPA', gwar: 'GWAR' }[k])).join(', ') + '.' : ''
    });

    const overall = groups.every((g) => g.status === 'met') && !gradeIssues.length ? 'met'
      : groups.every((g) => g.status === 'met' || g.status === 'projected') && !gradeIssues.length ? 'projected' : 'missing';
    const needsTrack = !R.tracks[trackKey];
    return { groups, gate, gateOk: gate.every((i) => i.status === 'met'), gradeIssues, total, track, ge, ud, overall: needsTrack && overall !== 'missing' ? 'missing' : overall, needsTrack };
  }

  // Which track has the most progress? Used to hint a choice when none is picked.
  function trackProgress(state) {
    const haveAll = new Set([...doneSet(state), ...ipSet(state)]);
    return Object.keys(R.tracks).map((k) => {
      const a = allocate(k, haveAll);
      return { key: k, name: R.tracks[k].name, units: a.focusUnits, need: R.focusUnits, hasRequired: a.hasRequired };
    });
  }

  // ---------- prerequisites and eligibility ----------
  const prereqLeaves = (id) => leaves((byId.get(id) || {}).pre);
  const coLeaves = (id) => leaves((byId.get(id) || {}).co);

  function eligible(id, have, termSet, unitsHave) {
    const c = byId.get(id);
    if (!c) return false;
    if (!holds(c.pre, have)) return false;
    if (c.co) {
      const withTerm = new Set([...have, ...(termSet || [])]);
      if (!holds(c.co, withTerm)) return false;
    }
    if (c.minUnits && unitsHave < c.minUnits) return false;
    return true;
  }

  // What blocks a course right now, as readable text.
  function blockers(id, have, unitsHave) {
    const c = byId.get(id);
    const out = [];
    if (!c) return out;
    if (!holds(c.pre, have)) out.push('Needs ' + exprText(c.pre));
    if (c.co && !holds(c.co, have)) out.push('Needs alongside (or before): ' + exprText(c.co));
    if (c.minUnits && unitsHave < c.minUnits) out.push('Needs ' + c.minUnits + ' units completed');
    return out;
  }

  // ---------- recommender ----------
  const GROUP_RANK = { lower: 1, upper: 2, pick: 3, science: 4, focusReq: 5, focus: 6, elective: 7, prereq: 2 };

  function depthTo(id, have, memo = new Map()) {
    if (have.has(id)) return 0;
    if (memo.has(id)) return memo.get(id);
    const c = byId.get(id);
    memo.set(id, 1);
    const pre = c && c.pre;
    let d = 0;
    const walk = (e) => {
      if (!e) return 0;
      if (typeof e === 'string') return depthTo(e, have, memo);
      if (e.all) return Math.max(0, ...e.all.map(walk));
      return Math.min(...e.any.map(walk));
    };
    d = walk(pre);
    memo.set(id, d + 1);
    return d + 1;
  }

  function wantedCourses(state, have) {
    const wanted = new Map(); // id -> {id, group, reason}
    const add = (id, group, reason) => { if (!have.has(id) && !wanted.has(id) && byId.has(id)) wanted.set(id, { id, group, reason }); };
    const memo = new Map();
    const best = (ids) => [...ids].filter((id) => !have.has(id)).sort((a, b) => depthTo(a, have, memo) - depthTo(b, have, memo));

    R.lower.forEach((id) => add(id, 'lower', 'Required lower-division course'));
    R.upperCore.forEach((id) => add(id, 'upper', 'Required upper-division core course'));
    for (const p of R.pickOne) {
      if (p.options.some((id) => have.has(id))) continue;
      const pick = best(p.options)[0];
      add(pick, 'pick', p.key === 'stats' && state.track === 'ml' ? 'Your stats pick, and it opens CECS 456 (ML and AI)' : 'You still need one of ' + p.label);
    }
    // science
    const sciHave = (set) => sumUnits(R.science.pool.filter((id) => set.has(id)));
    if (!R.science.startOneOf.some((id) => have.has(id))) add('PHYS 151', 'science', 'Starts your science sequence (also part of the pre-major gate)');
    let sciNow = sciHave(new Set([...have, ...[...wanted.keys()].filter((id) => R.science.pool.includes(id))]));
    for (const id of ['BIOL 200', 'BIOL 205', 'BIOL 207', 'CHEM 111A']) {
      if (sciNow >= R.science.minUnits) break;
      if (!have.has(id) && !wanted.has(id)) { add(id, 'science', 'Science units (you need ' + R.science.minUnits + ' total)'); sciNow += units(id); }
    }
    // track
    const t = R.tracks[state.track];
    if (t) {
      add(t.required, 'focusReq', 'Required for the ' + t.name + ' focus area');
      let fu = allocate(state.track, have).focusUnits;
      const picks = best(t.options);
      for (const id of picks) {
        if (fu >= R.focusUnits) break;
        add(id, 'focus', 'Counts toward your ' + t.name + ' focus area');
        fu += units(id);
      }
      // electives: 6 units from shared list not used by focus
      const a = allocate(state.track, have);
      let eu = a.electiveUnits;
      const cand = best(R.sharedElectives.filter((id) => !wanted.has(id)))
        .sort((x, y) => {
          const px = (byId.get(x).ext ? 1 : 0), py = (byId.get(y).ext ? 1 : 0);
          return px - py || depthTo(x, have, memo) - depthTo(y, have, memo);
        });
      for (const id of cand) {
        if (eu >= R.electiveUnits) break;
        add(id, 'elective', 'Counts as one of your ' + R.electiveUnits + ' elective units');
        eu += units(id);
      }
    }
    // pull in missing prerequisites that are program courses
    let changed = true;
    while (changed) {
      changed = false;
      for (const w of [...wanted.values()]) {
        const c = byId.get(w.id);
        const need = (e) => {
          if (!e) return;
          if (typeof e === 'string') { if (!have.has(e) && !wanted.has(e) && byId.has(e)) { add(e, 'prereq', 'Prerequisite for ' + w.id); changed = true; } return; }
          if (e.all) e.all.forEach(need);
          else if (!e.any.some((x) => have.has(x) || wanted.has(x))) need(e.any.filter((x) => byId.has(x)).sort((a, b) => depthTo(a, have, memo) - depthTo(b, have, memo))[0]);
        };
        need(c.pre);
        need(c.co);
      }
    }
    return wanted;
  }

  function downstream(wanted) {
    const memo = new Map();
    const kids = new Map();
    for (const w of wanted.values()) {
      const c = byId.get(w.id);
      for (const d of [...leaves(c.pre), ...leaves(c.co)]) {
        if (!wanted.has(d)) continue;
        if (!kids.has(d)) kids.set(d, []);
        kids.get(d).push(w.id);
      }
    }
    const depth = (id) => {
      if (memo.has(id)) return memo.get(id);
      memo.set(id, 0);
      const d = 1 + Math.max(0, ...(kids.get(id) || []).map(depth));
      memo.set(id, d);
      return d;
    };
    return { depth, kids };
  }

  const TERM_ORDER = ['Spring', 'Summer', 'Fall'];
  function termList(start, end) {
    const parse = (t) => { const [s, y] = t.split(' '); return { s, y: Number(y) }; };
    const key = (p) => p.y * 10 + TERM_ORDER.indexOf(p.s);
    const a = parse(start), b = parse(end);
    const out = [];
    for (let y = a.y; y <= b.y; y++) for (const s of ['Spring', 'Fall']) {
      const p = { s, y };
      if (key(p) >= key(a) && key(p) <= key(b)) out.push(s + ' ' + y);
    }
    return out;
  }

  function recommend(state) {
    const done = doneSet(state);
    const ip = ipSet(state);
    const have = new Set([...done, ...ip]);
    const wanted = wantedCourses(state, have);
    const { depth, kids } = downstream(wanted);
    const a = audit(state);
    let unitsHave = a.total.projected;

    const terms = termList(state.startTerm, state.gradTerm);
    if (!terms.length) terms.push(state.startTerm);
    const horizon = terms.length;
    const cap = Math.max(3, Number(state.termUnits) || 12);
    const remaining = new Set(wanted.keys());
    const plan = [];
    const haveNow = new Set(have);
    // Keep simulating past the target term until everything fits, to report an honest finish term.
    const queue = [...terms];
    const nextAfter = (t) => { const [s, y] = t.split(' '); return s === 'Spring' ? 'Fall ' + y : 'Spring ' + (Number(y) + 1); };
    let last = terms[terms.length - 1];
    let safety = 0;
    while (remaining.size && safety++ < 12) {
      const termName = queue.length ? queue.shift() : (last = nextAfter(last));
      const picked = [];
      let u = 0;
      const rank = (id) => GROUP_RANK[wanted.get(id).group] || 9;
      let progress = true;
      while (progress) {
        progress = false;
        const avail = [...remaining].filter((id) => !picked.includes(id) && eligible(id, haveNow, picked, unitsHave))
          .sort((x, y) => depth(y) - depth(x) || rank(x) - rank(y) || units(y) - units(x));
        for (const id of avail) {
          if (u + units(id) <= cap) { picked.push(id); u += units(id); progress = true; break; }
        }
      }
      plan.push({ term: termName, courses: picked.map((id) => ({ id, units: units(id), group: wanted.get(id).group, reason: reasonFor(id, wanted, kids, depth) })), units: u });
      picked.forEach((id) => { remaining.delete(id); haveNow.add(id); });
      unitsHave += u;
      if (!picked.length) break; // nothing eligible: stop, report as blocked
    }
    const lastIdx = plan.length - 1;
    const onPace = remaining.size === 0 && plan.length <= horizon;
    const finishTerm = remaining.size === 0 && lastIdx >= 0 ? plan[lastIdx].term : null;
    const blocked = [...remaining].map((id) => ({ id, why: blockers(id, haveNow, unitsHave) }));
    const criticalPath = Math.max(0, ...[...wanted.keys()].map(depth));
    return {
      wanted: [...wanted.values()], plan, onPace, finishTerm, blocked, horizon, targetTerm: state.gradTerm,
      criticalPath, remainingUnits: sumUnits([...wanted.keys()]), topPicks: plan.length ? plan[0].courses.slice(0, 5) : [],
      assumesIp: ip.size > 0
    };
  }

  function reasonFor(id, wanted, kids, depth) {
    const w = wanted.get(id);
    const unlocks = (kids.get(id) || []).filter((k) => wanted.has(k));
    let r = w.reason;
    if (unlocks.length) r += '. Unlocks ' + unlocks.slice(0, 3).join(', ') + (unlocks.length > 3 ? ' and more' : '');
    if (depth(id) >= 3) r += ' (long chain, start early)';
    return r;
  }

  // ---------- flowchart: status, locks, lanes ----------
  const statusOf = (id, state) => (doneSet(state).has(id) ? 'done' : ipSet(state).has(id) ? 'ip' : state.done[id] ? 'fail' : 'none');
  // Click order: not taken, in progress, completed, not taken. Returns the value setCourse expects.
  const cycleNext = (id, state) => {
    const s = statusOf(id, state);
    return s === 'none' || s === 'fail' ? 'ip' : s === 'ip' ? DONE_DEFAULT : '';
  };

  // What is still missing from an expression, as short text such as "CECS 228 + (CECS 274 or CECS 275)".
  function missingText(expr, have) {
    if (!expr || holds(expr, have)) return '';
    if (typeof expr === 'string') return expr;
    if (expr.all) return expr.all.filter((e) => !holds(e, have)).map((e) => (e.any ? '(' + missingText(e, have) + ')' : missingText(e, have))).join(' + ');
    return expr.any.map((e) => missingText(e, have) || e).join(' or ');
  }

  // Build the sets once per render, then ask lock() for each course.
  function flowCtx(state) {
    const done = doneSet(state);
    const withIp = new Set([...done, ...ipSet(state)]);
    return { state, done, withIp, unitsDone: sumUnits([...done]) + Math.max(0, Number(state.otherUnits) || 0) };
  }
  // A course opens when every prerequisite is completed. Corequisites may be completed or in progress.
  // The 60-unit rule is skipped until other units are entered, so an empty GE box does not lock ENGR 350.
  function lock(id, ctx, force) {
    const c = byId.get(id);
    if (force) return { open: true, missing: [], waiting: false };
    const missing = [];
    if (!holds(c.pre, ctx.done)) missing.push(missingText(c.pre, ctx.done));
    if (c.co && !holds(c.co, ctx.withIp)) missing.push(missingText(c.co, ctx.withIp));
    if (c.minUnits && ctx.state.otherUnits > 0 && ctx.unitsDone < c.minUnits) missing.push(c.minUnits + ' units');
    // "waiting" means only in-progress prerequisites stand in the way, so it is not set for coreq-only or unit-rule blocks.
    const waiting = missing.length > 0 && !!c.pre && !holds(c.pre, ctx.done) && holds(c.pre, ctx.withIp);
    return { open: missing.length === 0, missing, waiting };
  }

  // The six rows of the flowchart, each with its own credit bar. Lane credits only count what the degree needs.
  function lanes(state) {
    const done = doneSet(state);
    const haveAll = new Set([...done, ...ipSet(state)]);
    const t = R.tracks[state.track];
    const trackIds = t ? [t.required, ...t.options] : [];
    const mathIds = ['MATH 122', 'MATH 123'];
    const lowerIds = R.lower.filter((id) => !mathIds.includes(id));
    const pickIds = R.pickOne.flatMap((p) => p.options);
    const elecIds = R.sharedElectives.filter((id) => !trackIds.includes(id));
    const u = (set, ids) => sumUnits(ids.filter((id) => set.has(id)));
    const sci = (set) => Math.min(u(set, R.science.pool), R.science.minUnits);
    const picks = (set) => R.pickOne.reduce((s, p) => s + (p.options.some((o) => set.has(o)) ? 3 : 0), 0);
    const al = (set) => (t ? allocate(state.track, set) : { focusUnits: 0, electiveUnits: 0 });
    const ad = al(done), ap = al(haveAll);
    const row = (key, label, ids, need, have, proj) => ({ key, label, ids, need, have: Math.min(have, need), proj: Math.min(proj, need) });
    return [
      row('math', 'Math and science', [...mathIds, ...R.science.pool], 8 + R.science.minUnits, u(done, mathIds) + sci(done), u(haveAll, mathIds) + sci(haveAll)),
      row('lower', 'Foundations', lowerIds, sumUnits(lowerIds), u(done, lowerIds), u(haveAll, lowerIds)),
      row('upper', 'Upper core', R.upperCore, sumUnits(R.upperCore), u(done, R.upperCore), u(haveAll, R.upperCore)),
      row('picks', 'Pick one of each', pickIds, 6, picks(done), picks(haveAll)),
      row('track', t ? t.name : 'Your track', trackIds, R.focusUnits, ad.focusUnits, ap.focusUnits),
      row('elec', 'Electives', elecIds, R.electiveUnits, ad.electiveUnits, ap.electiveUnits)
    ];
  }


  // ---------- credits for any course, upper-division units, General Education ----------
  // Program courses use their catalog units. Other courses use a credit the user set, else the GE list default, else 3.
  function unitsOfAny(id, state) {
    if (byId.has(id)) return units(id);
    const set = state && state.units && Number(state.units[id]);
    if (set) return set;
    const g = GE.byId.get(id);
    return g ? g.units : 3;
  }
  const isKnownCourse = (id) => byId.has(id) || GE.byId.has(id);

  function udUnits(state) {
    const done = doneSet(state), ip = ipSet(state);
    const sum = (set) => [...set].filter((id) => GE.level(id) >= 300).reduce((s, id) => s + unitsOfAny(id, state), 0);
    const have = sum(done);
    return { have, proj: have + sum(ip), need: 40 };
  }

  // Give each course to at most one requirement, scarcest requirement first, so one course never fills two.
  function geAssign(pat, set, state) {
    const used = new Set();
    const res = new Map();
    const cand = (g) => g.courses.filter((c) => set.has(c.id));
    const order = pat.groups.filter((g) => !g.extra).map((g) => ({ g, n: cand(g).length })).sort((a, b) => a.n - b.n).map((x) => x.g);
    for (const g of order) {
      const cs = cand(g).filter((c) => !used.has(c.id));
      const picked = [];
      let u = 0;
      const add = (c) => { picked.push(c.id); u += unitsOfAny(c.id, state); };
      let ok = true;
      if (g.science) {
        const lab = (c) => /with lab/.test(c.tag || '');
        const best = (arr) => arr.slice().sort((a, b) => Number(lab(b)) - Number(lab(a)) || unitsOfAny(b.id, state) - unitsOfAny(a.id, state))[0];
        const pa = best(cs.filter((c) => /^Physical/.test(c.tag || '')));
        const pb = best(cs.filter((c) => /^Biological/.test(c.tag || '')));
        [pa, pb].filter(Boolean).forEach(add);
        let hasLab = [pa, pb].some((c) => c && lab(c));
        if (!hasLab) {
          const only = cs.find((c) => c.tag === 'Lab only');
          if (only) { add(only); hasLab = true; }
        }
        ok = !!pa && !!pb && hasLab;
      }
      for (const c of cs) {
        if (u >= g.need) break;
        if (!picked.includes(c.id)) add(c);
      }
      if (g.science) ok = ok && u >= g.need;
      picked.forEach((id) => used.add(id));
      res.set(g.key, { ids: picked, units: u, ok: ok && u >= g.need });
    }
    return res;
  }

  function geAudit(state) {
    const pat = GE.patterns[state.gePattern] || GE.patterns['2025'];
    const done = doneSet(state);
    const haveAll = new Set([...done, ...ipSet(state)]);
    const certified = !!state.geCertified;
    const a = geAssign(pat, done, state), b = geAssign(pat, haveAll, state);
    const rows = pat.groups.map((g) => {
      const x = a.get(g.key) || { ids: [], units: 0, ok: false }, y = b.get(g.key) || { ids: [], units: 0, ok: false };
      const counted = !g.extra;
      return {
        key: g.key, name: g.name, level: g.level, need: g.need, extra: !!g.extra, overlap: !!g.overlap,
        have: certified && counted ? g.need : Math.min(x.units, g.need), proj: certified && counted ? g.need : Math.min(y.units, g.need),
        taken: x.ids, taking: y.ids.filter((id) => !x.ids.includes(id)),
        met: certified ? counted : counted && x.ok, projMet: certified ? counted : counted && y.ok
      };
    });
    const sumOf = (lvl, f) => rows.filter((r) => r.level === lvl && !r.extra && !r.overlap).reduce((s, r) => s + r[f], 0);
    const live = rows.filter((r) => !r.extra);
    const status = live.every((r) => r.met) ? 'met' : live.every((r) => r.projMet) ? 'projected' : 'missing';
    const lowerNeed = sumOf('lower', 'need'), upperNeed = sumOf('upper', 'need');
    return {
      pattern: pat, rows, certified, status,
      lowerHave: sumOf('lower', 'have'), lowerProj: sumOf('lower', 'proj'), lowerNeed,
      upperHave: sumOf('upper', 'have'), upperProj: sumOf('upper', 'proj'), upperNeed,
      have: sumOf('lower', 'have') + sumOf('upper', 'have'), proj: sumOf('lower', 'proj') + sumOf('upper', 'proj'), need: lowerNeed + upperNeed,
      missingText: live.filter((r) => !r.projMet).map((r) => r.name).join(', ') || ''
    };
  }

  const api = {
    GE, geAudit, udUnits, unitsOfAny, isKnownCourse,
    DONE_DEFAULT, statusOf, cycleNext, missingText, flowCtx, lock, lanes,
    GRADES, isPassing, courses, byId, R, units, sumUnits, holds, leaves, exprText,
    emptyState, doneSet, ipSet, allocate, audit, trackProgress, eligible, blockers, recommend, termList, depthTo
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CSULB_LOGIC = api;
})(typeof window !== 'undefined' ? window : globalThis);
