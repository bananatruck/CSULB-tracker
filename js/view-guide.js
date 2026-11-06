(function () {
  const CT = window.CT;
  const { P, $, esc } = CT;

  // ---------- guide ----------
  function renderGuide() {
    const adv = P.professors.filter((p) => (p.roles || []).some((r) => /CS undergraduate advisor/.test(r)));
    $('#guideBody').innerHTML =
      '<div class="gcard wide"><h3>The path, in order</h3><ol>' +
      '<li>Clear the pre-major gate: MATH 122, MATH 123 and PHYS 151 with C or better, a 2.5 GPA, and the written and oral communication GE courses, all before 60 units.</li>' +
      '<li>Finish the lower division core: CECS 105, 174, 225, 228, 229, 274, 277, ENGR 101, ENGR 102, MATH 122 and MATH 123.</li>' +
      '<li>Take the upper division core. The longest chain is CECS 228 and 274, then 328, then 329 and 342. Another is CECS 225, 341, 326, 327.</li>' +
      '<li>Take the pick-one courses: ENGR 361 or 390, and CECS 381 or E E 381.</li>' +
      '<li>Choose a track: 12 units from one focus area, then 6 more units from the shared elective list.</li>' +
      '<li>Finish with CECS 491A and 491B. 491A needs CECS 343 and ENGR 350 first, with CECS 323 and 328 before or alongside. 491B needs 491A and instructor consent.</li>' +
      '<li>Check the total: 120 units including GE, with a C or better in every major course. Confirm the full list on your ARR.</li></ol></div>' +
      '<div class="gcard"><h3>Rules that catch people</h3><ul>' +
      '<li>Every major course needs C or better. A C- does not count and the course has to be retaken.</li>' +
      '<li>A course counts once. A focus-area course cannot also be an elective.</li>' +
      '<li>ENGR 350 and CECS 427 need 60 completed units.</li>' +
      '<li>ENGR 361 and 390 need the GWAR placement score or the portfolio course.</li>' +
      '<li>Engineering degree progress: a third attempt at a course needs a petition, and registration holds can follow unsatisfactory progress.</li>' +
      '<li>CECS 456 needs E E 381. CECS 381 is not listed there, so ask an advisor before relying on it.</li></ul></div>' +
      '<div class="gcard"><h3>Who to ask</h3><ul>' +
      adv.map((p) => '<li><b>' + esc(p.name) + '</b>: ' + esc(p.roles.find((r) => /CS undergraduate advisor/.test(r))) + '. <a href="' + esc(p.url) + '" target="_blank" rel="noopener">Profile</a></li>').join('') +
      '<li>Department office: ECS-552, 562.985.4285.</li>' +
      '<li>Your ARR is the official record. If this page and your ARR disagree, follow your ARR.</li></ul></div>';
  }


  CT.register('guide', renderGuide);
})();
