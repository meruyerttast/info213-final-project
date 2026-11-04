# INFO 213 · Milestone 3 prototypes

Test prototypes for Team 3's Milestone 3 usability sessions (UC Berkeley, Fall 2026). Each one is a realistic, clickable phone app with fictional data. Nothing connects to real email, calendars or bCourses.

| Prototype | Path | Status |
|---|---|---|
| Personal Assistant ("most likely to work") | `/assistant/` | Ported from Figma Make (Nov 3, 2026) |
| Personal Time Protector ("most delightful") | `/time-protector/` | Not built yet |
| Chat Calendar Assistant ("dark horse") | `/chat/` | Not built yet |

## Run it

```bash
npm install
npm run dev          # http://localhost:5173/  (Personal Assistant: /assistant/#lock)
npm run build        # typecheck + production build into dist/
npm run preview      # serve dist/ on http://localhost:4173/
```

## Moderator controls (Personal Assistant)

- `#lock` opens the lock-screen start for Task 1.
- `#mod` opens the moderator panel. You can also long-press the avatar for 3 seconds.
  - **Reset:** brings back the exact start state.
  - **Jumps:** go to the start of each task.
  - **Toggles:** the planted error and the error screens.
- `#onboarding` runs first-time setup.

## Participant data rules (from the M3 brief)

- **Fictional data only.** Participants never type or forward their own information.
- **No outside services.** No analytics, tracking, or third-party requests; fonts ship with the app.
- **Footprints:** session logs, once added, stay in the browser until the moderator exports them to the team's Berkeley Google Drive. They use participant IDs only (P01…), never names or typed text.
- **Delete after the course:** remove all logs after December 2026.

## Where things came from

- **Source:** the Personal Assistant was built in Figma Make, then exported with "Download code" on Nov 3, 2026. The original export, including Figma's build scripts, is in `reference/figma-export-2026-11-03/` for reference only. Don't run its `.figma/make/*` scripts.
- **Figma file:** https://www.figma.com/make/Ph0r8eoCh2mejcARehRV6k
- **Specs** (in the course Obsidian vault): `INFO 213 - Team Project-5/Milestone 3 - <prototype> v2 Spec.md`.

## Next steps

1. ~~Real-phone layout for the Personal Assistant~~ (done Nov 3): full screen under 500px, safe areas, no fake status bar, app manifest and icons, readable type scale.
2. Time Protector and Chat Calendar Assistant, built in the same design system.
3. Footprint logger plus a moderator console.
4. Deploy to a public static host, so Anam, Stef and participants can open it without signing in.
