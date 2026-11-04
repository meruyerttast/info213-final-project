# Notes for Claude Code

These are test prototypes for INFO 213 Milestone 3 usability sessions, with participants who are graduate students. Read `README.md` first.

## Specs

The source of truth is the specs in the user's Obsidian vault:
`~/Documents/qb_obsidian/qb_obsidian/10 Berkeley/11 Courses/2026 Fall/Introduction to User Experience Design (INFO 213)/INFO 213 - Team Project-5/`
- `Milestone 3 - Personal Assistant v2 Spec.md`. Shared parts live here: the fictional world in §2, the design system in §9, footprints in §11, consent in §12, and the build setup in §13.
- `Milestone 3 - Personal Time Protector v2 Spec.md`
- `Milestone 3 - Chat Calendar Assistant v2 Spec.md`

## Rules

- **Fictional data only.** The fixed scenario day is Tue Nov 10, 2026. All names are invented. Never use real participant or teammate names.
- **No requests to outside servers at runtime.** That means no analytics, CDNs, Google Fonts or tracking pixels. Bundle every asset.
- **Footprint logs:**
  - participant ID, event, screen and element ID, timestamps
  - never typed text, names, IP addresses or device IDs
  - stored in the browser only; exported by the moderator
- **Keep all three prototypes at the same level of detail and in the same design system**, so the comparison stays fair.
- **Each prototype's spec §15 is the definition of done.** Every button works or is visibly disabled, reset restores the exact start state, and state stays consistent across tabs.
- **Words that never appear in the app:** "Secretary", "agent", "prototype", "simulate".

## Layout

- **Vite multi-page app:** each prototype has its own `<name>/index.html`. Add each new page to `build.rollupOptions.input` in `vite.config.ts`.
- **Personal Assistant code:** `src/assistant/`, mostly `App.tsx` (screens), `store.tsx` (state) and `data.ts` (fictional data).
- **`reference/`:** the untouched Figma Make export. Don't edit it or run its scripts.

## Checks before handing off

`npm run build` must pass. Then click through T1–T4 of each prototype in a browser, including `#mod` reset.
