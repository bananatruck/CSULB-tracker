# CSULB-tracker - project plan

This file is the single source of truth for scope, decisions and status.
It is updated whenever scope, data or status changes.
Categories are sorted: Goal, Decisions, Scope now, Data, Features, Design, Deploy, Verification, Future updates, Open questions, Status log.

## 1. Goal

A fast, simple, interactive site that helps one student finish the CSULB B.S. Computer Science degree.
The main job is an audit: "have I met every requirement, and what is still missing?"
Everything else (flowchart, recommender, professors, planner) supports that job.
It is an unofficial helper.
The catalog and the student's ARR (Academic Requirements Report) always win.

## 2. Decisions

| Decision | Choice | Why / rejected alternative |
| --- | --- | --- |
| Catalog year | 2023-2024 (archived) | Matches the link the user sent. Rejected a year toggle for now (more data to verify). |
| Stack | Plain HTML, CSS, vanilla JS, no build step | Rejected React/Vite: no benefit for about 60 courses, and Pages serves static files directly. |
| Storage | Browser `localStorage`, plus JSON export and import | No backend, no accounts. Export/import covers moving between devices. |
| Hosting | GitHub Pages from the public repo `bananatruck/CSULB-tracker` | Requested by the user. |
| Main focus | Degree completion audit | Student is in the last semester. Planner is a side feature. |
| Scope | Major only, GE is one "other units" number | GE needs separate catalog research. See Future updates. |
| Professors | CECS faculty only for now | Requested. Other departments are a future update. |
| Ratings | Hand-collected snapshot with date and source link | Requested. Terms-of-use risk and staleness are noted in Open questions. |
| Prerequisites | From each course's catalog page | Not from the flowchart PDF. |

## 3. Scope now

- B.S. Computer Science, 2023-2024 catalog, 120 units.
- Track (focus area): Software Development, Cybersecurity, Machine Learning and AI.
- CECS faculty and lecturers.
- Out of scope now: GE checklist, non-CECS professors, other majors, live class schedule.

## 4. Data

| Data | Source | Status |
| --- | --- | --- |
| Degree rules | 2023-24 catalog program page (poid 3752) | Done |
| Course titles, units, prerequisites | 2023-24 catalog course pages (59 courses) | Done |
| Faculty names, titles, offices, emails, hours | CSULB CECS faculty and staff pages, office hours page | Done |
| Instructor to course mapping | Only a few appear on the office hours page | Partial, see Future updates |
| Ratings | RateMyProfessors, hand collected | In progress |

Prerequisites that name courses outside the program list (for example MATH 111, MATH 224, STAT 381) are shown as text and not enforced.
Legacy course numbers (CECS 275, 282, 346, 278, 440) are mentioned as notes only.

## 5. Features

1. Flowchart (main screen): swimlanes with credit bars, click a course to cycle its status, locks until prerequisites are completed, selecting a course highlights what it needs and unlocks, pan and zoom.
2. Header: track chips (Software, Cyber, ML / AI) with live focus-unit counts, and a credits meter out of 120 that shows "All requirements met" when the audit passes.
3. Semesters board: remaining courses grouped by term from the recommender, with an on-pace check. Click a course to jump to it in the flowchart.
4. Professor catalogue: search, filter, source link per entry, ratings snapshot.
5. Guide: short written path and common traps.
6. Menu: other credits (GE), unlock every course (transfer credit), export, import, reset.

## 6. Design

- One accent color, quiet neutral surfaces, light and dark themes.
- Status is never color-only: icon and label as well.
- Works at phone width with no horizontal scroll.

## 7. Deploy

- Repo: `bananatruck/CSULB-tracker`, public.
- GitHub Pages from the `main` branch root.
- Live URL: https://bananatruck.github.io/CSULB-tracker/

## 8. Verification

- Node logic tests for the audit and recommender (fixed scenarios).
- Browser check at desktop and phone width.
- Live URL check: loads without console errors, track survives a refresh, totals update, recommender reacts to completed prerequisites.

## 9. Future updates

Sorted by area.

### Courses
- Add other majors and the Computer Engineering degree.
- Add a catalog-year toggle (2023-24 vs 2026-27) with a diff of what changed (2026-27 adds courses such as CECS 458 and 479).
- Add a GE checklist.
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
- CECS 456 lists "E E 381 or STAT 381" as prerequisite. The catalog does not list CECS 381 there. Confirm with an advisor.
- The science rule says "two-semester sequence" but lists only PHYS 151 or CHEM 111A plus BIOL courses. Implemented as written. Confirm against the ARR.

## 11. Status log

- 2026-11-05: plan agreed. Catalog, prerequisites and CECS faculty data collected. Building the site.
- 2026-11-05: site built, 20 commits, live at https://bananatruck.github.io/CSULB-tracker/. Tests pass locally and in CI.
- 2026-11-05: ratings looked up on RateMyProfessors for about 45 CECS instructors (school id 18846). Not yet written into the site.
  No match found for: Binh Le, Sahar Nikbakht, Sina Askari (0 ratings), Benyamin Haghi, Wei Wei, Daniel Commey (0 ratings), Dan Cregg (only a different-department match).
- 2026-11-05: UI redesigned to a full-screen, flowchart-first app.
  Click a course to cycle not taken, in progress, completed. Courses unlock when prerequisites are completed.
  Six lanes (math and science, foundations, upper core, pick one, track, electives) each carry a credit bar; header shows credits out of 120.
  Semesters board replaces the long recommender page. Professors and Guide kept as tabs. Settings (other credits, unlock all, export, import, reset) live in the menu.
- Next: write ratings file, then recent-opinion summaries, then comments.
