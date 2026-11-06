# CSULB-tracker - project plan

This file is the single source of truth for scope, decisions and status.
It is updated whenever scope, data or status changes.
Categories are sorted: Goal, Decisions, Scope now, Data, Features, Design, Deploy, Verification, Future updates, Open questions, Status log.

## 1. Goal

A fast, simple, interactive site that helps one student finish the CSULB B.S. Computer Science degree.
The main job is an audit: "have I met every requirement, and what is still missing?"
Everything else (flowchart, electives, GE, semesters, professors) supports that job.
It is an unofficial helper.
The catalog and the student's ARR (Academic Requirements Report) always win.

## 2. Decisions

| Decision | Choice | Why / rejected alternative |
| --- | --- | --- |
| Catalog year | 2026-2027 (current) | Chosen by the user. Prerequisites are enforced from the current catalog at registration, and several changed since 2023-24 (see Data). Rejected a year toggle for now (twice the data to verify). |
| Stack | Plain HTML, CSS, vanilla JS, no build step | Rejected React/Vite: no benefit for about 60 courses, and Pages serves static files directly. |
| Storage | Browser `localStorage`, plus JSON export and import | No backend, no accounts. Export/import covers moving between devices. |
| Hosting | GitHub Pages from the public repo `bananatruck/CSULB-tracker` | Requested by the user. |
| Main screen | Full-screen interactive flowchart | Requested. The page is an app, not a long document. |
| Scope | Major, CS electives, GE and the university graduation checklist | GE was out of scope at first. The user asked for it with every approved course. |
| GE patterns | Fall 2025 and later (default) and Fall 2021 to Summer 2025, selectable | CSULB lets a student follow the pattern from when continuous enrollment began or the one in effect at graduation. The older Fall 2019 and Fall 2012 patterns are not built. |
| GE counting | Each course fills at most one GE requirement, scarcest requirement first | A course may double-count between GE and the major, but not between two GE requirements. Rejected counting a course twice (would overstate progress). |
| Credits | Every course counts once toward 120, at its own credits | GE-only courses use the list default (3, lab-only 1, science with lab 4) unless the student changes the credit. |
| Professors | CECS faculty only for now | Requested. Other departments are a future update. |
| Ratings | Hand-collected snapshot with date and source link | Requested. Terms-of-use risk and staleness are noted in Open questions. |
| Prerequisites | From each course's catalog page, 2026-27 | Not from the flowchart PDF. |

## 3. Scope now

- B.S. Computer Science, 2026-2027 catalog, 120 units.
- Track (focus area): Software Development, Cybersecurity, Machine Learning and AI.
- CS electives, the 6-unit shared list, and free electives.
- General Education, both patterns, with every approved course.
- University graduation checklist: units, upper-division units, residency, GPA, GWAR.
- CECS faculty and lecturers.
- Out of scope now: non-CECS professors, other majors, live class schedule, the Fall 2019 and Fall 2012 GE patterns.

## 4. Data

| Data | Source | Status |
| --- | --- | --- |
| Degree rules | [2026-27 Computer Science B.S.](https://csulb.catalog.acalog.com/preview_program.php?catoid=12&poid=6287) | Done |
| Course titles, units, prerequisites | 2026-27 catalog course pages (61 courses) | Done |
| University graduation requirements | [Baccalaureate Degree Information](https://csulb.catalog.acalog.com/content.php?catoid=12&navoid=1401) | Done |
| GE requirements, Fall 2025 and later | [CSULB page](https://www.csulb.edu/student-records/fall-2025-ge-requirements) and the catalog chart (34 lower + 9 upper units) | Done |
| GE requirements, Fall 2021 | [CSULB page](https://www.csulb.edu/student-records/fall-2021-general-education-requirements) (40 lower + 9 upper units) | Done |
| GE approved courses | CSULB Area 1 to 6 pages and the category E list, about 760 courses | Done, read 2026-11-05 |
| Faculty names, titles, offices, emails, hours | CSULB CECS faculty and staff pages, office hours page | Done |
| Instructor to course mapping | Only a few appear on the office hours page | Partial, see Future updates |
| Ratings | RateMyProfessors, hand collected | Looked up, not yet in the site |

What changed between 2023-24 and 2026-27 (found by diffing every course page):

- New courses: CECS 458 (Deep Learning) in the ML and AI list, CECS 479 (Hardware Security) in the Cybersecurity list. Both are also in the shared 6-unit list.
- Renamed: CECS 105 is now Introduction to Computing Disciplines, CECS 478 is now Introduction to Data Security and Privacy.
- Prerequisites: CECS 229 needs only CECS 228. CECS 342 needs CECS 325 instead of 328. CECS 491A needs CECS 343 first and CECS 328 plus ENGR 350 alongside. CECS 456 and 458 accept CECS 381 or E E 381. CECS 429 no longer needs CECS 323. CECS 449 needs CECS 325 instead of 328.
- The required course lists did not change.

Prerequisites that name courses outside the program list (for example MATH 111, MATH 224, STAT 381, CECS 180) are shown as text and not enforced.
Legacy course numbers (CECS 275, 282, 346, 278, 440) are mentioned as notes only.

Double-counts found in the lists (a required major course that also fills a GE requirement):

- Fall 2025 and later: MATH 122 fills Area 2, PHYS 151 plus BIOL 200 fill Area 5 (7 units), ENGR 350 fills upper-division Area 3, CECS 491A fills upper-division Area 2 or 5. That is 16 of the 43 GE units.
- Fall 2021: the same, plus CECS 105, ENGR 101 and ENGR 102 together fill category E (three 1-unit courses for 3 units).
- Result: major (97) plus GE not covered by the major (27) is already 124, so a CS degree leaves about no free-elective credits.

## 5. Features

1. Flowchart (main screen): swimlanes with credit bars, click a course to cycle its status, locks until prerequisites are completed, selecting a course highlights what it needs and unlocks, pan and zoom.
2. Header: track chips (Software, Cyber, ML / AI) with live focus-unit counts, and a credits meter out of 120 that shows "All requirements met" when everything passes.
3. Electives tab: focus-area courses, the shared CS electives, and the credit plan (major + GE not covered + free electives = 120). Status is shared with the flowchart.
4. GE tab: pick a pattern, open any requirement for every approved course, mark what you took, change a course's credits. Taken courses and major courses sort first. Search across all GE courses. Graduation checklist with sources.
5. Semesters board: remaining courses grouped by term from the recommender, with an on-pace check.
6. Professor catalogue: search, filter, source link per entry, ratings snapshot.
7. Guide: short written path and common traps.
8. Menu: unlock every course (transfer credit), export, import, reset.

## 6. Design

- One accent color, quiet neutral surfaces, light and dark themes.
- Status is never color-only: icon and label as well.
- Works at phone width with no horizontal scroll.
- Little text. Titles and details appear on hover or in the course card.

## 7. Deploy

- Repo: `bananatruck/CSULB-tracker`, public.
- GitHub Pages from the `main` branch root.
- Live URL: https://bananatruck.github.io/CSULB-tracker/

## 8. Verification

- Node logic tests: audit, locks, lanes, GE allocation, credit plan, 2026-27 prerequisites, graduation checks.
- GitHub Actions runs the tests on every push.
- Browser check at desktop and phone width, console clean.
- Live URL check: loads without console errors, track and progress survive a refresh, totals update.

## 9. Future updates

Sorted by area.

### Courses
- Add other majors and the Computer Engineering degree.
- Add a catalog-year toggle (2023-24 vs 2026-27) now that the diff is known.
- Build the Fall 2019 and Fall 2012 GE patterns.
- Read real credits for every GE course from the catalog instead of the list defaults.
- Pull the live class schedule so the recommender knows which courses are offered this term.

### Professors
- Add non-CECS instructors for required courses (MATH, PHYS, ENGR, CHEM, BIOL).
- Add instructor-to-course mapping from the schedule of classes.
- Refresh ratings each semester and record the snapshot date.

### Professors, opinions
- Recent opinion: for each professor, a short summary of RateMyProfessors reviews from the past year, plus a note on how the pattern changed compared with older reviews.
  Summaries are written in our own words, dated, and never copy review text.
- Ratings snapshot for the remaining CECS instructors, plus a refresh each semester.

### Product
- Community comments: let students add their own comments about a professor on this site, shown beside the official info and ratings.
  Needs a small backend or a hosted comment service, moderation, and a clear "student opinion, not CSULB" label.
- Drag-and-drop semester planner.
- Shareable progress link.

## 10. Open questions

- Ratings: copying RateMyProfessors data likely conflicts with their terms and goes stale. Kept to score, count, date and link only.
- Science rule in the major says "two-semester sequence" but lists only PHYS 151 or CHEM 111A plus BIOL courses. Implemented as written. Confirm against the ARR.
- GE Area 4: CSULB lists a 4C course table, but the catalog chart counts only two lower-division Area 4 courses (4A and 4B). 4C is shown as "extra" and does not add to the 34 units. Confirm against the ARR.
- GE lists for the Fall 2021 pattern reuse the current Area lists through CSULB's "formerly known as" mapping. Approvals can differ at the edges.
- Ethnic studies under the Fall 2021 pattern can double-count with D3 or upper-division D on the ARR. This tool counts a course once.
- The GE pages give no credits per course. Defaults are 3 (lab-only 1, science with lab 4). The student can change a taken course's credit.
- Upper-division units do not exclude community college courses, which the catalog does not allow toward the 40. Residency, GPA and GWAR are manual confirmations.

## 11. Status log

- 2026-11-05: plan agreed. Catalog, prerequisites and CECS faculty data collected. Building the site.
- 2026-11-05: site built, 20 commits, live at https://bananatruck.github.io/CSULB-tracker/. Tests pass locally and in CI.
- 2026-11-05: ratings looked up on RateMyProfessors for about 45 CECS instructors (school id 18846). Not yet written into the site.
  No match found for: Binh Le, Sahar Nikbakht, Sina Askari (0 ratings), Benyamin Haghi, Wei Wei, Daniel Commey (0 ratings), Dan Cregg (only a different-department match).
- 2026-11-05: UI redesigned to a full-screen, flowchart-first app.
- 2026-11-06: moved the course data to the 2026-27 catalog (61 courses, new prerequisites, CECS 458 and 479).
- 2026-11-06: added the Electives tab, the GE tab (two patterns, about 760 courses) and the graduation checklist.
- Next: write the ratings file, then recent-opinion summaries, then comments.
