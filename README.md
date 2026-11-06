# CSULB-tracker

A static site that helps a CSULB Computer Science B.S. student check degree requirements, see what blocks each course, and plan the last semesters.
It follows the 2023-24 catalog.
It is an unofficial helper, so the catalog and your ARR always win.

Live site: https://bananatruck.github.io/CSULB-tracker/

## Run it

No build step.
Serve the folder with any static server and open `index.html`.

```bash
python3 -m http.server 8000
```

## Test it

```bash
node --test tests/*.test.js
```

## Where the data comes from

- Degree rules and prerequisites: the CSULB 2023-24 catalog, Computer Science B.S., and each course's catalog page.
- Professors: the CECS faculty and staff page and the faculty office hours page on csulb.edu.
- Ratings: dated snapshots from RateMyProfessors, each with a link.

`plan.md` holds the scope, decisions and status.
