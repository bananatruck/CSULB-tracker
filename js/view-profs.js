(function () {
  const CT = window.CT;
  const { P, $, esc } = CT;

  // ---------- professors ----------
  const isAdvisor = (p) => (p.roles || []).some((r) => /advisor|chair/i.test(r));
  function ratingHtml(p) {
    if (!p.rating) return '<div class="rating"><span class="none">No rating snapshot yet</span></div>';
    const r = p.rating;
    return '<div class="rating"><b>' + esc(Number(r.score).toFixed(1)) + '</b><span>/ 5 from ' + esc(r.count) + ' rating' + (r.count === 1 ? '' : 's') + '</span><small>snapshot ' + esc(r.date) + '</small>' +
      (r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">RateMyProfessors</a>' : '') + '</div>';
  }
  function renderProfs() {
    const q = $('#profSearch').value.trim().toLowerCase();
    const kind = $('#profKind').value;
    const sort = $('#profSort').value;
    let list = P.professors.filter((p) => {
      if (kind === 'Faculty' || kind === 'Lecturer') { if (p.kind !== kind) return false; }
      if (kind === 'advisor' && !isAdvisor(p)) return false;
      if (kind === 'rated' && !p.rating) return false;
      if (!q) return true;
      return [p.name, p.title, p.interests || '', (p.roles || []).join(' '), (p.courses || []).join(' ')].join(' ').toLowerCase().includes(q);
    });
    list.sort((a, b) => sort === 'rating'
      ? (b.rating ? b.rating.score : -1) - (a.rating ? a.rating.score : -1) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name));
    $('#profCount').textContent = list.length + ' of ' + P.professors.length + ' CECS instructors. Source: csulb.edu department pages.';
    $('#profGrid').innerHTML = list.length ? list.map((p) => {
      const dl = [];
      if (p.office) dl.push(['Office', p.office]);
      if (p.hours) dl.push(['Hours', p.hours]);
      if (p.email) dl.push(['Email', p.email]);
      if (p.courses) dl.push(['Courses', p.courses.join(', ') + ' (office hours page)']);
      return '<article class="pcard"><div><h3>' + esc(p.name) + '</h3><p class="ptitle">' + esc(p.title) + '</p></div>' +
        ((p.roles || []).length ? '<ul class="chips-row">' + p.roles.map((r) => '<li class="chip">' + esc(r) + '</li>').join('') + '</ul>' : '') +
        (p.interests ? '<p class="pint">' + esc(p.interests) + '</p>' : '') +
        (dl.length ? '<dl class="pmeta">' + dl.map((r) => '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl>' : '') +
        '<p class="hint"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">CSULB profile</a></p>' + ratingHtml(p) + '</article>';
    }).join('') : '<p class="empty-note">No one matches. Clear the search or choose Everyone.</p>';
  }

  ['#profSearch', '#profKind', '#profSort'].forEach((s) => $(s).addEventListener('input', renderProfs));
  CT.register('profs', renderProfs);
})();
