# From Strength to Snow — Workout Tracker

Tracker for the Altitude Attitude + ACECoLab pre-season program (Week 1: Base).

## Features
- Weekly progress: 3 strength, 2 cardio, core + stretch days (goal 5–7)
- Per-round set checklists with exercise how-to notes
- Guided timers for Cardio (warm-up, 15s/45s × 3 rounds, cooldown), Core, and Stretch
- Daily core/stretch grid for the current calendar week
- Progress saved in the browser (localStorage)

## Scripts
- `npm run dev` — local dev server
- `npm run build` — typecheck + production build
- `npm test` — unit + component tests
- `npm run lint` — oxlint

## Adding weeks
Add a `Week` object to `src/data/program.ts` and append it to `program.weeks`.
