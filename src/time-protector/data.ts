// Time Protector: fictional data and the re-planning logic.
// All names and events are invented. Times are minutes since Mon Nov 9, 2026, 12:00 am.

export const DAY = 1440
export const t = (day: number, h: number, m = 0) => day * DAY + h * 60 + m

/** The fixed "now": Tue Nov 10, 2026, 4:55 pm. */
export const NOW = t(1, 16, 55)
export const TODAY = 1
export const VERSION = "TP v2.0"

export const user = {
  name: "Maya Chen",
  firstName: "Maya",
  initials: "MC",
  program: "Master's 2028",
  email: "maya.chen@university.example",
}

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
export const DAY_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]
export const dayOf = (abs: number) => Math.floor(abs / DAY)
export const dateLabel = (day: number) => `${DAY_SHORT[day]} Nov ${9 + day}`
export const longDateLabel = (day: number) => `${DAY_LONG[day]}, Nov ${9 + day}`

const minuteOfDay = (abs: number) => ((abs % DAY) + DAY) % DAY

export function clock(abs: number, meridiem = true) {
  const m = minuteOfDay(abs)
  const h = Math.floor(m / 60)
  const mm = m % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  const text = `${h12}:${String(mm).padStart(2, "0")}`
  return meridiem ? `${text} ${h < 12 ? "am" : "pm"}` : text
}

const half = (abs: number) => (minuteOfDay(abs) < 720 ? "am" : "pm")

/** "5:00–6:15 pm", "11:15 pm–12:00 am", "11:00 am–12:30 pm" */
export function range(a: number, b: number) {
  return half(a) === half(b) && b - a < 720
    ? `${clock(a, false)}–${clock(b)}`
    : `${clock(a)}–${clock(b)}`
}
export const dayRange = (a: number, b: number) => `${DAY_SHORT[dayOf(a)]} ${range(a, b)}`
export const dayClock = (abs: number) => `${DAY_SHORT[dayOf(abs)]} ${clock(abs)}`

/** "45 min", "2 h", "3 h 15 m" */
export function dur(min: number) {
  if (min === 0) return "0 h"
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m} m`
}

// ---------- Calendar ----------

export type EventKind =
  | "study"
  | "class"
  | "work"
  | "meeting"
  | "travel"
  | "meal"
  | "protected"
  | "deadline"
  | "reminder"

export type ProtectKey = "dinner" | "winddown" | "sleep" | "gym" | "family" | "meal"
export type Source = "Google Calendar" | "Course site" | "Time Protector" | "You"

export type EventStatus =
  | "current"
  | "done"
  | "extended"
  | "new"
  | "moved"
  | "ghost"
  | "used"
  | "shortened"

export interface CalEvent {
  id: string
  title: string
  short?: string
  start: number
  end: number
  kind: EventKind
  protect?: ProtectKey
  location?: string
  people?: string
  source: Source
  status?: EventStatus
  note?: string
  tone?: "amber" | "red"
  planId?: string
  detail?: string
}

const WORK_KINDS: EventKind[] = ["study", "class", "work", "meeting"]
export const isWork = (e: CalEvent) => WORK_KINDS.includes(e.kind) && e.status !== "ghost"

export const STUDY_TITLE = "Study: Stats 203 Assignment 4"

export const baseEvents: CalEvent[] = [
  // Mon Nov 9
  { id: "mon-gym", title: "Gym", start: t(0, 7), end: t(0, 8), kind: "protected", protect: "gym", location: "Campus gym", source: "Google Calendar" },
  { id: "mon-read", title: "Study: Design 213 reading", start: t(0, 9, 30), end: t(0, 11, 30), kind: "study", source: "Google Calendar" },
  { id: "mon-213", title: "Design 213 class", start: t(0, 14), end: t(0, 15, 30), kind: "class", location: "Room 202", source: "Google Calendar" },
  { id: "mon-a4", title: "Study: Stats 203 Assignment 4", start: t(0, 16), end: t(0, 18), kind: "study", source: "Google Calendar" },
  { id: "mon-dinner", title: "Dinner", start: t(0, 19), end: t(0, 20), kind: "meal", source: "Google Calendar" },
  { id: "mon-wind", title: "Wind-down", start: t(0, 23, 15), end: t(1, 0), kind: "protected", protect: "winddown", source: "Time Protector", detail: "No work before bed" },
  // Tue Nov 10
  { id: "tue-sleep-am", title: "Sleep", start: t(1, 0), end: t(1, 7), kind: "protected", protect: "sleep", source: "Time Protector" },
  { id: "tue-203", title: "Stats 203 class", start: t(1, 11), end: t(1, 12, 30), kind: "class", location: "Room 210", source: "Google Calendar" },
  { id: "tue-study", title: STUDY_TITLE, start: t(1, 13, 30), end: t(1, 17), kind: "study", location: "Main Library", source: "Google Calendar", detail: "Due Wed 9:00 am (course site)" },
  { id: "tue-travel", title: "Travel to dinner", start: t(1, 18, 15), end: t(1, 19), kind: "travel", source: "Google Calendar", detail: "Train home" },
  { id: "tue-dinner", title: "Dinner with friends", start: t(1, 19), end: t(1, 21), kind: "protected", protect: "dinner", location: "Rockridge", people: "Priya, Jonah", source: "Google Calendar" },
  { id: "tue-home", title: "Travel home", start: t(1, 21), end: t(1, 21, 15), kind: "travel", source: "Google Calendar" },
  { id: "tue-wind", title: "Wind-down", start: t(1, 23, 15), end: t(2, 0), kind: "protected", protect: "winddown", source: "Time Protector", detail: "No work before bed" },
  // Wed Nov 11
  { id: "wed-sleep", title: "Sleep", start: t(2, 0), end: t(2, 7), kind: "protected", protect: "sleep", source: "Time Protector", detail: "7 h minimum" },
  { id: "wed-gym", title: "Gym", start: t(2, 7), end: t(2, 8), kind: "protected", protect: "gym", location: "Campus gym", source: "Google Calendar" },
  { id: "wed-ready", title: "Get ready and commute", start: t(2, 8), end: t(2, 8, 45), kind: "travel", source: "Google Calendar" },
  { id: "wed-due", title: "Stats 203 Assignment 4 due", short: "A4 due", start: t(2, 9), end: t(2, 9), kind: "deadline", source: "Course site" },
  { id: "wed-gsr", title: "Research assistant (RA) shift", short: "RA shift", start: t(2, 9, 30), end: t(2, 12, 30), kind: "work", location: "Campus", source: "Google Calendar" },
  { id: "wed-213", title: "Design 213 class", start: t(2, 14), end: t(2, 15, 30), kind: "class", location: "Room 202", source: "Google Calendar" },
  { id: "wed-group", title: "Stats 203 study group", start: t(2, 16), end: t(2, 17), kind: "meeting", location: "Library", people: "Sam, Diego, Hana", source: "Google Calendar" },
  { id: "wed-dinner", title: "Dinner", start: t(2, 19), end: t(2, 20), kind: "meal", source: "Google Calendar" },
  { id: "wed-wind", title: "Wind-down", start: t(2, 23, 15), end: t(3, 0), kind: "protected", protect: "winddown", source: "Time Protector", detail: "No work before bed" },
  // Thu Nov 12 (the heavy day: 9 h planned, 0 h free)
  { id: "thu-ready", title: "Get ready and commute", start: t(3, 8), end: t(3, 8, 45), kind: "travel", source: "Google Calendar" },
  { id: "thu-a5", title: "Study: Stats 203 Assignment 5", start: t(3, 8, 45), end: t(3, 10, 45), kind: "study", source: "Google Calendar" },
  { id: "thu-203", title: "Stats 203 class", start: t(3, 11), end: t(3, 12, 30), kind: "class", location: "Room 210", source: "Google Calendar" },
  { id: "thu-lunch", title: "Lunch", start: t(3, 12, 30), end: t(3, 13), kind: "meal", source: "Google Calendar" },
  { id: "thu-m3", title: "Study: Design 213 Milestone 3", start: t(3, 13, 30), end: t(3, 16), kind: "study", source: "Google Calendar" },
  { id: "thu-rr", title: "Study: Stats 203 Reading response", start: t(3, 16, 30), end: t(3, 17, 30), kind: "study", source: "Google Calendar" },
  { id: "thu-walk", title: "Walk to campus", start: t(3, 17, 30), end: t(3, 18), kind: "travel", source: "Google Calendar" },
  { id: "thu-sync", title: "Design 213 team sync", start: t(3, 18), end: t(3, 19), kind: "meeting", location: "Room 205", people: "Kai, Lena, Ravi", source: "Google Calendar" },
  { id: "thu-walk2", title: "Walk home", start: t(3, 19), end: t(3, 19, 30), kind: "travel", source: "Google Calendar" },
  { id: "thu-dinner", title: "Dinner", start: t(3, 19, 30), end: t(3, 20, 30), kind: "meal", source: "Google Calendar" },
  { id: "thu-rr2", title: "Study: Reading response, finish", start: t(3, 21), end: t(3, 22), kind: "study", source: "Google Calendar" },
  { id: "thu-family", title: "Family call", start: t(3, 22), end: t(3, 22, 45), kind: "protected", protect: "family", source: "Google Calendar" },
  { id: "thu-wind", title: "Wind-down", start: t(3, 23, 15), end: t(4, 0), kind: "protected", protect: "winddown", source: "Time Protector", detail: "No work before bed" },
  { id: "thu-due", title: "Stats 203 Reading response due", short: "Reading due", start: t(3, 23, 59), end: t(3, 23, 59), kind: "deadline", source: "Course site" },
  // Fri Nov 13
  { id: "fri-gym", title: "Gym", start: t(4, 7), end: t(4, 8), kind: "protected", protect: "gym", location: "Campus gym", source: "Google Calendar" },
  { id: "fri-a5", title: "Study: Stats 203 Assignment 5", start: t(4, 9, 30), end: t(4, 12, 30), kind: "study", source: "Google Calendar" },
  { id: "fri-lunch", title: "Lunch", start: t(4, 12, 30), end: t(4, 13, 15), kind: "meal", source: "Google Calendar" },
  { id: "fri-m3", title: "Study: Design 213 Milestone 3", start: t(4, 14), end: t(4, 16), kind: "study", source: "Google Calendar" },
  { id: "fri-dinner", title: "Dinner with Priya", start: t(4, 19), end: t(4, 21), kind: "protected", protect: "meal", people: "Priya", source: "Google Calendar" },
  { id: "fri-wind", title: "Wind-down", start: t(4, 23, 15), end: t(5, 0), kind: "protected", protect: "winddown", source: "Time Protector", detail: "No work before bed" },
  { id: "fri-due", title: "Stats 203 Assignment 5 due", short: "A5 due", start: t(4, 23, 59), end: t(4, 23, 59), kind: "deadline", source: "Course site" },
  // Sat Nov 14
  { id: "sat-m3", title: "Study: Design 213 Milestone 3", start: t(5, 10), end: t(5, 13), kind: "study", source: "Google Calendar" },
  { id: "sat-groceries", title: "Groceries", start: t(5, 15), end: t(5, 16), kind: "meal", source: "Google Calendar" },
  { id: "sat-wind", title: "Wind-down", start: t(5, 23, 15), end: t(6, 0), kind: "protected", protect: "winddown", source: "Time Protector", detail: "No work before bed" },
  // Sun Nov 15
  { id: "sun-m3", title: "Study: Design 213 Milestone 3", start: t(6, 13), end: t(6, 16), kind: "study", source: "Google Calendar" },
  { id: "sun-family", title: "Family call", start: t(6, 18), end: t(6, 19), kind: "protected", protect: "family", source: "Google Calendar" },
  { id: "sun-wind", title: "Wind-down", start: t(6, 23, 15), end: t(7, 0), kind: "protected", protect: "winddown", source: "Time Protector", detail: "No work before bed" },
  { id: "sun-due", title: "Design 213 Milestone 3 due", short: "M3 due", start: t(6, 23, 59), end: t(6, 23, 59), kind: "deadline", source: "Course site" },
]

// ---------- Protection ----------

export type Level = "hard" | "soft" | "off"
export type Lockable = "dinner" | "winddown" | "sleep" | "gym"
export const LOCKABLES: Lockable[] = ["dinner", "winddown", "sleep", "gym"]

export interface Rules {
  sleep: { level: Level; minHours: number; windDown: number }
  gym: { level: Level }
  meals: { level: Level }
  noWorkAfter: { level: Level; time: number /* minute of day */ }
}

export const defaultRules: Rules = {
  sleep: { level: "hard", minHours: 7, windDown: 45 },
  gym: { level: "hard" },
  meals: { level: "hard" },
  noWorkAfter: { level: "off", time: 22 * 60 },
}

export const ruleFor: Record<Lockable, keyof Rules> = {
  dinner: "meals",
  winddown: "sleep",
  sleep: "sleep",
  gym: "gym",
}

export const lockLabels: Record<Lockable, { title: string; detail: string }> = {
  dinner: { title: "Dinner with friends", detail: "Tue 7:00–9:00 pm · Priya, Jonah" },
  winddown: { title: "Wind-down", detail: "11:15 pm · no work before bed" },
  sleep: { title: "Sleep", detail: "7 h minimum" },
  gym: { title: "Gym", detail: "Wed 7:00 am" },
}

// ---------- Key moments in the scenario ----------

export const K = {
  BLOCK_START: t(1, 13, 30),
  BLOCK_END: t(1, 17),
  TRAVEL: t(1, 18, 15),
  DINNER: t(1, 19),
  DINNER_END: t(1, 21),
  HOME: t(1, 21, 15),
  WIND: t(1, 23, 15),
  SLEEP: t(2, 0),
  EARLY: t(2, 6, 15),
  WAKE: t(2, 7),
  GYM: t(2, 7),
  GYM_END: t(2, 8),
  GYM_THU: t(3, 7),
  DEADLINE: t(2, 9),
  DEADLINE_LATE: t(2, 17),
  SHIFT: 30,
}

const WED_GAPS = [
  { start: t(2, 8, 45), end: t(2, 9, 30) },
  { start: t(2, 12, 30), end: t(2, 14) },
]

// ---------- Planner ----------

export interface Block {
  id: string
  start: number
  end: number
}

export interface PlanCtx {
  blockEnd: number
  deadline: number
  /** true = unlocked (may be moved or used this time) */
  unlocked: Record<Lockable, boolean>
  noWorkAfter: Rules["noWorkAfter"]
  sleepMin: number
}

export interface Extras {
  submitAsIs?: boolean
  extension?: boolean
  continuation?: boolean
}

export interface OptionPlan {
  id: string
  template: string
  name: string
  blocks: Block[]
  allowed: Lockable[]
  extras?: Extras
}

type Win = { key: string; start: number; end: number; anchor?: "end" }
const cap = (w: { start: number; end: number }) => Math.max(0, w.end - w.start)

function windows(ctx: PlanCtx) {
  const cutoff =
    ctx.noWorkAfter.level === "hard" ? t(1, 0) + ctx.noWorkAfter.time : K.WIND
  const postEnd = Math.min(K.WIND, cutoff)
  const wed: Win[] = WED_GAPS.filter((g) => g.end <= ctx.deadline).map((g, i) => ({
    key: `wed${i}`,
    ...g,
  }))
  return {
    pre: { key: "pre", start: ctx.blockEnd, end: K.TRAVEL } as Win,
    post: { key: "post", start: K.HOME, end: postEnd } as Win,
    preShift: { key: "preShift", start: ctx.blockEnd, end: K.DINNER } as Win,
    postShift: { key: "postShift", start: K.HOME + K.SHIFT, end: postEnd } as Win,
    postWind: { key: "postWind", start: K.HOME, end: K.SLEEP } as Win,
    rest: { key: "rest", start: K.HOME, end: K.SLEEP, anchor: "end" } as Win,
    gym: { key: "gym", start: K.GYM, end: K.GYM_END } as Win,
    early: { key: "early", start: K.EARLY, end: K.WAKE, anchor: "end" } as Win,
    wed,
    cutoffActive: cutoff < K.WIND,
  }
}

function allocations(N: number, wins: Win[]): number[][] {
  const out: number[][] = []
  const acc: number[] = []
  const rec = (i: number, left: number) => {
    if (i === wins.length) {
      if (left === 0) out.push([...acc])
      return
    }
    const values = [0]
    for (let v = 45; v <= Math.min(cap(wins[i]), left); v += 15) values.push(v)
    for (const v of values) {
      acc.push(v)
      rec(i + 1, left - v)
      acc.pop()
    }
  }
  rec(0, N)
  return out
}

let blockSeq = 0
export const newBlockId = () => `b${++blockSeq}`

function toBlocks(wins: Win[], amounts: number[]): Block[] {
  const raw = wins
    .map((w, i) =>
      amounts[i] > 0
        ? w.anchor === "end"
          ? { start: w.end - amounts[i], end: w.end }
          : { start: w.start, end: w.start + amounts[i] }
        : null,
    )
    .filter((b): b is { start: number; end: number } => b !== null)
    .sort((a, b) => a.start - b.start)
  const merged: { start: number; end: number }[] = []
  for (const b of raw) {
    const last = merged[merged.length - 1]
    if (last && last.end === b.start) last.end = b.end
    else merged.push({ ...b })
  }
  return merged.map((b) => ({ id: newBlockId(), ...b }))
}

function best(
  N: number,
  wins: Win[],
  valid: (a: Record<string, number>) => boolean,
  cost: (a: Record<string, number>) => number,
): Block[] | null {
  let bestArr: number[] | null = null
  let bestCost = Infinity
  for (const arr of allocations(N, wins)) {
    const a: Record<string, number> = {}
    wins.forEach((w, i) => (a[w.key] = arr[i]))
    if (!valid(a)) continue
    const c = cost(a)
    if (c < bestCost) {
      bestCost = c
      bestArr = arr
    }
  }
  return bestArr ? toBlocks(wins, bestArr) : null
}

const ceil15 = (n: number) => Math.ceil(n / 15) * 15
const sumWed = (a: Record<string, number>) =>
  Object.entries(a)
    .filter(([k]) => k.startsWith("wed"))
    .reduce((s, [, v]) => s + v, 0)

export type ConflictKey = "gym" | "winddown" | "sleep" | "extension" | "submit"

export interface ConflictChoice {
  key: ConflictKey
  title: string
  detail: string
  cost?: { text: string; tone: "amber" | "red" | "neutral" }
  plan: OptionPlan | null
}

export type Generated =
  | { mode: "options"; options: OptionPlan[]; freeCap: number }
  | {
      mode: "conflict"
      fit: number
      freeCap: number
      base: OptionPlan
      choices: ConflictChoice[]
    }

export function freeWindows(ctx: PlanCtx) {
  const W = windows(ctx)
  return [W.pre, W.post, ...W.wed].filter((w) => cap(w) >= 45)
}

export function generateOptions(N: number, ctx: PlanCtx): Generated {
  const W = windows(ctx)
  const capPre = cap(W.pre) >= 45 ? cap(W.pre) : 0
  const capPost = cap(W.post) >= 45 ? cap(W.post) : 0
  const wedCap = W.wed.reduce((s, w) => s + cap(w), 0)
  const freeCap = capPre + capPost + wedCap
  const U = ctx.unlocked
  const options: OptionPlan[] = []
  const add = (
    template: string,
    name: string,
    blocks: Block[] | null,
    allowed: Lockable[] = [],
    extras?: Extras,
  ) => {
    if (!blocks || !blocks.length) return
    const key = blocks.map((b) => `${b.start}-${b.end}`).join("|") + allowed.join(",")
    if (options.some((o) => o.blocks.map((b) => `${b.start}-${b.end}`).join("|") + o.allowed.join(",") === key))
      return
    options.push({ id: template, template, name, blocks, allowed, extras })
  }

  if (N < 45) {
    // Less than the 45-minute minimum: keep going now, or take the shortest block after dinner.
    if (cap(W.pre) >= N)
      add("keep", "Keep going now", [{ id: newBlockId(), start: W.pre.start, end: W.pre.start + N }], [], {
        continuation: true,
      })
    if (capPost >= 45) add("after", "After dinner", toBlocks([W.post], [45]))
    return { mode: "options", options, freeCap }
  }

  if (N <= freeCap) {
    if (N <= capPost) add("after", "After dinner", toBlocks([W.post], [N]))
    if (N <= capPre) add("now", "Keep going now", toBlocks([W.pre], [N]))
    add(
      "split",
      "Split it",
      best(N, [W.pre, W.post], (a) => a.pre > 0 && a.post > 0, (a) =>
        Math.abs(a.pre - Math.min(60, ceil15(N / 2))),
      ),
    )
    add(
      "morning",
      U.gym ? "Use gym time" : "Morning push",
      best(N, [W.pre, W.gym, W.post], (a) => a.gym > 0, (a) =>
        (60 - a.gym) * 2 + a.post + Math.abs(a.pre - 60) * 0.5,
      ),
      ["gym"],
    )
    if (U.dinner && N > capPre)
      add(
        "beforeDinner",
        "Before dinner",
        best(N, [W.preShift, W.postShift], (a) => a.preShift > 0, (a) => a.postShift),
        ["dinner"],
      )
    if (U.winddown && !W.cutoffActive && N <= cap(W.rest))
      add("rest", "Rest after dinner", toBlocks([W.rest], [N]), ["winddown"])
    if (U.sleep)
      add(
        "early",
        "Early start",
        best(N, [W.pre, W.early, W.post], (a) => a.early > 0, (a) => a.post + (capPre - a.pre)),
        ["sleep"],
      )
    if (W.wed.length)
      add(
        "tomorrow",
        "Use tomorrow’s gaps",
        best(N, [W.pre, ...W.wed, W.post], (a) => sumWed(a) > 0, (a) => a.post * 2 + (capPre - a.pre)),
      )
    return { mode: "options", options: sortOptions(options, ctx), freeCap }
  }

  // Doesn't fit in free time. Try what the student unlocked.
  type Base = { id: string; wins: Win[]; allowed: Lockable[]; preKey: string; postKey: string }
  const bases: Base[] = [
    { id: "free", wins: [W.pre, W.post, ...W.wed], allowed: [], preKey: "pre", postKey: "post" },
  ]
  if (U.dinner)
    bases.push({
      id: "shift",
      wins: [W.preShift, W.postShift, ...W.wed],
      allowed: ["dinner"],
      preKey: "preShift",
      postKey: "postShift",
    })
  const baseCap = (b: Base) => b.wins.reduce((s, w) => s + (cap(w) >= 45 ? cap(w) : 0), 0)
  const fillCost = (b: Base) => (a: Record<string, number>) => {
    let c = 0
    for (const w of b.wins) c += (cap(w) - (a[w.key] ?? 0)) * (w.key === b.postKey ? 1 : 2)
    return c
  }
  const stretch = (b: Base, extra: Lockable): Block[] | null => {
    if (extra === "winddown") {
      if (W.cutoffActive) return null
      const wins = b.wins.map((w) => (w.key === b.postKey ? { ...W.postWind, start: w.start } : w))
      return best(N, wins, (a) => a.postWind > cap(b.wins.find((w) => w.key === b.postKey)!), fillCost(b))
    }
    const extraWin = extra === "gym" ? W.gym : W.early
    const base = fillCost(b)
    return best(N, [...b.wins, extraWin], (a) => a[extraWin.key] > 0, (a) => a[extraWin.key] * 100 + base(a))
  }
  const names: Record<string, string> = {
    gym: "Use gym time",
    winddown: "Use your wind-down",
    sleep: "Early start",
  }
  for (const b of bases) {
    if (N <= baseCap(b)) {
      add("beforeDinner", "Before dinner", best(N, b.wins, (a) => (a[b.preKey] ?? 0) > 0, (a) => a[b.postKey] ?? 0), b.allowed)
      continue
    }
    for (const extra of ["gym", "winddown", "sleep"] as Lockable[]) {
      if (!U[extra]) continue
      const blocks = stretch(b, extra)
      const name = b.id === "shift" ? `Before dinner + ${names[extra].replace("Use ", "").replace("Early start", "early start")}` : names[extra]
      add(`${b.id}-${extra}`, name, blocks, [...b.allowed, extra])
    }
  }
  if (options.length) return { mode: "options", options: sortOptions(options, ctx), freeCap }

  // Conflict: say plainly what fits and list the real choices.
  const mainBase = bases.reduce((a, b) => (baseCap(b) > baseCap(a) ? b : a))
  const fitCap = baseCap(mainBase)
  const baseBlocks = toBlocks(
    mainBase.wins.filter((w) => cap(w) >= 45),
    mainBase.wins.filter((w) => cap(w) >= 45).map((w) => cap(w)),
  )
  const base: OptionPlan = {
    id: "fits",
    template: "fits",
    name: "What fits",
    blocks: baseBlocks,
    allowed: mainBase.allowed,
  }
  let fit = fitCap
  for (const extra of ["gym", "winddown", "sleep"] as Lockable[])
    if (U[extra]) fit += extra === "gym" ? 60 : 45
  const choices: ConflictChoice[] = []
  const extraRange = (blocks: Block[] | null, lo: number, hi: number) => {
    if (!blocks) return ""
    const parts = blocks
      .map((bl) => ({ start: Math.max(bl.start, lo), end: Math.min(bl.end, hi) }))
      .filter((p) => p.end > p.start)
    return parts.map((p) => dayRange(p.start, p.end)).join(" + ")
  }
  const minutesShort = (blocks: Block[] | null) =>
    blocks ? 0 : N - fitCap
  if (!U.gym) {
    const blocks = stretch(mainBase, "gym")
    choices.push({
      key: "gym",
      title: "Unlock the gym",
      detail: blocks
        ? `Adds ${extraRange(blocks, K.GYM, K.GYM_END)}, so ${dur(N)} fits.`
        : `Adds up to 1 h. Still ${dur(minutesShort(blocks) - 60)} short on its own.`,
      cost: { text: "Gym moves to Thu 7:00 am", tone: "amber" },
      plan: blocks ? { id: "c-gym", template: "c-gym", name: "Unlock the gym", blocks, allowed: [...mainBase.allowed, "gym"] } : null,
    })
  }
  if (!U.winddown) {
    const blocks = stretch(mainBase, "winddown")
    choices.push({
      key: "winddown",
      title: "Use my wind-down",
      detail: blocks
        ? `Adds ${extraRange(blocks, K.WIND, K.SLEEP)}.`
        : W.cutoffActive
          ? "Your “no work after” rule blocks this."
          : `Adds up to 45 min. Still ${dur(minutesShort(blocks) - 45)} short on its own.`,
      cost: { text: "No wind-down; harder to fall asleep.", tone: "amber" },
      plan: blocks ? { id: "c-wind", template: "c-wind", name: "Use my wind-down", blocks, allowed: [...mainBase.allowed, "winddown"] } : null,
    })
  }
  if (!U.sleep) {
    const blocks = stretch(mainBase, "sleep")
    const sleepLeft = 7 * 60 - 45
    choices.push({
      key: "sleep",
      title: "Shorten sleep by 45 min",
      detail: blocks
        ? `Adds ${extraRange(blocks, K.EARLY, K.WAKE)}.`
        : `Adds 45 min. Still ${dur(minutesShort(blocks) - 45)} short on its own.`,
      cost: {
        text: `Sleep ${dur(sleepLeft)}, below your ${dur(ctx.sleepMin)} minimum.`,
        tone: "red",
      },
      plan: blocks ? { id: "c-sleep", template: "c-sleep", name: "Shorten sleep", blocks, allowed: [...mainBase.allowed, "sleep"] } : null,
    })
  }
  choices.push({
    key: "extension",
    title: "Ask for an extension",
    detail: `Draft to Alex Rivera, Stats 203 TA. Keeps the ${dur(fitCap)} that fits.`,
    plan: { ...base, id: "c-ext", template: "c-ext", name: "Asked for an extension", extras: { extension: true } },
  })
  choices.push({
    key: "submit",
    title: "Submit what fits",
    detail: `${dur(fitCap)} of work, and a note to mark the assignment as “submitted as is”.`,
    plan: { ...base, id: "c-submit", template: "c-submit", name: "Submit what fits", extras: { submitAsIs: true } },
  })
  return { mode: "conflict", fit, freeCap, base, choices }
}

// ---------- Evaluating a plan (also used live while adjusting) ----------

export interface Effects {
  gymMoved: boolean
  dinnerShifted: boolean
  windUsed: number
  sleepCut: number
  total: number
  lastEvening: number | null
}

const overlap = (a: number, b: number, c: number, d: number) =>
  Math.max(0, Math.min(b, d) - Math.max(a, c))

export function effectsOf(blocks: Block[], allowed: Lockable[]): Effects {
  const has = (k: Lockable) => allowed.includes(k)
  let gym = 0
  let travel = 0
  let wind = 0
  let sleep = 0
  let total = 0
  let lastEvening: number | null = null
  for (const b of blocks) {
    gym += overlap(b.start, b.end, K.GYM, K.GYM_END)
    travel += overlap(b.start, b.end, K.TRAVEL, K.DINNER)
    wind += overlap(b.start, b.end, K.WIND, K.SLEEP)
    sleep += overlap(b.start, b.end, K.SLEEP, K.WAKE)
    total += b.end - b.start
    if (dayOf(b.start) === 1 && (lastEvening === null || b.end > lastEvening)) lastEvening = b.end
  }
  return {
    gymMoved: has("gym") && gym > 0,
    dinnerShifted: has("dinner") && travel > 0,
    windUsed: has("winddown") ? wind : 0,
    sleepCut: has("sleep") ? sleep : 0,
    total,
    lastEvening,
  }
}

/** Dinner moved 30 min later: leave at 7:00, dinner 7:30–9:30, home by 9:45. */
export function shiftedDinnerEvent(e: CalEvent): CalEvent {
  if (e.id === "tue-travel") return { ...e, start: K.DINNER, end: K.DINNER + K.SHIFT }
  return { ...e, start: e.start + K.SHIFT, end: e.end + K.SHIFT }
}

/** The Tue–Wed events a plan has to fit around, after the plan's own moves. */
export function solidEvents(blockEnd: number, fx: Effects, allowed: Lockable[]): CalEvent[] {
  const out: CalEvent[] = []
  for (const e of baseEvents) {
    if (e.end <= K.BLOCK_START || e.start >= t(2, 18)) continue
    if (e.kind === "deadline") continue
    if (e.id === "tue-study") {
      out.push({ ...e, end: blockEnd })
      continue
    }
    if (fx.dinnerShifted && ["tue-travel", "tue-dinner", "tue-home"].includes(e.id)) {
      out.push(shiftedDinnerEvent(e))
      continue
    }
    if (e.id === "wed-gym" && allowed.includes("gym")) continue
    if (e.id === "tue-wind" && allowed.includes("winddown")) continue
    if (e.id === "wed-sleep" && allowed.includes("sleep")) continue
    out.push(e)
  }
  return out
}

export type FitCheck =
  | { ok: true; text: string }
  | { ok: false; text: string; blockId: string }

export function fitCheck(
  blocks: Block[],
  allowed: Lockable[],
  blockEnd: number,
  deadline: number,
): FitCheck {
  const fx = effectsOf(blocks, allowed)
  const solid = solidEvents(blockEnd, fx, allowed)
  const sorted = [...blocks].sort((a, b) => a.start - b.start)
  for (const b of sorted) {
    if (b.start < blockEnd)
      return { ok: false, text: "✗ This starts before your study block ends", blockId: b.id }
    if (b.end > deadline)
      return { ok: false, text: `✗ This ends after your ${dayClock(deadline).replace("Wed ", "")} deadline`, blockId: b.id }
    const hit = solid.find((e) => overlap(b.start, b.end, e.start, e.end) > 0)
    if (hit) {
      const name =
        hit.id === "tue-dinner"
          ? "Dinner"
          : hit.id === "wed-sleep" || hit.id === "tue-sleep-am"
            ? "Sleep"
            : hit.title
      return { ok: false, text: `✗ This overlaps ${name}`, blockId: b.id }
    }
    const other = sorted.find((o) => o.id !== b.id && overlap(b.start, b.end, o.start, o.end) > 0)
    if (other) return { ok: false, text: "✗ Two study blocks overlap", blockId: b.id }
  }
  return { ok: true, text: `Still fits before ${dayClock(deadline)} ✓` }
}

// ---------- Describing a plan: what it keeps and what it changes ----------

export interface Chip {
  text: string
  tone: "neutral" | "amber" | "red"
  locked?: boolean
}

export function describePlan(
  plan: { blocks: Block[]; allowed: Lockable[]; extras?: Extras },
  unlocked: Record<Lockable, boolean>,
  sleepMin: number,
  costLocked: Lockable[] = [],
) {
  const fx = effectsOf(plan.blocks, plan.allowed)
  const lockedNow = (k: Lockable) => !unlocked[k] || costLocked.includes(k)
  const keeps: Chip[] = []
  const changes: Chip[] = []
  const dinnerKept = !fx.dinnerShifted
  const sleepKept = fx.sleepCut === 0 && fx.windUsed === 0
  const gymKept = !fx.gymMoved
  const rightUpTo = plan.blocks.some((b) => b.end === K.WIND) && fx.windUsed === 0
  if (dinnerKept && sleepKept && gymKept && !rightUpTo && !plan.extras?.continuation) {
    keeps.push({ text: "Everything", tone: "neutral", locked: true })
  } else {
    if (dinnerKept) keeps.push({ text: "Dinner", tone: "neutral", locked: !unlocked.dinner })
    if (sleepKept) keeps.push({ text: "Sleep", tone: "neutral", locked: !unlocked.sleep })
    if (gymKept) keeps.push({ text: "Gym", tone: "neutral", locked: !unlocked.gym })
  }
  const unlockedNote = (k: Lockable) => (lockedNow(k) ? "" : " · you unlocked it")
  const tone = (k: Lockable): Chip["tone"] => (lockedNow(k) ? "amber" : "neutral")
  if (plan.extras?.continuation) {
    const b = plan.blocks[0]
    changes.push({ text: `Your study block runs to ${clock(b.end)}`, tone: "neutral" })
    changes.push({ text: "You still leave for dinner at 6:15", tone: "neutral" })
  }
  if (fx.dinnerShifted) {
    changes.push({ text: `Dinner moves to 7:30–9:30 pm${unlockedNote("dinner")}`, tone: tone("dinner") })
    changes.push({ text: "I’ll draft a note to Priya and Jonah", tone: "neutral" })
  }
  if (fx.windUsed > 0)
    changes.push({
      text:
        fx.windUsed >= 45
          ? `No wind-down; harder to fall asleep${unlockedNote("winddown")}`
          : `Wind-down cut to ${45 - fx.windUsed} min${unlockedNote("winddown")}`,
      tone: tone("winddown"),
    })
  if (fx.sleepCut > 0) {
    const left = 7 * 60 - fx.sleepCut
    changes.push({
      text: `Sleep ${dur(left)}, below your ${dur(sleepMin)} minimum`,
      tone: left < sleepMin ? "red" : tone("sleep"),
    })
  }
  if (fx.gymMoved)
    changes.push({ text: `Gym moves to Thu 7:00 am${unlockedNote("gym")}`, tone: tone("gym") })
  if (rightUpTo) changes.push({ text: "You work right up to your wind-down", tone: "neutral" })
  const pre = plan.blocks.find((b) => dayOf(b.start) === 1 && b.end <= K.TRAVEL + (fx.dinnerShifted ? K.SHIFT : 0) && b.end > t(1, 17))
  const evening = plan.blocks.filter((b) => b.start >= K.HOME && dayOf(b.start) === 1)
  if (pre && evening.length && !plan.extras?.continuation && !fx.dinnerShifted) {
    const gap = K.TRAVEL - pre.end
    if (gap === 0) changes.push({ text: "You leave for dinner right after", tone: "neutral" })
    else if (gap > 0 && gap <= 30) changes.push({ text: "A short gap before dinner", tone: "neutral" })
  }
  if (evening.length && !rightUpTo && fx.windUsed === 0) {
    const end = Math.max(...evening.map((b) => b.end))
    changes.push({ text: `Done by ${clock(end)}`, tone: "neutral" })
  }
  const wedDay = plan.blocks.filter((b) => b.start >= t(2, 8))
  if (wedDay.length) changes.push({ text: "Uses tomorrow’s gaps before the new deadline", tone: "neutral" })
  if (plan.extras?.submitAsIs)
    changes.push({ text: "You submit what you have, marked “submitted as is”", tone: "neutral" })
  if (plan.extras?.extension)
    changes.push({ text: "Extension request to Alex Rivera", tone: "neutral" })
  return { keeps, changes, fx }
}

function sortOptions(options: OptionPlan[], ctx: PlanCtx) {
  const score = (o: OptionPlan) => {
    const { changes } = describePlan(o, ctx.unlocked, ctx.sleepMin)
    const red = changes.filter((c) => c.tone === "red").length
    const amber = changes.filter((c) => c.tone === "amber").length
    const fx = effectsOf(o.blocks, o.allowed)
    const moves = [fx.gymMoved, fx.dinnerShifted, fx.windUsed > 0, fx.sleepCut > 0].filter(Boolean).length
    return red * 1000 + amber * 100 + moves * 10
  }
  return options
    .map((o, i) => ({ o, i, s: score(o) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map(({ o }) => o)
}

/** Block-by-block list of what a plan changes, for Plan set and History. */
export function changeList(plan: { blocks: Block[]; allowed: Lockable[]; extras?: Extras }, sleepMin: number) {
  const fx = effectsOf(plan.blocks, plan.allowed)
  const rows: { icon: "add" | "move" | "warn" | "note"; title: string; detail: string; tone: "blue" | "amber" | "red" | "neutral" }[] = []
  for (const b of [...plan.blocks].sort((a, c) => a.start - c.start)) {
    rows.push({
      icon: "add",
      title: plan.extras?.continuation ? "Study block extended" : "Study block added",
      detail: `${dayRange(b.start, b.end)} · ${dur(b.end - b.start)}`,
      tone: "blue",
    })
  }
  if (fx.dinnerShifted) {
    rows.push({ icon: "move", title: "Dinner with friends moved", detail: "Tue 7:00 → 7:30 pm (now 7:30–9:30 pm)", tone: "amber" })
    rows.push({ icon: "move", title: "Travel moves with it", detail: "Leave at 7:00 pm · home by 9:45 pm", tone: "neutral" })
  }
  if (fx.gymMoved) rows.push({ icon: "move", title: "Gym moved", detail: "Wed 7:00 am → Thu 7:00 am", tone: "amber" })
  if (fx.windUsed > 0)
    rows.push({ icon: "warn", title: "Wind-down used for study", detail: fx.windUsed >= 45 ? "No wind-down tonight" : `Wind-down is ${45 - fx.windUsed} min tonight`, tone: "amber" })
  if (fx.sleepCut > 0) {
    const left = 7 * 60 - fx.sleepCut
    rows.push({ icon: "warn", title: "Sleep shortened", detail: `${dur(left)} tonight, below your ${dur(sleepMin)} minimum`, tone: left < sleepMin ? "red" : "amber" })
  }
  if (plan.extras?.extension) rows.push({ icon: "note", title: "Extension request sent", detail: "To Alex Rivera, Stats 203 TA", tone: "neutral" })
  if (plan.extras?.submitAsIs) rows.push({ icon: "note", title: "Reminder added", detail: "Wed 8:45 am · submit what you have, marked “submitted as is”", tone: "neutral" })
  return rows
}

// ---------- History (last week) and Insights ----------

export interface PastPlan {
  id: string
  date: string
  name: string
  course: string
  added: number
  kept: string
  rows: { title: string; detail: string; tone: "blue" | "amber" | "red" | "neutral" }[]
}

export const pastPlans: PastPlan[] = [
  {
    id: "past-thu",
    date: "Thu Nov 5",
    name: "After dinner",
    course: "Stats 203 Reading response",
    added: 60,
    kept: "Dinner kept",
    rows: [{ title: "Study block added", detail: "Thu 9:15–10:15 pm · 1 h", tone: "blue" }],
  },
  {
    id: "past-wed",
    date: "Wed Nov 4",
    name: "Late push",
    course: "Stats 203 Assignment 3",
    added: 90,
    kept: "Gym kept",
    rows: [
      { title: "Study block added", detail: "Wed 10:30 pm–12:00 am · 1 h 30 m", tone: "blue" },
      { title: "Wind-down used for study", detail: "No wind-down that night", tone: "amber" },
      { title: "Sleep shortened", detail: "6 h 30 m, below your 7 h minimum", tone: "red" },
    ],
  },
  {
    id: "past-mon",
    date: "Mon Nov 2",
    name: "Split it",
    course: "Design 213 Milestone 2",
    added: 90,
    kept: "Dinner kept",
    rows: [
      { title: "Study block added", detail: "Mon 5:00–5:45 pm · 45 min", tone: "blue" },
      { title: "Study block added", detail: "Mon 9:00–9:45 pm · 45 min", tone: "blue" },
    ],
  },
]

export const lastWeek = {
  label: "Nov 2–8",
  eveningsProtected: { kept: 4, of: 5, missed: "Wed Nov 4 (Late push)" },
  sleepUnder: [
    { night: "Wed Nov 4", hours: "6 h 30 m", why: "Late push for Stats 203 Assignment 3" },
    { night: "Sat Nov 7", hours: "6 h 40 m", why: "Late night out" },
  ],
  overruns: [
    { course: "Stats 203", count: 2 },
    { course: "Design 213", count: 1 },
  ],
  averageOverrun: 80,
}

// ---------- Overload alert (Thursday) ----------

export interface SpreadOption {
  id: string
  name: string
  moves: { eventId: string; start: number; end: number }[]
  keeps: string[]
  changes: string[]
}

export const spreadOptions: SpreadOption[] = [
  {
    id: "m3-fri",
    name: "Move Milestone 3 to Friday",
    moves: [{ eventId: "thu-m3", start: t(4, 16), end: t(4, 18, 30) }],
    keeps: ["Team sync", "Family call", "Dinner with Priya"],
    changes: ["Thu gets 2 h 30 m back", "Fri: done by 6:30 pm, before dinner with Priya"],
  },
  {
    id: "spread",
    name: "Spread it out",
    moves: [
      { eventId: "thu-rr", start: t(2, 17, 30), end: t(2, 18, 30) },
      { eventId: "thu-m3", start: t(6, 10), end: t(6, 12, 30) },
    ],
    keeps: ["Everything"],
    changes: ["Reading response moves to Wed 5:30 pm", "Milestone 3 moves to Sun 10:00 am"],
  },
  {
    id: "a5-wed",
    name: "Assignment 5 on Wednesday evening",
    moves: [{ eventId: "thu-a5", start: t(2, 20), end: t(2, 22) }],
    keeps: ["Team sync", "Family call", "Wind-down"],
    changes: ["Thu morning frees up", "Wed: work until 10:00 pm"],
  },
]
