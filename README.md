# INFO 213 · Milestone 3 prototypes

Test prototypes for Team 3's Milestone 3 usability sessions (UC Berkeley, Fall 2026). Each one is a realistic, clickable phone app with fictional data. Nothing connects to real email, calendars or bCourses.

| Prototype | Path | Status |
|---|---|---|
| Personal Assistant ("most likely to work") | `/assistant/` | Ported from Figma Make (Nov 3, 2026) |
| Personal Time Protector ("most delightful") | `/time-protector/` | Built in code (Nov 3) |
| Chat Calendar Assistant ("dark horse") | `/chat/` | Built in code (Nov 3) |

## Run it

```bash
npm install
npm run dev          # http://localhost:5173/  (Personal Assistant: /assistant/#lock)
npm run build        # typecheck + production build into dist/
npm run preview      # serve dist/ on http://localhost:4173/
```

**Live site:** https://qazybekb.github.io/info213-prototypes/ · Session cards: https://qazybekb.github.io/info213-prototypes/cards/

## Moderator controls (all three prototypes)

- **Open the panel:** press and hold the profile picture (or the clock on a lock screen) for 3 seconds, or add `#mod` to the link.
- **Jumps** (e.g. "Lock screen") go to a task's start and reset the demo. **Reset demo** does the same and returns to the main screen.
- **Activity log:** type a participant ID (P00–P99), tap Start log; after the session, Stop log → Save CSV → Clear.
- `#lock` opens the lock screen directly.

## Participant data rules (from the M3 brief)

- **Fictional data only.** Participants never type or forward their own information.
- **No outside services.** No analytics, tracking, or third-party requests; fonts ship with the app.
- **Footprints (activity log):** `src/shared/footprints.ts`. Logs stay in the browser until the moderator exports them to a team-only Berkeley Drive folder. Participant IDs only, never names or typed text.
- **Delete after the course:** remove all logs after December 2026.

## Where things came from

- **Source:** the Personal Assistant was built in Figma Make, then exported with "Download code" on Nov 3, 2026. The original export, including Figma's build scripts, is in `reference/figma-export-2026-11-03/` for reference only. Don't run its `.figma/make/*` scripts.
- **Figma file:** https://www.figma.com/make/Ph0r8eoCh2mejcARehRV6k
- **Specs** (in the course Obsidian vault): `INFO 213 - Team Project-5/Milestone 3 - <prototype> v2 Spec.md`.

## Status (Nov 3)

All three prototypes are built, phone-ready and deployed to GitHub Pages, with the activity log in each moderator panel. Next: test on a real iPhone (Add to Home Screen) and run the pilot.
