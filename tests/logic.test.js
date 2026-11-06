const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/logic.js');
const { courses, byId, R } = L;

const allRequiredIds = () => [
  ...R.lower, ...R.upperCore, 'ENGR 361', 'E E 381', 'PHYS 151', 'BIOL 200', 'BIOL 205'
];
const finishedState = (track = 'software') => {
  const s = L.emptyState();
  s.track = track;
  const ids = new Set(allRequiredIds());
  const t = R.tracks[track];
  [t.required, ...t.options.slice(0, 3)].forEach((id) => ids.add(id));
  ['CECS 419', 'CECS 428'].forEach((id) => ids.add(id)); // 6 shared elective units
  ids.forEach((id) => { s.done[id] = 'B'; });
  const major = L.sumUnits([...ids]);
  s.otherUnits = R.totalUnits - major;
  return s;
};

test('data: course list has the 61 catalog courses and unique ids', () => {
  assert.equal(courses.length, 61);
  assert.equal(new Set(courses.map((c) => c.id)).size, 61);
});

test('data: every course named in a requirement exists', () => {
  const ids = [
    ...R.lower, ...R.upperCore, ...R.science.pool, ...R.preMajor, ...R.sharedElectives,
    ...R.pickOne.flatMap((p) => p.options),
    ...Object.values(R.tracks).flatMap((t) => [t.required, ...t.options])
  ];
  for (const id of ids) assert.ok(byId.has(id), 'missing course ' + id);
});

test('data: prerequisite references resolve and the graph has no cycles', () => {
  for (const c of courses) for (const l of [...L.leaves(c.pre), ...L.leaves(c.co)]) assert.ok(byId.has(l), c.id + ' references unknown ' + l);
  const state = new Map();
  const visit = (id) => {
    if (state.get(id) === 2) return;
    assert.notEqual(state.get(id), 1, 'cycle through ' + id);
    state.set(id, 1);
    L.leaves(byId.get(id).pre).forEach(visit);
    state.set(id, 2);
  };
  courses.forEach((c) => visit(c.id));
});

test('audit: empty state is missing and asks for a track', () => {
  const a = L.audit(L.emptyState());
  assert.equal(a.overall, 'missing');
  assert.equal(a.needsTrack, true);
});

test('audit: a fully finished degree is met', () => {
  const a = L.audit(finishedState('software'));
  assert.equal(a.overall, 'met', JSON.stringify(a.groups.filter((g) => g.status !== 'met').map((g) => [g.key, g.status, g.need])));
  for (const t of Object.keys(R.tracks)) assert.equal(L.audit(finishedState(t)).overall, 'met', t);
});

test('audit: a grade below C fails the course and is reported', () => {
  const s = finishedState();
  s.done['CECS 328'] = 'C-';
  const a = L.audit(s);
  assert.deepEqual(a.gradeIssues, ['CECS 328']);
  assert.notEqual(a.overall, 'met');
  assert.equal(a.groups.find((g) => g.key === 'upper').items.find((i) => i.id === 'CECS 328').status, 'fail');
});

test('audit: in-progress courses give a projected result, not met', () => {
  const s = finishedState();
  delete s.done['CECS 491B'];
  s.ip = ['CECS 491B'];
  const a = L.audit(s);
  assert.equal(a.overall, 'projected');
});

test('audit: missing total units is reported', () => {
  const s = finishedState();
  s.otherUnits -= 9;
  const a = L.audit(s);
  const u = a.groups.find((g) => g.key === 'units');
  assert.equal(u.status, 'missing');
  assert.match(u.need, /9 more units/);
});

test('audit: science with only PHYS 151 (4 units) is missing', () => {
  const s = finishedState();
  delete s.done['BIOL 200'];
  delete s.done['BIOL 205'];
  assert.equal(L.audit(s).groups.find((g) => g.key === 'science').status, 'missing');
});

test('audit: science without a PHYS 151 or CHEM 111A start is missing even with 8 BIOL units', () => {
  const s = finishedState();
  delete s.done['PHYS 151'];
  const g = L.audit(s).groups.find((x) => x.key === 'science');
  assert.equal(g.status, 'missing');
  assert.match(g.need, /PHYS 151 or CHEM 111A/);
});

test('audit: science is met with PHYS 151 plus one BIOL (8 units)', () => {
  const s = finishedState();
  delete s.done['BIOL 205'];
  s.otherUnits += 4;
  assert.equal(L.audit(s).groups.find((g) => g.key === 'science').status, 'met');
});

test('allocate: a course never counts toward both focus and electives', () => {
  const have = new Set(['CECS 478', 'CECS 303', 'CECS 456', 'CECS 474', 'CECS 457', 'CECS 323']);
  const a = L.allocate('cyber', have);
  assert.equal(a.focusUnits, 12);
  assert.equal(a.focus.length, 4);
  const overlap = a.focus.filter((id) => a.elective.includes(id));
  assert.deepEqual(overlap, []);
  assert.equal(a.focus.length + a.elective.length, 6); // 6 courses total
});

test('allocate: I S 360 is kept in focus because it cannot be an elective', () => {
  const have = new Set(['CECS 478', 'I S 360', 'CECS 303', 'CECS 456', 'CECS 474']);
  const a = L.allocate('cyber', have);
  assert.ok(a.focus.includes('I S 360'));
});

test('eligibility: CECS 326 needs CECS 325 and CECS 341', () => {
  assert.equal(L.eligible('CECS 326', new Set(['CECS 325']), [], 100), false);
  assert.equal(L.eligible('CECS 326', new Set(['CECS 325', 'CECS 341']), [], 100), true);
});

test('eligibility: corequisites can be taken in the same term', () => {
  const have = new Set(['CECS 343']);
  assert.equal(L.eligible('CECS 491A', have, [], 100), false);
  assert.equal(L.eligible('CECS 491A', have, ['CECS 328', 'ENGR 350'], 100), true);
});

test('eligibility: 60-unit rule applies to ENGR 350', () => {
  assert.equal(L.eligible('ENGR 350', new Set(), [], 59), false);
  assert.equal(L.eligible('ENGR 350', new Set(), [], 60), true);
});

test('recommend: never schedules a course before its prerequisites and respects the unit cap', () => {
  const s = L.emptyState();
  s.track = 'ml';
  for (const id of ['CECS 105', 'CECS 174', 'MATH 122', 'ENGR 101']) s.done[id] = 'B';
  s.otherUnits = 30;
  s.termUnits = 12;
  s.startTerm = 'Spring 2027';
  s.gradTerm = 'Fall 2029';
  const r = L.recommend(s);
  const have = new Set(Object.keys(s.done));
  let units = L.audit(s).total.projected;
  for (const t of r.plan) {
    assert.ok(t.units <= 12, t.term + ' over cap');
    for (const c of t.courses) assert.ok(L.eligible(c.id, have, t.courses.map((x) => x.id).filter((x) => x !== c.id), units), c.id + ' scheduled too early in ' + t.term);
    t.courses.forEach((c) => have.add(c.id));
    units += t.units;
  }
  assert.equal(r.blocked.length, 0);
});

test('recommend: ML track schedules a stats course because CECS 456 needs one', () => {
  const s = L.emptyState();
  s.track = 'ml';
  const r = L.recommend(s);
  assert.ok(r.wanted.some((w) => w.id === 'E E 381' || w.id === 'CECS 381'));
  assert.ok(r.wanted.some((w) => w.id === 'CECS 456'));
});

test('recommend: nothing left means an empty plan and on pace', () => {
  const r = L.recommend(finishedState());
  assert.equal(r.wanted.length, 0);
  assert.equal(r.onPace, true);
});

test('recommend: a last-semester student with only senior project left is on pace in one term', () => {
  const s = finishedState();
  delete s.done['CECS 491B'];
  s.otherUnits += 0;
  s.startTerm = 'Spring 2027';
  s.gradTerm = 'Spring 2027';
  const r = L.recommend(s);
  assert.equal(r.plan.length, 1);
  assert.equal(r.plan[0].courses[0].id, 'CECS 491B');
  assert.equal(r.onPace, true);
});

test('recommend: too many chained courses for the target is flagged as not on pace', () => {
  const s = L.emptyState();
  s.track = 'software';
  s.startTerm = 'Spring 2027';
  s.gradTerm = 'Spring 2027';
  const r = L.recommend(s);
  assert.equal(r.onPace, false);
});

// ---------- flowchart: status, locks, lanes ----------
const stateWith = (done = [], ip = [], extra = {}) => {
  const s = L.emptyState();
  done.forEach((id) => { s.done[id] = 'P'; });
  s.ip = [...ip];
  return Object.assign(s, extra);
};

test('grades: P counts as passed (C or better) in the audit', () => {
  assert.equal(L.isPassing('P'), true);
  assert.equal(L.isPassing('C-'), false);
  assert.equal(L.doneSet(stateWith(['CECS 105'])).has('CECS 105'), true);
});

test('cycle: not taken, in progress, completed, then back to not taken', () => {
  const s = stateWith();
  assert.equal(L.cycleNext('CECS 105', s), 'ip');
  const ip = stateWith([], ['CECS 105']);
  assert.equal(L.cycleNext('CECS 105', ip), 'P');
  const done = stateWith(['CECS 105']);
  assert.equal(L.cycleNext('CECS 105', done), '');
});

test('cycle: a course with a grade below C goes to in progress next', () => {
  const s = stateWith();
  s.done['CECS 328'] = 'C-';
  assert.equal(L.statusOf('CECS 328', s), 'fail');
  assert.equal(L.cycleNext('CECS 328', s), 'ip');
});

test('lock: a course stays locked until its prerequisites are completed', () => {
  const s = stateWith();
  assert.equal(L.lock('CECS 274', L.flowCtx(s)).open, false);
  assert.match(L.lock('CECS 274', L.flowCtx(s)).missing[0], /CECS 174/);
  assert.equal(L.lock('CECS 274', L.flowCtx(stateWith(['CECS 174']))).open, true);
});

test('lock: an in-progress prerequisite does not open the next course, but is flagged as waiting', () => {
  const s = stateWith([], ['CECS 174']);
  const r = L.lock('CECS 274', L.flowCtx(s));
  assert.equal(r.open, false);
  assert.equal(r.waiting, true);
});

test('lock: a corequisite can be in progress', () => {
  assert.equal(L.lock('CECS 174', L.flowCtx(stateWith())).open, false);
  assert.equal(L.lock('CECS 174', L.flowCtx(stateWith([], ['MATH 122']))).open, true);
});

test('lock: "unlock all" opens everything for transfer credit', () => {
  assert.equal(L.lock('CECS 491B', L.flowCtx(stateWith()), true).open, true);
});

test('lock: the 60-unit rule is ignored until other units are entered', () => {
  assert.equal(L.lock('ENGR 350', L.flowCtx(stateWith())).open, true);
  assert.equal(L.lock('ENGR 350', L.flowCtx(stateWith([], [], { otherUnits: 30 }))).open, false);
  assert.equal(L.lock('ENGR 350', L.flowCtx(stateWith([], [], { otherUnits: 60 }))).open, true);
});

test('missingText: shows only what is still missing, with alternatives', () => {
  assert.equal(L.missingText(byId.get('CECS 328').pre, new Set(['CECS 228'])), 'CECS 274');
  assert.equal(L.missingText(byId.get('CECS 228').pre, new Set()), 'CECS 174 + MATH 122');
});

test('lanes: the six lanes need 97 major units in total', () => {
  const lanes = L.lanes(stateWith([], [], { track: 'software' }));
  assert.equal(lanes.length, 6);
  assert.equal(lanes.reduce((s, l) => s + l.need, 0), 97);
  assert.equal(lanes.reduce((s, l) => s + l.have, 0), 0);
});

test('lanes: a finished degree fills every lane', () => {
  for (const track of Object.keys(R.tracks)) {
    for (const l of L.lanes(finishedState(track))) assert.equal(l.have, l.need, track + ' ' + l.key);
  }
});

test('lanes: in-progress courses raise projected but not done credits', () => {
  const s = stateWith([], ['CECS 105', 'CECS 174'], { track: 'software' });
  const lower = L.lanes(s).find((l) => l.key === 'lower');
  assert.equal(lower.have, 0);
  assert.equal(lower.proj, 4);
});

test('lanes: without a track the track and elective lanes stay empty', () => {
  const lanes = L.lanes(stateWith());
  assert.deepEqual(lanes.find((l) => l.key === 'track').ids, []);
  assert.equal(lanes.find((l) => l.key === 'track').have, 0);
});

test('lock: a course blocked only by a corequisite is locked, not waiting', () => {
  const r = L.lock('PHYS 151', L.flowCtx(stateWith()));
  assert.equal(r.open, false);
  assert.equal(r.waiting, false);
});

test('lock: a course blocked only by the 60-unit rule is locked, not waiting', () => {
  const r = L.lock('ENGR 350', L.flowCtx(stateWith([], [], { otherUnits: 10 })));
  assert.equal(r.open, false);
  assert.equal(r.waiting, false);
});

// ---------- 2026-27 catalog changes ----------
test('2026-27: CECS 229 needs only CECS 228, and CECS 342 needs CECS 325', () => {
  assert.equal(L.holds(byId.get('CECS 229').pre, new Set(['CECS 228'])), true);
  assert.equal(L.holds(byId.get('CECS 342').pre, new Set(['CECS 325'])), true);
  assert.equal(L.holds(byId.get('CECS 342').pre, new Set(['CECS 328'])), false);
});

test('2026-27: CECS 456 and CECS 458 accept CECS 381 or E E 381', () => {
  for (const id of ['CECS 456', 'CECS 458']) {
    assert.equal(L.holds(byId.get(id).pre, new Set(['CECS 381'])), true, id);
    assert.equal(L.holds(byId.get(id).pre, new Set(['E E 381'])), true, id);
    assert.equal(L.holds(byId.get(id).pre, new Set()), false, id);
  }
});

test('2026-27: CECS 479 and CECS 458 are in their focus areas and the shared electives', () => {
  assert.ok(R.tracks.cyber.options.includes('CECS 479'));
  assert.ok(R.tracks.ml.options.includes('CECS 458'));
  assert.ok(R.sharedElectives.includes('CECS 479') && R.sharedElectives.includes('CECS 458'));
});

test('2026-27: CECS 491A needs CECS 343 first, with CECS 328 and ENGR 350 alongside', () => {
  const c = byId.get('CECS 491A');
  assert.equal(L.exprText(c.pre), 'CECS 343');
  assert.equal(L.exprText(c.co), 'CECS 328 and ENGR 350');
});
