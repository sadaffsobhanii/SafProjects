# MOR-531 Vibe Coding Memo

**Your Name:** Sadaf Sobhani  
**Title of Vibe Coding Project:** LeaveBy — stop guessing when to leave  
**URL / Web Link:** _Paste the GitHub Pages URL after deploy (expected: https://sadaffsobhanii.github.io/SafProjects/)_  
**Platform Used:** Cursor (Cloud Agent), with a React + Vite site hosted on GitHub Pages  

## Who is the target audience?

Busy students and working people who already put plans on a calendar but still guess when to walk out the door — especially in traffic-heavy cities like Los Angeles.

## What problem does this project solve?

A calendar event is an *arrival* time. Getting there on time depends on mode (walk / drive / transit) and conditions (rush hour vs. a quiet 8pm gym trip). Today that math happens in your head, so people leave too late or too early.

## What does the project do? (outputs and outcomes)

**LeaveBy** is a product landing page plus a working planner:

- You choose a trip (gym after work, morning class, airport, or custom).
- You set where you are, where you need to be, arrive-by time, travel mode, and a buffer.
- **Output:** a leave-by clock time, travel minutes, traffic label, and the same trip if you switched modes.
- **Outcome:** you can plan a real evening (“gym at 8, drive, leave by ~7:22”) without pretending Google Calendar is already connected.

This prototype uses a transparent Los Angeles–style traffic curve on empty-road minutes. It does **not** yet read Google Calendar or live Maps traffic.

## Key learnings

### Prompts used (high level)

- Shared the MOR-531 rubric (memo + public URL + screenshot).
- Shared the product idea: calendar plans + walk/drive + traffic → “what time should I leave?”
- Asked to set the project up in the SafProjects repo so a Cloud Agent could build it.

### Overall experience

Cursor could turn a homework brief and a commute story into a named product, a visual landing page, and an interactive demo in one repo. The fastest path was a **prototype that is honest** (presets + traffic model) rather than a half-wired Google OAuth app that would not load for the professor.

### Frustrations

- Real Calendar + Maps sync needs API keys, OAuth consent screens, and would block a public homework URL.
- An empty repo (blank README) meant the first agent had no product context until the assignment text was pasted.
- A public link still needs GitHub Pages enabled on the repository (one Settings click) after the site is on `main`.

### Learnings

- Vibe coding works better when the prompt includes audience, the job-to-be-done, and what “done” means (URL + memo), not only the feature fantasy.
- For class, a **crisp demo of the core loop** (arrive-by → leave-by) beats a fake “Sync Google Calendar” button.
- Constraints (no API keys) forced a clearer product story: start from the calendar time, then layer travel.

## Potential next steps

There is no further class deliverable. If continuing:

1. Connect Google Calendar (read events) and Google Maps Directions (live duration by mode).
2. Push a “Leave by 7:22” reminder 15 minutes before departure.
3. Learn a person’s usual origin (home / campus) instead of typing it each time.
4. Show a map polyline so the recommendation feels like Maps, not only a clock.

## Screenshot

See `docs/screenshots/leaveby_hero.png` and `docs/screenshots/leaveby_gym_leave_by.png`.
