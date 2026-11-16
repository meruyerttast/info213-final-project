// Fictional data for the Chat Calendar Assistant.
// Every name, message and event is invented. The fixed "now" is Tue Nov 10, 2026, 2:35 pm.

export type ChatId = "study" | "bot" | "priya" | "team" | "mom"
export type Color = "blue" | "green" | "violet" | "amber" | "teal" | "slate" | "rose"
export type Tone = "chat" | "screenshot" | "email" | "bcourses" | "calendar"

// Time model: "at" = minutes since Mon Nov 9, 2026, 00:00. Tue = 1440 + minutes.
export const DAY = 1440
export const NOW_AT = DAY + 14 * 60 + 35 // Tue 2:35 pm
export const UNLOCK_AT = DAY + 14 * 60 // notifications newer than 2:00 pm show on the lock screen
export const TODAY = 10 // Nov 10

export type Person = {
  name: string
  color: string // sender-name color (AA on white)
  avatar: [string, string] // gradient
}

export const people: Record<string, Person> = {
  sam: { name: "Sam", color: "#c2410c", avatar: ["#fdba74", "#ea580c"] },
  diego: { name: "Diego", color: "#15803d", avatar: ["#86efac", "#16a34a"] },
  hana: { name: "Hana", color: "#be185d", avatar: ["#f9a8d4", "#db2777"] },
  kai: { name: "Kai", color: "#1d4ed8", avatar: ["#93c5fd", "#2563eb"] },
  lena: { name: "Lena", color: "#6d28d9", avatar: ["#c4b5fd", "#7c3aed"] },
  ravi: { name: "Ravi", color: "#0f766e", avatar: ["#5eead4", "#0d9488"] },
  priya: { name: "Priya", color: "#be185d", avatar: ["#fda4af", "#e11d48"] },
  mom: { name: "Mom", color: "#15803d", avatar: ["#bef264", "#65a30d"] },
  me: { name: "Maya", color: "#1d4ed8", avatar: ["#93c5fd", "#1d4ed8"] },
}

export type ChatMeta = {
  name: string
  kind: "group" | "dm" | "bot"
  subtitle: string
  avatarText?: string
  avatar: [string, string]
}

export const chatMeta: Record<ChatId, ChatMeta> = {
  bot: {
    name: "Calendar Assistant",
    kind: "bot",
    subtitle: "bot",
    avatar: ["#60a5fa", "#1d4ed8"],
  },
  study: {
    name: "Stats 203 study group",
    kind: "group",
    subtitle: "4 members",
    avatarText: "203",
    avatar: ["#c4b5fd", "#7c3aed"],
  },
  priya: {
    name: "Priya",
    kind: "dm",
    subtitle: "last seen recently",
    avatarText: "P",
    avatar: people.priya.avatar,
  },
  team: {
    name: "Design 213 team",
    kind: "group",
    subtitle: "4 members",
    avatarText: "213",
    avatar: ["#fcd34d", "#d97706"],
  },
  mom: {
    name: "Mom",
    kind: "dm",
    subtitle: "last seen recently",
    avatarText: "M",
    avatar: people.mom.avatar,
  },
}

export type Msg = {
  id: string
  from: string // a key of `people`, or "me"
  text?: string
  at: number
  image?: "a5"
  fwd?: { name: string; time: string }
  replyTo?: { name: string; text: string }
}

// The four study-group messages from spec §2. The 2:31 correction is added by the store,
// so the moderator can choose "already in the chat" or "arrives 30 s after opening".
export const CORRECTION_TEXT = "actually 4:30, sorry! got us room 405 at the library"
export const CORRECTION_AT = DAY + 14 * 60 + 31

export const studyBase: Msg[] = [
  {
    id: "h602",
    from: "hana",
    text: "reminder: wed 4pm library 4th floor, bring A4 questions",
    at: 18 * 60 + 2,
  },
  {
    id: "s214",
    from: "sam",
    text: "hey all, moving our session to thurs at 4, same length. room tbd still",
    at: DAY + 14 * 60 + 14,
  },
  { id: "d216", from: "diego", text: "works for me 👍", at: DAY + 14 * 60 + 16 },
]

export const otherChats: Record<"priya" | "team" | "mom", Msg[]> = {
  priya: [
    { id: "p1", from: "me", text: "still on for dinner tmrw at 7?", at: 21 * 60 + 14 },
    { id: "p2", from: "priya", text: "yes!! jonah's coming too", at: 21 * 60 + 20 },
    { id: "p152", from: "priya", text: "did you see this??", image: "a5", at: DAY + 13 * 60 + 52 },
  ],
  team: [
    { id: "t1", from: "lena", text: "can someone book a room for thursday sync?", at: 10 * 60 + 5 },
    { id: "t2", from: "ravi", text: "done, Room 205, 6–7", at: 10 * 60 + 31 },
    { id: "t3", from: "me", text: "thanks Ravi", at: 10 * 60 + 40 },
    { id: "t1120", from: "kai", text: "deck draft is in the drive", at: DAY + 11 * 60 + 20 },
  ],
  mom: [
    { id: "m1", from: "mom", text: "How was your week?", at: -DAY + 19 * 60 + 2 },
    { id: "m2", from: "me", text: "busy but good! midterms soon", at: -DAY + 19 * 60 + 30 },
    { id: "m3", from: "mom", text: "call this weekend?", at: 20 * 60 + 10 },
  ],
}

// What the assistant says when other (non-plan) messages are forwarded to it.
export const cannedReplies: Record<string, string> = {
  p1: "This matches your calendar: **Dinner with friends**, Tue Nov 10, 7:00–9:00 pm. Nothing to change.",
  p2: "This matches your calendar: **Dinner with friends**, Tue Nov 10, 7:00–9:00 pm. Nothing to change.",
  t1: "This is about **Design 213 team sync**, Thu Nov 12, 6:00–7:00 pm. It doesn't change the time, so there's nothing to update.",
  t2: "This matches your calendar: **Design 213 team sync**, Thu Nov 12, 6:00–7:00 pm, Room 205. Nothing to change.",
  m3: "No day or time yet, so there's nothing to add. Forward me the plan once you pick a time.",
  d216: "Diego's message ('works for me 👍') has no date, time or place, so there's nothing to change.",
}

export type Email = {
  id: "careernight" | "careerfake" | "jordan" | "career"
  from: string
  org?: string
  address: string
  subject: string
  time: string
  preview: string
  body: string[]
}

export const emails: Record<Email["id"], Email> = {
  careernight: {
    id: "careernight",
    from: "University Career Center",
    address: "careercenter@university.example",
    subject: "Product Design Career Night: register by Mon Nov 16",
    time: "Today, 9:58 am",
    preview: "Thu Nov 19, 6:00–8:00 pm, Career Center Rm 110. Register by Mon Nov 16.",
    body: [
      "Hi Maya,",
      "Meet designers from Figma, Adobe, Notion, Airbnb and LinkedIn at Product Design Career Night, Thu Nov 19, 6:00–8:00 pm, Career Center Rm 110. Space is limited, so please register by Mon Nov 16. Bring 3 printed résumés.",
      "University Career Center",
    ],
  },
  careerfake: {
    id: "careerfake",
    from: "Career Center Events",
    address: "events@career-center-signup.example",
    subject: "Last spots: Product Design Career Night",
    time: "Today, 10:20 am",
    preview: "Reply with your résumé to confirm your spot for Thu Nov 19.",
    body: [
      "Hi Maya,",
      "Only a few spots are left for Product Design Career Night, Thu Nov 19, 6:00–8:00 pm. Reply with your résumé to confirm your spot today.",
      "Career Center Events",
    ],
  },
  jordan: {
    id: "jordan",
    from: "Jordan Lee",
    org: "Figma",
    address: "jordan.lee@figma.example",
    subject: "Quick coffee chat?",
    time: "Today, 12:05 pm",
    preview: "Would Thursday at 4 work for a quick coffee chat?",
    body: [
      "Hi Maya,",
      "Great meeting you at the info session last week. Would Thursday at 4 work for a quick coffee chat? Happy to come to campus.",
      "Best,\nJordan Lee\nUniversity Recruiting, Figma",
    ],
  },
  career: {
    id: "career",
    from: "University Career Center",
    address: "careercenter@university.example",
    subject: "Résumé review drop-ins this Friday",
    time: "Today, 9:40 am",
    preview: "Résumé review drop-ins, Fri Nov 13, 1–3 pm, Career Center.",
    body: [
      "Hi Maya,",
      "Résumé review drop-ins, Fri Nov 13, 1–3 pm, Career Center. No appointment needed. Bring a printed or digital copy.",
      "University Career Center",
    ],
  },
}

// ---------- Calendar ----------

export type Quote = {
  kind: Tone
  who: string
  time: string
  text: string
  chat?: ChatId
  msgId?: string
}

export type LogLine = { label: string; detail?: string; by: "other" | "you" | "assistant" }

export type CalEvent = {
  id: string
  title: string
  date: number // day of November 2026
  start: number // minutes from midnight
  end: number
  location?: string
  kind: "event" | "deadline" | "reminder"
  color: Color
  calendar: "Google Calendar" | "Course site"
  organizer?: string
  assistant?: { label: string; tone: Tone }
  edited?: boolean
  flag?: string
  remind?: string
  deleted?: boolean
  sources: Quote[]
  log: LogLine[]
}

const ev = (
  id: string,
  title: string,
  date: number,
  start: number,
  end: number,
  color: Color,
  extra: Partial<CalEvent> = {},
): CalEvent => ({
  id,
  title,
  date,
  start,
  end,
  color,
  kind: "event",
  calendar: "Google Calendar",
  sources: [],
  log: [],
  ...extra,
})

const h = (hour: number, min = 0) => hour * 60 + min
const due = (id: string, title: string, date: number, start: number, extra: Partial<CalEvent> = {}) =>
  ev(id, title, date, start, start, "amber", {
    kind: "deadline",
    calendar: "Course site",
    log: [{ label: "Added from the course site", by: "other" }],
    ...extra,
  })

export const STUDY_ORIGINAL = {
  date: 11,
  start: h(16),
  end: h(17),
  location: "Main Library, 4th floor",
}

export const initialEvents: CalEvent[] = [
  // Week of Nov 9
  ev("gym-9", "Gym", 9, h(7), h(8), "green", { location: "Campus gym" }),
  ev("info213-9", "Design 213", 9, h(14), h(15, 30), "violet", { location: "Room 210" }),
  ev("info203-10", "Stats 203", 10, h(11), h(12, 30), "blue", { location: "Room 202" }),
  ev("block-10", "Study block", 10, h(13, 30), h(17), "slate", { location: "Main Library" }),
  ev("dinner-10", "Dinner with friends", 10, h(19), h(21), "rose", { location: "Priya, Jonah" }),
  ev("gym-11", "Gym", 11, h(7), h(8), "green", { location: "Campus gym" }),
  due("a4", "Stats 203 Assignment 4", 11, h(9)),
  ev("gsr-11", "RA shift", 11, h(9, 30), h(12, 30), "slate", { location: "Room 107" }),
  ev("info213-11", "Design 213", 11, h(14), h(15, 30), "violet", { location: "Room 210" }),
  ev("study", "Stats 203 study group", 11, h(16), h(17), "teal", {
    location: STUDY_ORIGINAL.location,
    organizer: "Hana",
    sources: [
      {
        kind: "chat",
        who: "Hana",
        time: "Mon 6:02 pm",
        text: "reminder: wed 4pm library 4th floor, bring A4 questions",
        chat: "study",
        msgId: "h602",
      },
    ],
    log: [{ label: "Created by Hana · Mon 6:02 pm", detail: "Wed 4:00 pm", by: "other" }],
  }),
  ev("info203-12", "Stats 203", 12, h(11), h(12, 30), "blue", { location: "Room 202" }),
  ev("sync-12", "Design 213 team sync", 12, h(18), h(19), "violet", {
    location: "Room 205",
    organizer: "Kai",
  }),
  due("rr", "Stats 203 reading response", 12, h(23, 59)),
  ev("gym-13", "Gym", 13, h(7), h(8), "green", { location: "Campus gym" }),
  due("a5", "Stats 203 Assignment 5", 13, h(23, 59), {
    sources: [
      {
        kind: "bcourses",
        who: "Course site",
        time: "updated Oct 30",
        text: "Assignment 5 · Due Fri Nov 13, 11:59 pm",
      },
    ],
  }),
  ev("dinner-13", "Dinner with Priya", 13, h(19), h(21), "rose"),
  due("m3", "Design 213 Milestone 3", 15, h(23, 59)),
  // Week of Nov 16
  ev("gym-16", "Gym", 16, h(7), h(8), "green", { location: "Campus gym" }),
  ev("info213-16", "Design 213", 16, h(14), h(15, 30), "violet", { location: "Room 210" }),
  ev("info203-17", "Stats 203", 17, h(11), h(12, 30), "blue", { location: "Room 202" }),
  ev("gym-18", "Gym", 18, h(7), h(8), "green", { location: "Campus gym" }),
  ev("gsr-18", "RA shift", 18, h(9, 30), h(12, 30), "slate", { location: "Room 107" }),
  ev("info213-18", "Design 213", 18, h(14), h(15, 30), "violet", { location: "Room 210" }),
  ev("info203-19", "Stats 203", 19, h(11), h(12, 30), "blue", { location: "Room 202" }),
  ev("sync-19", "Design 213 team sync", 19, h(18), h(19), "violet", {
    location: "Room 205",
    organizer: "Kai",
  }),
  ev("gym-20", "Gym", 20, h(7), h(8), "green", { location: "Campus gym" }),
]

// The screenshot in Priya's chat (Task 2), as data for the source quote.
export const SCREENSHOT_QUOTE: Quote = {
  kind: "screenshot",
  who: "Alex Rivera (TA)",
  time: "Nov 9, 4:12 pm",
  text: "Assignment 5 deadline extended to Mon Nov 16, 9:00 am. Late days still apply after that.",
  chat: "priya",
  msgId: "p152",
}

export const BCOURSES_QUOTE: Quote = {
  kind: "bcourses",
  who: "Course site",
  time: "last updated Oct 30",
  text: "Stats 203 · Assignment 5 · Due Fri Nov 13, 11:59 pm",
}

export const BUILD_VERSION = "Chat v4.0 · Nov 16"

// ---------- Formatting ----------

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WD_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export const weekday = (date: number) => WD[(((date - 9) % 7) + 7) % 7]
export const weekdayLong = (date: number) => WD_LONG[(((date - 9) % 7) + 7) % 7]
export const dayLabel = (date: number) => `${weekday(date)} Nov ${date}`

export function fmt(min: number) {
  const m = ((min % DAY) + DAY) % DAY
  const hr = Math.floor(m / 60)
  const mm = m % 60
  const h12 = hr % 12 === 0 ? 12 : hr % 12
  return `${h12}:${String(mm).padStart(2, "0")} ${hr >= 12 ? "pm" : "am"}`
}

export function fmtRange(start: number, end: number) {
  const a = fmt(start)
  const b = fmt(end)
  const sameHalf = a.slice(-2) === b.slice(-2)
  return sameHalf ? `${a.slice(0, -3)}–${b}` : `${a}–${b}`
}

export const clock = (at: number) => fmt(at).slice(0, -3)

export function atDayLabel(at: number) {
  const d = Math.floor(at / DAY)
  if (d === 1) return "Today"
  return `${WD_LONG[(d + 7) % 7]}, November ${9 + d}`
}

export function atShort(at: number) {
  const d = Math.floor(at / DAY)
  if (d === 1) return fmt(at)
  return WD[(d + 7) % 7]
}

export function atStamp(at: number) {
  const d = Math.floor(at / DAY)
  if (d === 1) return fmt(at)
  return `${WD[(d + 7) % 7]} ${fmt(at)}`
}

export const durationLabel = (min: number) => {
  const hrs = Math.floor(min / 60)
  const rest = min % 60
  if (!hrs) return `${rest} min`
  if (!rest) return hrs === 1 ? "1 hr" : `${hrs} hr`
  return `${hrs} hr ${rest} min`
}
