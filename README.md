# LeaveBy

MOR-531 vibe-coding project: a landing page and working prototype that tells you **when to leave** so you arrive on time.

Live demo (after GitHub Pages is enabled on `main`): https://sadaffsobhanii.github.io/SafProjects/

## The problem

Calendars store *arrive-by* times (“gym at 8pm”). People still guess *leave-by* times, especially with LA traffic and a choice to walk, drive, or take transit.

## What this prototype does

- Landing page for the product idea
- Interactive planner with presets (gym, class, airport) plus a custom trip
- Leave-by time from empty-road minutes × a time-of-day traffic curve + a buffer
- Side-by-side comparison of drive / walk / transit

Calendar sync and live Google Maps traffic are listed as next steps, not faked as connected.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL.

```bash
npm run build
npm run preview
```

## Assignment memo

See [`docs/MEMO.md`](docs/MEMO.md).
