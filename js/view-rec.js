(function () {
  const CT = window.CT;
  const { L, R, byId, S, $, esc, catalogLink, save, TERMS, UNIT_CHOICES } = CT;

  // ---------- recommender ----------
  function renderRec() {
    const r = L.recommend(S);
    const a = L.audit(S);
    const out = [];
    const done = r.wanted.length === 0;
    if (a.needsTrack && !S.track) {
      out.push('<div class="rec-verdict off"><strong>Pick a track first.</strong><span>The recommender needs a focus area to choose your electives.</span></div>');
    }
    if (done) {
      out.push('<div class="rec-verdict on"><strong>Nothing left to schedule.</strong><span>Every course you need is done or in progress.</span></div>');
    } else {
      const lateBy = r.finishTerm && !r.onPace ? r.finishTerm : '';
      out.push('<div class="rec-verdict ' + (r.onPace ? 'on' : 'off') + '"><strong>' +
        (r.onPace ? 'On pace for ' + esc(r.targetTerm) + '.' : (r.finishTerm ? 'Not on pace. Earliest finish is ' + esc(lateBy) + '.' : 'Not on pace. Some courses are blocked.')) +
        '</strong><span>' + r.remainingUnits + ' course units left. Prerequisite chains need at least ' + r.criticalPath + ' term' + (r.criticalPath === 1 ? '' : 's') + '.</span></div>');
      out.push('<div class="rec-sec"><h3>Top picks for ' + esc(r.plan[0] ? r.plan[0].term : S.startTerm) + '</h3>' +
        (r.topPicks.length ? '<ol class="picks">' + r.topPicks.map((c, i) => '<li class="pick"><span class="rank">' + (i + 1) + '</span><a class="code" href="' + catalogLink(c.id) + '" target="_blank" rel="noopener">' + esc(c.id) + '</a><span>' + esc(byId.get(c.id).title) + ' <small class="hint">' + c.units + ' units</small></span><span class="why">' + esc(c.reason) + '</span></li>').join('') + '</ol>'
          : '<p class="empty-note">Nothing is eligible yet. Your prerequisites block every remaining course.</p>') + '</div>');
      out.push('<div class="rec-sec"><h3>Term by term</h3><div class="terms">' + r.plan.map((t, i) => {
        const late = i >= r.horizon;
        return '<div class="term' + (late ? ' late' : '') + '"><div class="term-head"><h3>' + esc(t.term) + '</h3><span>' + t.units + ' units' + (late ? ', after target' : '') + '</span></div><ul>' +
          (t.courses.length ? t.courses.map((c) => '<li><a class="code" href="' + catalogLink(c.id) + '" target="_blank" rel="noopener">' + esc(c.id) + '</a><span>' + esc(byId.get(c.id).title) + '</span></li>').join('') : '<li><span></span><span>Nothing eligible this term.</span></li>') + '</ul></div>';
      }).join('') + '</div></div>');
      if (r.blocked.length) {
        out.push('<div class="needs"><h3>Blocked</h3><ul>' + r.blocked.map((b) => '<li><b>' + esc(b.id) + '.</b> ' + esc(b.why.join('. ') || 'Not reached within the planning window.') + '</li>').join('') + '</ul></div>');
      }
    }
    out.push('<p class="rec-note">' + (r.assumesIp ? 'Assumes your in-progress courses finish with C or better. ' : '') +
      'This does not know which courses are offered in which term, so check the <a href="https://www.csulb.edu/student-records/schedule-of-classes" target="_blank" rel="noopener">Schedule of Classes</a> before you register. ' +
      'Courses outside this program, such as MATH 224 or STAT 381, are not tracked.</p>');
    $('#recOut').innerHTML = out.join('');
  }

  $('#termUnits').innerHTML = UNIT_CHOICES.map((u) => '<option value="' + u + '">' + u + ' units</option>').join('');
  const termOpts = TERMS.map((x) => '<option>' + x + '</option>').join('');
  $('#startTerm').innerHTML = termOpts;
  $('#gradTerm').innerHTML = termOpts;
  const syncRec = () => { $('#termUnits').value = S.termUnits; $('#startTerm').value = S.startTerm; $('#gradTerm').value = S.gradTerm; };
  syncRec();
  $('#termUnits').addEventListener('change', (e) => { S.termUnits = Number(e.target.value); save(); renderRec(); });
  $('#startTerm').addEventListener('change', (e) => { S.startTerm = e.target.value; save(); renderRec(); });
  $('#gradTerm').addEventListener('change', (e) => { S.gradTerm = e.target.value; save(); renderRec(); });
  document.addEventListener('ct:reset', syncRec);
  CT.register('rec', renderRec);
})();
