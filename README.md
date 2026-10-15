# From Strength to Snow — Workout Tracker

Tracker for the Altitude Attitude + ACECoLab pre-season program (Week 1: Base).

## Features
- Weekly progress: 3 strength, 2 cardio, core + stretch days (goal 5–7)
- Per-round set checklists with exercise how-to notes
- Weeks 1–2, with a week switcher
- One guided timer through Core → workout → Stretch; each step shows how to do the exercise
- Two-sided exercises are done once per side within every set (left, then right)
- 10s rest between timed exercises (skipped where the program has its own rest or recovery)
- Keeps the screen on while the app is open (Screen Wake Lock API, where supported)
- Daily core/stretch grid for the current calendar week
- Progress saved in the browser (localStorage)
- Link to the original program PDF (`public/pdf/week-N.pdf`)

## Scripts
- `npm run dev` — local dev server
- `npm run build` — typecheck + production build
- `npm test` — unit + component tests
- `npm run lint` — oxlint

## Adding weeks
Add a `Week` object to `src/data/program.ts`, append it to `program.weeks`, and drop the PDF in `public/pdf/week-N.pdf`. Mark two-sided exercises with `perSide: true`; give timed ones `seconds` (and `restSeconds` if the program has built-in rest).

## Workflow
- Work on a feature branch and open a pull request into `main`.
- Every PR runs lint, tests, and the build (`.github/workflows/deploy.yml`).
- Merging to `main` deploys to GitHub Pages:
  https://tamaradidproduct.github.io/altitude-fitness-training/
