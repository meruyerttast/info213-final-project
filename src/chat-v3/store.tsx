import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { logFootprint } from "@/shared/footprints"
import {
  BCOURSES_QUOTE,
  CORRECTION_AT,
  CORRECTION_TEXT,
  DAY,
  NOW_AT,
  SCREENSHOT_QUOTE,
  STUDY_ORIGINAL,
  cannedReplies,
  chatMeta,
  dayLabel,
  emails,
  fmt,
  fmtRange,
  initialEvents,
  otherChats,
  people,
  studyBase,
  weekday,
  type CalEvent,
  type ChatId,
  type Color,
  type Email,
  type LogLine,
  type Msg,
  type Quote,
  type Tone,
} from "./data"

// ---------- Types ----------

export type Screen =
  | { name: "lock" }
  | { name: "list" }
  | { name: "chat"; chat: ChatId; highlight?: string; unread?: number }
  | { name: "compare"; pid: string }
  | { name: "sources" }
  | { name: "calendar"; week?: 0 | 1; focus?: string }
  | { name: "event"; id: string }
  | { name: "history" }
  | { name: "settings" }
  | { name: "settings-find" }
  | { name: "settings-confirm" }
  | { name: "settings-cal" }
  | { name: "settings-privacy" }
  | { name: "settings-kept" }

export type Slot = { date: number; start: number; end: number; location: string }
export type Field = "day" | "time" | "room" | "other"
export type Note = { field: Field; text: string }

export type Proposal = {
  id: string
  kind: "move" | "new"
  eventId?: string
  title: string
  color: Color
  before?: Slot
  orig: Slot // what I suggested
  after: Slot // what will be saved (may be edited)
  sameLength: boolean
  roomMentioned: boolean
  basis: string
  notes: Note[]
  sources: Quote[]
  logLines: LogLine[]
  chip: { label: string; tone: Tone }
  newer?: { start: number; end: number; location: string; label: string }
  status: "open" | "applied" | "replaced" | "declined" | "not-this"
  entryId?: string
  study?: boolean
  practice?: boolean
  r4?: boolean
  register?: boolean // v3: register-for-me from a forwarded email
}

export type Entry = {
  id: string
  at: number
  title: string
  detail: string
  chip?: { label: string; tone: Tone }
  status: "confirmed" | "undo" | "setting"
  before?: Record<string, EventFields>
  undone?: boolean
  undoneAt?: number
  undoText?: string
  pid?: string
  a5?: boolean
  receipt?: string // v3: what the assistant actually did
}

export type Act =
  | { t: "review"; pid: string }
  | { t: "register"; pid: string }
  | { t: "send-reg"; pid: string }
  | { t: "apply"; pid: string; remind?: boolean }
  | { t: "decline"; pid: string; text?: string }
  | { t: "not-this"; pid: string }
  | { t: "use-newer"; pid: string }
  | { t: "keep"; pid: string }
  | { t: "candidate"; pid: string; target: string }
  | { t: "review-anyway"; pid: string }
  | { t: "pick-day"; date: number }
  | { t: "ambig-day"; date: number }
  | { t: "ambig-half"; pm: boolean }
  | { t: "digest-review" }
  | { t: "digest-ok" }
  | { t: "compare-sources" }
  | { t: "open-calendar" }
  | { t: "open-settings-find" }
  | { t: "onb-connect" }
  | { t: "onb-mode"; watch: boolean }
  | { t: "onb-done" }

export type Quick = {
  id: string
  label: string
  act: Act
  primary?: boolean
  nav?: boolean // navigation buttons stay active after use
  echo?: boolean // show the answer as my own message
  link?: boolean
}

export type BotItem =
  | { id: string; kind: "text"; from: "bot" | "me"; text: string; at: number; quick?: Quick[]; picked?: string; tag?: string }
  | { id: string; kind: "fwd"; at: number; chat: ChatId | "sample"; msg: Msg }
  | { id: string; kind: "fwd-email"; at: number; email: Email["id"] }
  | { id: string; kind: "card"; at: number; pid: string }
  | { id: string; kind: "done"; at: number; entryId: string; text: string }
  | { id: string; kind: "reading"; at: number }
  | { id: string; kind: "disagree"; at: number }
  | { id: string; kind: "draft"; at: number; text: string }
  | { id: string; kind: "sample"; at: number; used?: boolean }

export type Toast = {
  id: number
  text: string
  action?: { label: string; kind: "undo"; entryId: string } | { label: string; kind: "open"; chat: ChatId }
}
export type Banner = { id: number; chat: ChatId; title: string; text: string }
export type Config = { correction: "present" | "late"; watchAtStart: boolean }

type EventFields = Omit<CalEvent, "log" | "id">

export type State = {
  epoch: number
  config: Config
  clockStart: number
  nav: Screen[]
  chats: Record<"study" | "priya" | "team" | "mom", Msg[]>
  correction: { arrived: boolean; timerStarted: boolean }
  unread: Record<ChatId, number>
  bot: BotItem[]
  typing: number
  knows: string[]
  studyDay?: number
  proposals: Record<string, Proposal>
  order: string[]
  events: CalEvent[]
  history: Entry[]
  mode: { watch: boolean; chats: ChatId[]; since: Partial<Record<ChatId, number>> }
  autoApply: boolean
  a5: { status: "none" | "open" | "resolved"; choice?: number; entryId?: string }
  ambig: { date?: number; pm?: boolean }
  kept: Quote[]
  sync: { calendar: number; bcourses: number }
  toast: Toast | null
  banner: Banner | null
  onboarding: { active: boolean; step: number }
}

// ---------- Helpers ----------

let seq = 0
const uid = (prefix: string) => `${prefix}${++seq}`

export const nowAt = (s: Pick<State, "clockStart">) =>
  NOW_AT + Math.max(0, Math.floor((Date.now() - s.clockStart) / 60000))

export const top = (s: State) => s.nav[s.nav.length - 1]
export const isViewing = (s: State, chat: ChatId) => {
  const t = top(s)
  return t.name === "chat" && t.chat === chat
}
const inStack = (s: State, chat: ChatId) =>
  s.nav.some((screen) => screen.name === "chat" && screen.chat === chat)

export const studyEvent = (s: State) => s.events.find((e) => e.id === "study")!
export const corrAt = (s: State) =>
  s.chats.study.find((m) => m.id === "s231")?.at ?? CORRECTION_AT
export const watching = (s: State, chat: ChatId) =>
  s.mode.watch && s.mode.chats.includes(chat)

export const slotOf = (e: CalEvent): Slot => ({
  date: e.date,
  start: e.start,
  end: e.end,
  location: e.location ?? "",
})
export const sameSlot = (a: Slot, b: Slot) =>
  a.date === b.date && a.start === b.start && a.end === b.end && a.location === b.location
export const slotText = (x: Slot) =>
  `${dayLabel(x.date)}, ${fmtRange(x.start, x.end)}${x.location ? `, ${x.location}` : ""}`
export const shortRoom = (loc: string) =>
  /4th floor/i.test(loc) ? "4th floor" : loc
export const isCorrectStudy = (e: CalEvent) =>
  !e.deleted && e.date === 12 && e.start === 16 * 60 + 30 && e.end === 17 * 60 + 30 && /405/.test(e.location ?? "")

export function fields(e: CalEvent): EventFields {
  return {
    title: e.title,
    date: e.date,
    start: e.start,
    end: e.end,
    location: e.location,
    kind: e.kind,
    color: e.color,
    calendar: e.calendar,
    organizer: e.organizer,
    assistant: e.assistant,
    edited: e.edited,
    flag: e.flag,
    remind: e.remind,
    deleted: e.deleted,
    sources: e.sources,
  }
}

function q(label: string, act: Act, opts: Partial<Quick> = {}): Quick {
  return { id: uid("q"), label, act, ...opts }
}

function botText(text: string, at: number, quick?: Quick[], tag?: string): BotItem {
  return { id: uid("b"), kind: "text", from: "bot", text, at, quick, tag }
}

function meText(text: string, at: number): BotItem {
  return { id: uid("m"), kind: "text", from: "me", text, at }
}

export const strip = (text: string) => text.replace(/\*\*/g, "")

export function itemPreview(item: BotItem | undefined, s: State): string {
  if (!item) return ""
  switch (item.kind) {
    case "text":
    case "done":
      return strip(item.text)
    case "fwd":
      return item.msg.image ? "Forwarded photo" : `Forwarded: ${item.msg.text ?? ""}`
    case "fwd-email":
      return `Forwarded email: ${emails[item.email].subject}`
    case "card": {
      const p = s.proposals[item.pid]
      return p ? `Change to ${p.title}` : "Change card"
    }
    case "reading":
      return "Reading the image…"
    case "disagree":
      return "Two sources disagree about Assignment 5."
    case "draft":
      return "Draft for Alex Rivera (TA)"
    case "sample":
      return "Try it: forward me this sample message."
  }
}

const isBotAuthored = (item: BotItem) =>
  !(item.kind === "fwd" || item.kind === "fwd-email" || (item.kind === "text" && item.from === "me"))

function pushBot(s: State, items: BotItem[]): State {
  const authored = items.filter(isBotAuthored)
  let next: State = { ...s, bot: [...s.bot, ...items] }
  if (authored.length && !isViewing(s, "bot")) {
    next = { ...next, unread: { ...next.unread, bot: next.unread.bot + authored.length } }
    if (!inStack(s, "bot") && top(s).name !== "lock") {
      next.banner = {
        id: Date.now() + Math.random(),
        chat: "bot",
        title: "Calendar Assistant",
        text: itemPreview(authored[0], next),
      }
    }
  }
  return next
}

function addEntry(s: State, entry: Omit<Entry, "id">): [State, string] {
  const id = uid("e")
  // v3: every confirmed change says what the assistant actually did
  const receipt = entry.receipt ?? (entry.status === "confirmed" && entry.before ? "Updated your calendar. Nothing was sent to anyone." : undefined)
  return [{ ...s, history: [{ ...entry, receipt, id }, ...s.history] }, id]
}

function keep(s: State, quotes: Quote[]): State {
  const kept = [...s.kept]
  for (const quote of quotes) {
    if (!kept.some((k) => k.text === quote.text && k.time === quote.time)) kept.unshift(quote)
  }
  return { ...s, kept }
}

export function canUndo(s: State, entry: Entry) {
  if (!entry.before || entry.undone) return false
  const index = s.history.findIndex((e) => e.id === entry.id)
  const ids = Object.keys(entry.before)
  for (let i = 0; i < index; i++) {
    const newer = s.history[i]
    if (newer.before && !newer.undone && Object.keys(newer.before).some((id) => ids.includes(id))) {
      return false
    }
  }
  return true
}

export const entryUndone = (s: State, p?: Proposal) =>
  !!p?.entryId && !!s.history.find((e) => e.id === p.entryId)?.undone

function diffPhrase(a: Slot, b: Slot) {
  let time: string
  if (a.date === b.date) {
    const from = fmt(a.start)
    const to = fmt(b.start)
    time = `${weekday(a.date)} **${from.slice(-2) === to.slice(-2) ? from.slice(0, -3) : from} → ${to}**`
  } else {
    time = `**${weekday(a.date)} ${fmt(a.start)} → ${weekday(b.date)} ${fmt(b.start)}**`
  }
  return a.location !== b.location ? `${time}, ${b.location}` : time
}

// ---------- Initial state ----------

const STUDY_EXTRA: Msg = { id: "s231", from: "sam", text: CORRECTION_TEXT, at: CORRECTION_AT }

export const defaultConfig: Config = { correction: "present", watchAtStart: false }

export function initialState(config: Config, nav: Screen[], epoch: number): State {
  const present = config.correction === "present"
  return {
    epoch,
    config,
    clockStart: Date.now(),
    nav,
    chats: {
      study: present ? [...studyBase, STUDY_EXTRA] : [...studyBase],
      priya: [...otherChats.priya],
      team: [...otherChats.team],
      mom: [...otherChats.mom],
    },
    correction: { arrived: present, timerStarted: false },
    unread: { study: present ? 3 : 2, priya: 1, team: 0, mom: 0, bot: 0 },
    bot: [botText("Morning. Nothing needs you right now.", DAY + 8 * 60)],
    typing: 0,
    knows: [],
    proposals: {},
    order: [],
    events: initialEvents.map((e) => ({ ...e, sources: [...e.sources], log: [...e.log] })),
    history: [
      {
        id: "e0",
        at: 16 * 60 + 12,
        title: "Added Stats 203 reading response",
        detail: "Due Thu Nov 12, 11:59 pm · found on the course site",
        chip: { label: "Course site", tone: "bcourses" },
        status: "confirmed",
      },
    ],
    mode: config.watchAtStart
      ? { watch: true, chats: ["study"], since: { study: DAY + 14 * 60 + 33 } }
      : { watch: false, chats: [], since: {} },
    autoApply: false,
    a5: { status: "none" },
    ambig: {},
    kept: [
      {
        kind: "bcourses",
        who: "Course site",
        time: "Mon 4:12 pm",
        text: "Stats 203 · Reading response · Due Thu Nov 12, 11:59 pm",
      },
    ],
    sync: { calendar: NOW_AT - 1, bcourses: NOW_AT - 5 },
    toast: null,
    banner: null,
    onboarding: { active: false, step: 0 },
  }
}

// ---------- Task 1: the study-group change ----------

const S214_QUOTE: Quote = {
  kind: "chat",
  who: "Sam",
  time: "Tue 2:14 pm",
  text: studyBase[1].text!,
  chat: "study",
  msgId: "s214",
}

type Target = {
  basis: string
  slot: Slot
  sameLength: boolean
  roomMentioned: boolean
  notes: Note[]
  sources: Quote[]
  logLines: LogLine[]
  chip: { label: string; tone: Tone }
}

function studyTarget(s: State, use214: boolean, use231: boolean): Target {
  const t = fmt(corrAt(s))
  const ev = studyEvent(s)
  const q231: Quote = {
    kind: "chat",
    who: "Sam",
    time: `Tue ${t}`,
    text: CORRECTION_TEXT,
    chat: "study",
    msgId: "s231",
  }
  const moved: LogLine = { label: "Moved by Sam · Tue 2:14 pm", detail: "Thu 4:00 pm", by: "other" }
  if (use214 && use231) {
    return {
      basis: "214+231",
      slot: { date: 12, start: 16 * 60 + 30, end: 17 * 60 + 30, location: "Library 405" },
      sameLength: true,
      roomMentioned: true,
      notes: [
        { field: "day", text: "I read 'thurs' as Thu Nov 12, this week." },
        { field: "time", text: `Sam's ${t} message corrects 4 to 4:30. I used the later message.` },
        { field: "time", text: "I read '4:30' as 4:30 pm. 'Same length' means 1 hour, so it ends at 5:30 pm." },
        { field: "room", text: `Room 405, from Sam's ${t} message.` },
      ],
      sources: [S214_QUOTE, q231],
      logLines: [moved, { label: `Corrected by Sam · Tue ${t}`, detail: "Thu 4:30 pm", by: "other" }],
      chip: { label: `From chat · Sam · ${t}`, tone: "chat" },
    }
  }
  if (use214) {
    const loc = ev.location ?? STUDY_ORIGINAL.location
    return {
      basis: "214",
      slot: { date: 12, start: 16 * 60, end: 17 * 60, location: "Library · room still undecided" },
      sameLength: true,
      roomMentioned: true,
      notes: [
        { field: "day", text: "I read 'thurs' as Thu Nov 12, this week." },
        { field: "time", text: "I read '4' as 4:00 pm. 'Same length' means 1 hour, so it ends at 5:00 pm." },
        { field: "room", text: `Sam says the room is still undecided, so I didn't keep ${shortRoom(loc)}.` },
      ],
      sources: [S214_QUOTE],
      logLines: [moved],
      chip: { label: "From chat · Sam · 2:14 pm", tone: "chat" },
    }
  }
  const date = s.studyDay ?? 12
  return {
    basis: `231@${date}`,
    slot: { date, start: 16 * 60 + 30, end: 17 * 60 + 30, location: "Library 405" },
    sameLength: true,
    roomMentioned: true,
    notes: [
      { field: "day", text: `You picked ${dayLabel(date)}. Sam's message didn't say the day.` },
      { field: "time", text: "I read '4:30' as 4:30 pm. I kept the length at 1 hour, so it ends at 5:30 pm." },
      { field: "room", text: `Room 405, from Sam's ${t} message.` },
    ],
    sources: [q231],
    logLines: [
      { label: `Corrected by Sam · Tue ${t}`, detail: `${weekday(date)} 4:30 pm`, by: "other" },
      { label: "Day picked by you", detail: dayLabel(date), by: "you" },
    ],
    chip: { label: `From chat · Sam · ${t}`, tone: "chat" },
  }
}

function makeProposal(s: State, target: Target, extra: Partial<Proposal> = {}): Proposal {
  const ev = studyEvent(s)
  const notes = [...target.notes]
  if (s.autoApply) {
    notes.push({ field: "other", text: "I'm asking because Sam isn't the event's organizer (Hana is)." })
  }
  return {
    id: uid("p"),
    kind: "move",
    eventId: "study",
    title: ev.title,
    color: ev.color,
    before: slotOf(ev),
    orig: { ...target.slot },
    after: { ...target.slot },
    sameLength: target.sameLength,
    roomMentioned: target.roomMentioned,
    basis: target.basis,
    notes,
    sources: target.sources,
    logLines: target.logLines,
    chip: target.chip,
    status: "open",
    study: true,
    ...extra,
  }
}

function addProposal(s: State, p: Proposal): State {
  return { ...s, proposals: { ...s.proposals, [p.id]: p }, order: [...s.order, p.id] }
}

function setProposal(s: State, id: string, patch: Partial<Proposal>): State {
  return { ...s, proposals: { ...s.proposals, [id]: { ...s.proposals[id], ...patch } } }
}

function latestStudy(s: State): Proposal | undefined {
  for (let i = s.order.length - 1; i >= 0; i--) {
    const p = s.proposals[s.order[i]]
    if (p.study && p.status !== "replaced") return p
  }
  return undefined
}

type EvalMode = "forward" | "proactive" | "use-newer"

function evaluateStudy(s0: State, ids: string[], mode: EvalMode): State {
  const knows = new Set([...s0.knows, ...ids])
  let s: State = { ...s0, knows: [...knows] }
  const w = watching(s, "study")
  const f214 = knows.has("s214")
  const f231 = knows.has("s231")
  const use214 = f214 || (w && f231)
  const use231 = f231
  const t = fmt(corrAt(s))
  const now = nowAt(s)
  const proactive = mode === "proactive"
  const ev = studyEvent(s)

  if (!use214 && !use231) {
    if (ids.includes("h602")) {
      const original =
        ev.date === STUDY_ORIGINAL.date && ev.start === STUDY_ORIGINAL.start && !ev.deleted
      return pushBot(s, [
        botText(
          original
            ? "This matches your calendar: **Stats 203 study group**, Wed Nov 11, 4:00–5:00 pm, Main Library 4th floor. Nothing to change."
            : `This is an older message (Mon 6:02 pm). Your calendar already has a newer time: **${slotText(slotOf(ev))}**.`,
          now,
        ),
      ])
    }
    return pushBot(s, [botText(cannedReplies.d216, now)])
  }

  if (use231 && !use214 && s.studyDay === undefined) {
    return pushBot(s, [
      botText(
        `Sam's message says **4:30** and **room 405 at the library**, but not the day. It looks like a correction to an earlier message I haven't seen. Which day? Or forward me the earlier message.`,
        now,
        [11, 12, 13].map((date) => q(dayLabel(date), { t: "pick-day", date }, { echo: true })),
        "ask_day",
      ),
    ])
  }

  const target = studyTarget(s, use214, use231)
  const latest = latestStudy(s)

  if (latest && latest.basis === target.basis) {
    if (latest.status === "open") {
      return proactive
        ? s
        : pushBot(s, [
            botText("That's the same change I suggested above.", now, [
              q("Review change", { t: "review", pid: latest.id }, { nav: true, primary: true }),
            ]),
          ])
    }
    if (latest.status === "applied" && !entryUndone(s, latest) && !ev.deleted) {
      return proactive
        ? s
        : pushBot(s, [
            botText(
              `I already used this message. Your calendar has **Stats 203 study group** on ${slotText(slotOf(ev))}${ev.edited ? " (you edited it)" : ""}.`,
              now,
            ),
          ])
    }
  }

  if (sameSlot(slotOf(ev), target.slot) && !ev.deleted) {
    return proactive
      ? s
      : pushBot(s, [
          botText(
            `Already on your calendar: **Stats 203 study group** is ${slotText(slotOf(ev))}. Nothing to change.`,
            now,
          ),
        ])
  }

  const open = latest?.status === "open" ? latest : undefined
  if (open) {
    const p = makeProposal(s, target)
    s = setProposal(s, open.id, { status: "replaced" })
    s = addProposal(s, p)
    const intro =
      mode === "use-newer"
        ? `Using Sam's ${t} message: ${diffPhrase(open.after, p.after)}.`
        : proactive
          ? `Heads up: Sam just posted a newer message in Stats 203 study group. This corrects the change I suggested: ${diffPhrase(open.after, p.after)}.`
          : `This corrects the change I suggested: ${diffPhrase(open.after, p.after)}.`
    return pushBot(s, [botText(intro, now), { id: uid("c"), kind: "card", at: now, pid: p.id }])
  }

  if (latest?.status === "applied" && !entryUndone(s, latest) && !ev.deleted && sameSlot(slotOf(ev), latest.after)) {
    const p = makeProposal(s, target, { r4: true })
    s = addProposal(s, p)
    const intro =
      (proactive ? "Sam just posted a correction in Stats 203 study group. " : "") +
      `This updates the change I just made: ${diffPhrase(slotOf(ev), p.after)}.`
    return pushBot(s, [
      botText(intro, now, [
        q("Update", { t: "apply", pid: p.id }, { primary: true }),
        q("Ignore", { t: "decline", pid: p.id, text: `OK, I left it at ${slotText(slotOf(ev))}.` }, { echo: true }),
      ], "followup"),
    ])
  }

  const offer = w && s.correction.arrived && !use231 && use214 && !proactive
  const p = makeProposal(s, target)
  if (offer) {
    p.newer = {
      start: 16 * 60 + 30,
      end: 17 * 60 + 30,
      location: "Library 405",
      label: `Sam's ${t} message`,
    }
    p.notes = [
      ...p.notes,
      { field: "other", text: `Sam posted a newer message in this chat at ${t}: '${CORRECTION_TEXT}'.` },
    ]
  }
  s = addProposal(s, p)
  let intro: string
  if (use214 && use231) {
    intro = proactive
      ? `I noticed a change in **Stats 203 study group**, a chat you let me watch. I used Sam's latest message (${t}).`
      : !f214
        ? `I found a change, with a correction. I used Sam's later message (${t}). I also read his 2:14 pm message in this chat.`
        : `I found a change, with a correction. I used Sam's later message (${t}).`
  } else if (!use214) {
    intro = `OK, ${dayLabel(target.slot.date)}. Here's the change to **Stats 203 study group**.`
  } else {
    intro = "I found a change to **Stats 203 study group**."
  }
  const items: BotItem[] = [botText(intro, now), { id: uid("c"), kind: "card", at: now, pid: p.id }]
  if (offer) {
    const mins = corrAt(s) - (DAY + 14 * 60 + 14)
    items.push(
      botText(
        `Heads up: Sam posted a newer message in this chat ${mins} min later: 'actually 4:30, sorry!'. Use that instead?`,
        now,
        [
          q("Use 4:30", { t: "use-newer", pid: p.id }, { primary: true, echo: true }),
          q("Keep 4:00", { t: "keep", pid: p.id }, { echo: true }),
        ],
        "newer",
      ),
    )
  }
  return pushBot(s, items)
}

// The correction arrives in a chat I watch (late variant, or "send now").
function proactiveStudy(s: State): State {
  if (!watching(s, "study")) return s
  const latest = latestStudy(s)
  if (latest?.status === "open" && latest.basis === "214") {
    const now = nowAt(s)
    s = setProposal(s, latest.id, {
      newer: { start: 16 * 60 + 30, end: 17 * 60 + 30, location: "Library 405", label: `Sam's ${fmt(corrAt(s))} message` },
    })
    return pushBot(s, [
      botText(
        `Heads up: Sam just posted a newer message in Stats 203 study group: '${CORRECTION_TEXT}'. Use that instead?`,
        now,
        [
          q("Use 4:30", { t: "use-newer", pid: latest.id }, { primary: true, echo: true }),
          q("Keep 4:00", { t: "keep", pid: latest.id }, { echo: true }),
        ],
        "newer",
      ),
    ])
  }
  return evaluateStudy(s, ["s231"], "proactive")
}

function arriveCorrection(s: State): State {
  if (s.correction.arrived) return s
  const at = nowAt(s)
  const msg: Msg = { id: "s231", from: "sam", text: CORRECTION_TEXT, at }
  let next: State = {
    ...s,
    chats: { ...s.chats, study: [...s.chats.study, msg] },
    correction: { ...s.correction, arrived: true },
  }
  if (!isViewing(s, "study")) {
    next = { ...next, unread: { ...next.unread, study: next.unread.study + 1 } }
    if (!inStack(s, "study") && top(s).name !== "lock") {
      next.banner = {
        id: Date.now() + Math.random(),
        chat: "study",
        title: "Stats 203 study group",
        text: `Sam: ${CORRECTION_TEXT}`,
      }
    }
  }
  return next
}

// ---------- Apply, undo, delete ----------

function applyProposal(s: State, pid: string, remind = false): State {
  const p = s.proposals[pid]
  if (!p || p.status !== "open") return s
  const now = nowAt(s)
  if (p.practice) {
    s = setProposal(s, pid, { status: "applied" })
    return pushBot(s, [
      botText(
        `Updated ✅ Practice: Lab meeting → **${slotText(p.after)}**. This was only practice, so your real calendar didn't change.`,
        now,
        [q("Go to my chats", { t: "onb-done" }, { primary: true })],
      ),
    ])
  }
  const confirmed: LogLine = { label: `Confirmed by you · ${fmt(now)}`, by: "you" }
  const edits = editNotes(p)
  if (p.kind === "move") {
    const e = s.events.find((x) => x.id === p.eventId)
    if (!e) return s
    const before = fields(e)
    const lines = p.logLines.filter((l) => !e.log.some((x) => x.label === l.label))
    if (edits.length) {
      lines.push({
        label: "Edited by you",
        detail: `${weekday(p.after.date)} ${fmt(p.after.start)}, ${p.after.location}`,
        by: "you",
      })
    }
    const updated: CalEvent = {
      ...e,
      date: p.after.date,
      start: p.after.start,
      end: p.after.end,
      location: p.after.location,
      assistant: p.chip,
      edited: edits.length > 0,
      deleted: false,
      sources: p.sources,
      log: [...e.log, ...lines, confirmed],
    }
    s = { ...s, events: s.events.map((x) => (x.id === e.id ? updated : x)) }
    const beforeSlot: Slot = { date: before.date, start: before.start, end: before.end, location: before.location ?? "" }
    let entryId: string
    ;[s, entryId] = addEntry(s, {
      at: now,
      title: `${before.date === p.after.date ? "Changed" : "Moved"} ${e.title}`,
      detail: `${dayLabel(before.date)}, ${fmtRange(before.start, before.end)} → ${slotText(p.after)}`,
      chip: p.chip,
      status: "confirmed",
      receipt: "Updated your calendar. Nothing was sent to anyone.",
      before: { [e.id]: before },
      pid,
      undoText: `Change undone. Back on ${dayLabel(beforeSlot.date)}, ${fmtRange(beforeSlot.start, beforeSlot.end)}.`,
    })
    s = setProposal(s, pid, { status: "applied", entryId })
    s = keep(s, p.sources)
    return pushBot(s, [
      {
        id: uid("d"),
        kind: "done",
        at: now,
        entryId,
        text: `Updated ✅ ${e.title} → **${slotText(p.after)}**. Source saved.`,
      },
    ])
  }
  // A new event
  const id = uid("ev")
  const event: CalEvent = {
    id,
    title: p.title,
    date: p.after.date,
    start: p.after.start,
    end: p.after.end,
    location: p.after.location || undefined,
    kind: "event",
    color: p.color,
    calendar: "Google Calendar",
    assistant: p.chip,
    remind: remind ? `30 min before (${fmt(p.after.start - 30)})` : undefined,
    sources: p.sources,
    log: [...p.logLines, { label: `Added by you · ${fmt(now)}`, by: "you" }],
  }
  s = { ...s, events: [...s.events, event] }
  let entryId: string
  ;[s, entryId] = addEntry(s, {
    at: now,
    title: p.register ? `Registered for ${p.title}` : `Added ${p.title}`,
    detail: (p.register ? "Sign-up sent to the Career Center · " : "") + slotText(p.after) + (remind ? ` · reminder at ${fmt(p.after.start - 30)}` : ""),
    chip: p.chip,
    status: "confirmed",
    receipt: p.register
      ? "Sent your sign-up, added the event and set a reminder."
      : remind
        ? "Added the event and set a reminder. Nothing was sent to anyone."
        : "Added the event. Nothing was sent to anyone.",
    before: { [id]: { ...fields(event), deleted: true } },
    pid,
    undoText: p.register
      ? `Removed **${p.title}** from your calendar. Your sign-up was already sent; cancel it from the Career Center's confirmation email.`
      : `Removed **${p.title}** from your calendar.`,
  })
  s = setProposal(s, pid, { status: "applied", entryId })
  s = keep(s, p.sources)
  return pushBot(s, [
    {
      id: uid("d"),
      kind: "done",
      at: now,
      entryId,
      text: p.register
        ? `Registered ✅ for **${p.title}**. I sent your sign-up to the Career Center, added it to your calendar (${slotText(p.after)}) and set a reminder for ${fmt(p.after.start - 30)}.`
        : `Added ✅ **${p.title}**, ${slotText(p.after)}.${remind ? ` I'll remind you at ${fmt(p.after.start - 30)}.` : ""}`,
    },
  ])
}

export function editNotes(p: Proposal): Note[] {
  const out: Note[] = []
  if (p.after.date !== p.orig.date) out.push({ field: "day", text: `You changed the day to ${dayLabel(p.after.date)}.` })
  if (p.after.start !== p.orig.start || p.after.end !== p.orig.end) {
    out.push({
      field: "time",
      text:
        p.after.start !== p.orig.start
          ? `You changed the time to ${fmt(p.after.start)}.`
          : `You changed the end time to ${fmt(p.after.end)}.`,
    })
  }
  if (p.after.location !== p.orig.location) out.push({ field: "room", text: `You changed the room to ${p.after.location}.` })
  return out
}

export function editedFields(p: Proposal): Set<Field> {
  return new Set(editNotes(p).map((n) => n.field))
}

function undoEntry(s: State, entryId: string): State {
  const entry = s.history.find((e) => e.id === entryId)
  if (!entry || !canUndo(s, entry)) return s
  const now = nowAt(s)
  const before = entry.before!
  s = {
    ...s,
    events: s.events.map((e) => {
      const b = before[e.id]
      if (!b) return e
      return {
        ...e,
        ...b,
        log: [
          ...e.log,
          {
            label: `Undone by you · ${fmt(now)}`,
            detail: b.deleted ? "removed" : `back to ${weekday(b.date)} ${fmt(b.start)}`,
            by: "you" as const,
          },
        ],
      }
    }),
    history: s.history.map((e) => (e.id === entryId ? { ...e, undone: true, undoneAt: now } : e)),
  }
  ;[s] = addEntry(s, {
    at: now,
    title: `Undid: ${entry.title}`,
    detail: strip(entry.undoText ?? ""),
    status: "undo",
  })
  if (entry.a5) s = { ...s, a5: { status: "open" } }
  return pushBot(s, [
    botText(
      entry.undoText ?? "Change undone.",
      now,
      entry.a5 ? [q("Compare sources", { t: "compare-sources" }, { nav: true, primary: true })] : undefined,
    ),
  ])
}

function deleteEvent(s: State, id: string): [State, string] {
  const e = s.events.find((x) => x.id === id)
  if (!e) return [s, ""]
  const now = nowAt(s)
  s = {
    ...s,
    events: s.events.map((x) =>
      x.id === id ? { ...x, deleted: true, log: [...x.log, { label: `Deleted by you · ${fmt(now)}`, by: "you" as const }] } : x,
    ),
  }
  return addEntry(s, {
    at: now,
    title: `Deleted ${e.title}`,
    detail: e.kind === "deadline" ? `Was due ${dayLabel(e.date)}, ${fmt(e.start)}` : `Was ${slotText(slotOf(e))}`,
    chip: { label: "You", tone: "calendar" },
    status: "confirmed",
    before: { [id]: fields(e) },
    undoText: `Restored **${e.title}**, ${dayLabel(e.date)}, ${e.kind === "deadline" ? `due ${fmt(e.start)}` : fmtRange(e.start, e.end)}.`,
  })
}

// ---------- Task 2: screenshot and sources ----------

export const GSI_DRAFT =
  "Hi Alex, quick question about Stats 203 Assignment 5. The Nov 9 announcement says it's due Mon Nov 16, 9:00 am, but the course site still shows Fri Nov 13, 11:59 pm. Which date should we follow? Thanks, Maya"

function screenshotResult(s: State): State {
  const now = nowAt(s)
  s = { ...s, bot: s.bot.filter((b) => b.kind !== "reading") }
  const items: BotItem[] = [
    botText("This says **Stats 203 Assignment 5** is now due **Mon Nov 16, 9:00 am**.", now),
  ]
  if (s.a5.status === "resolved") {
    items.push(
      botText("You already chose what to do about Assignment 5. Want to look at the sources again?", now, [
        q("Compare sources", { t: "compare-sources" }, { nav: true, primary: true }),
      ]),
    )
  } else {
    items.push({ id: uid("s"), kind: "disagree", at: now })
    s = { ...s, a5: { status: "open" } }
  }
  s = keep(s, [SCREENSHOT_QUOTE])
  return pushBot(s, items)
}

function chooseSources(s: State, choice: number): State {
  if (s.a5.status === "resolved") return s
  const now = nowAt(s)
  const a5 = s.events.find((e) => e.id === "a5")!
  const before: Record<string, EventFields> = { a5: fields(a5) }
  const shotChip = { label: "From screenshot · Priya", tone: "screenshot" as Tone }
  let events = s.events
  let title = ""
  let detail = ""
  let chip = shotChip
  let text = ""
  const upsert = (event: CalEvent) => {
    const existing = events.find((e) => e.id === event.id)
    before[event.id] = existing ? fields(existing) : { ...fields(event), deleted: true }
    events = existing
      ? events.map((e) => (e.id === event.id ? { ...event, log: [...e.log, ...event.log] } : e))
      : [...events, event]
  }
  const setA5 = (patch: Partial<CalEvent>, lines: LogLine[]) => {
    events = events.map((e) => (e.id === "a5" ? { ...e, ...patch, log: [...e.log, ...lines] } : e))
  }
  if (choice === 1) {
    setA5(
      { date: 16, start: 9 * 60, end: 9 * 60, assistant: shotChip, flag: undefined, sources: [SCREENSHOT_QUOTE, BCOURSES_QUOTE] },
      [
        { label: "Extended by Alex Rivera (TA) · Nov 9, 4:12 pm", detail: "Mon 9:00 am", by: "other" },
        { label: `Confirmed by you · ${fmt(now)}`, by: "you" },
      ],
    )
    upsert({
      id: "a5-check",
      title: "Check the course site: Assignment 5 due date",
      date: 12,
      start: 9 * 60,
      end: 9 * 60 + 15,
      kind: "reminder",
      color: "amber",
      calendar: "Google Calendar",
      assistant: { label: "Reminder you asked for", tone: "screenshot" },
      sources: [SCREENSHOT_QUOTE],
      log: [{ label: `Added by you · ${fmt(now)}`, by: "you" }],
      deleted: false,
    })
    title = "Moved Stats 203 Assignment 5"
    detail = "Fri Nov 13, 11:59 pm → Mon Nov 16, 9:00 am · reminder Thu Nov 12, 9:00 am"
    text = "Updated ✅ Stats 203 Assignment 5 → due **Mon Nov 16, 9:00 am**. I'll remind you to check the course site on Thu Nov 12 at 9:00 am."
  } else if (choice === 2) {
    setA5({ flag: undefined }, [{ label: `You kept the course site date · ${fmt(now)}`, by: "you" }])
    title = "Kept the course site date for Assignment 5"
    detail = "Fri Nov 13, 11:59 pm · the screenshot said Mon Nov 16, 9:00 am"
    chip = { label: "Course site", tone: "bcourses" }
    text = "OK, keeping **Fri Nov 13, 11:59 pm** from the course site. Your calendar didn't change."
  } else if (choice === 3) {
    setA5({ flag: "Unconfirmed" }, [{ label: `Marked unconfirmed by you · ${fmt(now)}`, by: "you" }])
    upsert({
      id: "a5-gsi",
      title: "Stats 203 Assignment 5 (TA post)",
      date: 16,
      start: 9 * 60,
      end: 9 * 60,
      kind: "deadline",
      color: "amber",
      calendar: "Google Calendar",
      flag: "Unconfirmed",
      assistant: shotChip,
      sources: [SCREENSHOT_QUOTE],
      log: [{ label: `Added by you · ${fmt(now)}`, detail: "Mon 9:00 am", by: "you" }],
      deleted: false,
    })
    title = "Kept both dates for Assignment 5"
    detail = "Fri Nov 13, 11:59 pm and Mon Nov 16, 9:00 am, both marked unconfirmed"
    text =
      "Done. Both dates are on your calendar, marked unconfirmed: **Fri Nov 13, 11:59 pm** (course site) and **Mon Nov 16, 9:00 am** (TA post). I'll tell you when the course site changes."
  } else {
    setA5({ flag: "Checking with TA" }, [{ label: `Question to the TA drafted by you · ${fmt(now)}`, by: "you" }])
    title = "Drafted a question to the TA"
    detail = "Assignment 5 · calendar unchanged, marked “checking”"
    text = "Here's a draft for Alex Rivera (TA). I didn't send it. Your calendar still shows **Fri Nov 13, 11:59 pm**, marked “checking”."
  }
  s = { ...s, events }
  let entryId: string
  ;[s, entryId] = addEntry(s, {
    at: now,
    title,
    detail,
    chip,
    status: "confirmed",
    before,
    a5: true,
    undoText: "Undone. Assignment 5 is back to **Fri Nov 13, 11:59 pm** (course site), with nothing marked. Decide again when you're ready.",
  })
  s = { ...s, a5: { status: "resolved", choice, entryId } }
  const items: BotItem[] = []
  if (choice === 4) items.push({ id: uid("g"), kind: "draft", at: now, text: GSI_DRAFT })
  items.push({ id: uid("d"), kind: "done", at: now, entryId, text })
  return pushBot(s, items)
}

// ---------- Other bot flows ----------

function newProposal(s: State, p: Omit<Proposal, "id" | "status" | "orig" | "sameLength" | "roomMentioned" | "notes" | "basis" | "kind"> & Partial<Proposal>): [State, Proposal] {
  const full: Proposal = {
    id: uid("p"),
    kind: "new",
    status: "open",
    orig: { ...p.after },
    sameLength: false,
    roomMentioned: true,
    notes: [],
    basis: "new",
    ...p,
  }
  return [addProposal(s, full), full]
}

function respondEmail(s: State, id: Email["id"]): State {
  const now = nowAt(s)
  if (id === "careernight") {
    const quote: Quote = {
      kind: "email",
      who: "Career Center",
      time: "Today 9:58 am",
      text: "Product Design Career Night, Thu Nov 19, 6:00–8:00 pm, Career Center Rm 110. Register by Mon Nov 16.",
    }
    let p: Proposal
    ;[s, p] = newProposal(s, {
      title: "Product Design Career Night",
      color: "violet",
      after: { date: 19, start: 18 * 60, end: 20 * 60, location: "Career Center Rm 110" },
      sources: [quote],
      logLines: [{ label: "Found in a Career Center email · Today 9:58 am", by: "other" }],
      chip: { label: "From email · Career Center", tone: "email" },
    })
    s = keep(s, [quote])
    return pushBot(s, [
      botText("**Product Design Career Night**, Thu Nov 19, 6:00–8:00 pm, Career Center Rm 110.\nIt needs a sign-up by **Mon Nov 16**. Want me to register you?", now, [
        q("Register me", { t: "register", pid: p.id }, { primary: true }),
        q("Just add to calendar", { t: "apply", pid: p.id }),
        q("No", { t: "decline", pid: p.id, text: "OK, I didn't add it." }, { echo: true }),
      ], "register_offer"),
    ])
  }
  if (id === "jordan") {
    s = { ...s, ambig: {} }
    s = keep(s, [{ kind: "email", who: "Jordan Lee (Figma)", time: "Today 12:05 pm", text: "Would Thursday at 4 work for a quick coffee chat?" }])
    return pushBot(s, [
      botText("Jordan asks about **Thursday at 4**. Which Thursday?", now, [
        q("Nov 12", { t: "ambig-day", date: 12 }, { echo: true }),
        q("Nov 19", { t: "ambig-day", date: 19 }, { echo: true }),
      ], "ambiguous"),
    ])
  }
  const quote: Quote = {
    kind: "email",
    who: "Career Center",
    time: "Today 9:40 am",
    text: "Résumé review drop-ins, Fri Nov 13, 1–3 pm, Career Center.",
  }
  let p: Proposal
  ;[s, p] = newProposal(s, {
    title: "Résumé review drop-ins",
    color: "blue",
    after: { date: 13, start: 13 * 60, end: 15 * 60, location: "Career Center" },
    sources: [quote],
    logLines: [{ label: "Found in a Career Center email · Today 9:40 am", by: "other" }],
    chip: { label: "From email · Career Center", tone: "email" },
  })
  s = keep(s, [quote])
  return pushBot(s, [
    botText("Add **Résumé review drop-ins**, Fri Nov 13, 1:00–3:00 pm, Career Center?", now, [
      q("Add", { t: "apply", pid: p.id }, { primary: true }),
      q("Add + remind me 30 min before", { t: "apply", pid: p.id, remind: true }),
      q("No", { t: "decline", pid: p.id, text: "OK, I didn't add it." }, { echo: true }),
    ], "new_event"),
  ])
}

export function overlaps(s: State, slot: Slot, exclude?: string) {
  return s.events.filter(
    (e) =>
      !e.deleted &&
      e.kind === "event" &&
      e.id !== exclude &&
      e.date === slot.date &&
      e.start < slot.end &&
      slot.start < e.end,
  )
}

function ambigHalf(s: State, pm: boolean): State {
  const now = nowAt(s)
  const date = s.ambig.date ?? 12
  const start = pm ? 16 * 60 : 4 * 60
  const slot: Slot = { date, start, end: start + 60, location: "" }
  s = { ...s, ambig: { date, pm } }
  const items: BotItem[] = []
  const clash = overlaps(s, slot)
  if (clash.length) {
    const c = clash[0]
    items.push(botText(`Heads up: that overlaps your **${c.title}** (${fmtRange(c.start, c.end)}).`, now))
  }
  let p: Proposal
  ;[s, p] = newProposal(s, {
    title: "Coffee chat with Jordan (Figma)",
    color: "blue",
    after: slot,
    sources: [{ kind: "email", who: "Jordan Lee (Figma)", time: "Today 12:05 pm", text: "Would Thursday at 4 work for a quick coffee chat?" }],
    logLines: [
      { label: "Asked by Jordan Lee · Today 12:05 pm", detail: "Thursday at 4", by: "other" },
      { label: "Day and time picked by you", detail: `${weekday(date)} ${fmt(start)}`, by: "you" },
    ],
    chip: { label: "From email · Jordan Lee", tone: "email" },
  })
  items.push(
    botText(
      `Add **Coffee chat with Jordan (Figma)**, ${dayLabel(date)}, ${fmtRange(slot.start, slot.end)}? I assumed 1 hour. No place was mentioned.`,
      now,
      [
        q("Add", { t: "apply", pid: p.id }, { primary: true }),
        q("Not now", { t: "decline", pid: p.id, text: "OK, I didn't add it." }, { echo: true }),
      ],
    ),
  )
  return pushBot(s, items)
}

function digest(s: State): State {
  const at = DAY + 20 * 60
  const live = s.history.filter((e) => e.status === "confirmed" && e.before && !e.undone)
  const updated = live.filter((e) => /^(Moved|Changed)/.test(e.title)).length
  const added = live.filter((e) => /^Added/.test(e.title)).length
  const needs: string[] = []
  if (s.a5.status === "open" || s.a5.choice === 3 || s.a5.choice === 4) needs.push("Assignment 5's due date")
  Object.values(s.proposals)
    .filter((p) => p.status === "open" && !p.practice)
    .forEach((p) => needs.push(p.kind === "new" ? `adding ${p.title}` : `the change to ${p.title}`))
  const n = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`
  let text: string
  if (!updated && !added && !needs.length) {
    text = "Quiet day. I didn't change anything, and nothing needs you."
  } else {
    text = `Today I updated ${n(updated, "event")} and added ${added}. ${
      needs.length
        ? `${n(needs.length, "thing")} ${needs.length === 1 ? "needs" : "need"} you: ${needs.join(", ")}.`
        : "Nothing needs you."
    }`
  }
  return pushBot(s, [
    botText(text, at, [
      q("Review", { t: "digest-review" }, { primary: true, nav: true }),
      q("All good", { t: "digest-ok" }, { echo: true }),
    ], "digest"),
  ])
}

// ---------- Onboarding ----------

const PRACTICE_SAMPLE: Msg = {
  id: "sample",
  from: "sample",
  text: "practice: lab meeting moved to fri, same time",
  at: NOW_AT,
}

export const SAMPLE_MSG = PRACTICE_SAMPLE

function onboardingSample(s: State): State {
  const now = nowAt(s)
  let p: Proposal
  ;[s, p] = newProposal(s, {
    kind: "move",
    title: "Lab meeting",
    color: "teal",
    practice: true,
    before: { date: 12, start: 10 * 60, end: 11 * 60, location: "Room 110" },
    after: { date: 13, start: 10 * 60, end: 11 * 60, location: "Room 110" },
    orig: { date: 13, start: 10 * 60, end: 11 * 60, location: "Room 110" },
    sameLength: true,
    roomMentioned: false,
    basis: "practice",
    notes: [
      { field: "day", text: "I read 'fri' as Fri Nov 13." },
      { field: "time", text: "'Same time' means 10:00–11:00 am." },
      { field: "room", text: "Room not mentioned, keeping Room 110." },
    ],
    sources: [{ kind: "chat", who: "Sample chat", time: "now", text: PRACTICE_SAMPLE.text! }],
    logLines: [],
    chip: { label: "From chat · Sample", tone: "chat" },
  })
  return pushBot(s, [
    botText("Practice: I found a change to **Lab meeting**.", now),
    { id: uid("c"), kind: "card", at: now, pid: p.id },
  ])
}

// ---------- Store ----------

type Store = {
  s: State
  go: (screen: Screen) => void
  back: () => void
  setNav: (nav: Screen[]) => void
  replaceTop: (screen: Screen) => void
  sendText: (chat: ChatId, text: string, replyTo?: Msg) => void
  forward: (from: ChatId, msgs: Msg[], target: ChatId, how: "forward" | "shortcut" | "select") => void
  forwardEmail: (id: Email["id"]) => void
  forwardSample: () => void
  act: (itemId: string, quick: Quick) => void
  apply: (pid: string, via: string, remind?: boolean) => void
  notThis: (pid: string) => void
  reopen: (pid: string) => void
  editProposal: (pid: string, slot: Slot) => void
  undo: (entryId: string, where: string) => void
  deleteEvent: (id: string) => void
  chooseSources: (choice: number, seconds: number) => void
  setWatch: (watch: boolean) => void
  setWatchChat: (chat: ChatId, on: boolean) => void
  setAutoApply: (on: boolean) => void
  syncNow: () => void
  deleteHistory: () => void
  showToast: (text: string, action?: Toast["action"]) => void
  clearToast: (id: number) => void
  clearBanner: (id: number) => void
  reset: (nav?: Screen[], config?: Config) => void
  jump: (target: Jump) => void
  setConfig: (config: Config) => void
  sendCorrectionNow: () => void
  triggerEmail: (id: Email["id"]) => void
  triggerDigest: () => void
  startOnboarding: () => void
  onbStart: () => void
  onbConnected: () => void
  onbMode: (watch: boolean, chats: ChatId[]) => void
  onbDone: () => void
  reoffer: (pid: string) => void
  botHelp: () => void
}

export type Jump = "t1" | "t2" | "t3" | "t4" | "list" | "settings" | "history" | "onboarding"

const StoreContext = createContext<Store | null>(null)

function navFromHash(): Screen[] {
  const hash = window.location.hash
  if (hash === "#lock") return [{ name: "lock" }]
  if (hash === "#priya") return [{ name: "list" }, { name: "chat", chat: "priya" }]
  if (hash === "#study") return [{ name: "list" }, { name: "chat", chat: "study" }]
  if (hash === "#bot" || hash === "#onboarding") return [{ name: "list" }, { name: "chat", chat: "bot" }]
  if (hash === "#settings") return [{ name: "list" }, { name: "chat", chat: "bot" }, { name: "settings" }]
  if (hash === "#history") return [{ name: "list" }, { name: "chat", chat: "bot" }, { name: "history" }]
  if (hash === "#calendar") return [{ name: "list" }, { name: "chat", chat: "bot" }, { name: "calendar" }]
  return [{ name: "list" }]
}

function withOnboarding(s: State): State {
  return {
    ...s,
    bot: [],
    unread: { ...s.unread, bot: 0 },
    knows: [],
    mode: { watch: false, chats: [], since: {} },
    onboarding: { active: true, step: 0 },
  }
}

function afterT1(s: State): State {
  const now = nowAt(s)
  const msgs = s.chats.study.filter((m) => m.id === "s214" || m.id === "s231")
  s = {
    ...s,
    unread: { ...s.unread, study: 0 },
    bot: [...s.bot, ...msgs.map((msg) => ({ id: uid("f"), kind: "fwd" as const, at: now, chat: "study" as ChatId, msg }))],
  }
  s = evaluateStudy(s, msgs.map((m) => m.id), "forward")
  const p = latestStudy(s)
  if (p) s = applyProposal(s, p.id)
  return { ...s, unread: { ...s.unread, bot: 0 }, banner: null }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const epochRef = useRef(1)
  const [s, setS] = useState<State>(() => {
    const base = initialState(defaultConfig, navFromHash(), 1)
    return window.location.hash === "#onboarding" ? withOnboarding(base) : base
  })
  const ref = useRef(s)
  ref.current = s
  const timers = useRef<number[]>([])

  const schedule = (fn: (p: State) => State, ms: number) => {
    const ep = epochRef.current
    const id = window.setTimeout(() => {
      setS((p) => (p.epoch === ep ? fn(p) : p))
    }, ms)
    timers.current.push(id)
  }

  const later = (fn: () => void, ms: number) => {
    const ep = epochRef.current
    const id = window.setTimeout(() => {
      if (epochRef.current === ep) fn()
    }, ms)
    timers.current.push(id)
  }

  // Bot replies come after a short "typing…" pause.
  const reply = (fn: (p: State) => State, ms = 950) => {
    setS((p) => ({ ...p, typing: p.typing + 1 }))
    schedule((p) => fn({ ...p, typing: Math.max(0, p.typing - 1) }), ms)
  }

  const deliverCorrection = () => {
    if (ref.current.correction.arrived) return
    setS(arriveCorrection)
    logFootprint("correction_arrived", {})
    schedule(proactiveStudy, 1600)
  }

  const onEnter = (screen: Screen, from: string) => {
    if (screen.name === "chat") {
      logFootprint("chat_open", { chat: screen.chat, from })
      const cur = ref.current
      if (
        screen.chat === "study" &&
        cur.config.correction === "late" &&
        !cur.correction.arrived &&
        !cur.correction.timerStarted
      ) {
        setS((p) => ({ ...p, correction: { ...p.correction, timerStarted: true } }))
        later(deliverCorrection, 30000)
      }
    }
    if (screen.name === "calendar") logFootprint("calendar_open", { from })
    if (screen.name === "history") logFootprint("history_open", { from })
    if (screen.name === "compare") logFootprint("review_open", { pid: screen.pid })
  }

  // Opening a chat marks it read; the screen keeps the count so it can show an "unread" divider.
  const clearUnreadFor = (p: State, screen: Screen): State => {
    if (screen.name !== "chat") return p
    const count = p.unread[screen.chat]
    const nav = p.nav.map((x) => (x === screen && count ? { ...screen, unread: count } : x))
    return { ...p, nav, unread: { ...p.unread, [screen.chat]: 0 } }
  }

  const go = (screen: Screen) => {
    const from = top(ref.current).name
    setS((p) => clearUnreadFor({ ...p, nav: [...p.nav, screen], banner: screen.name === "chat" && p.banner?.chat === screen.chat ? null : p.banner }, screen))
    onEnter(screen, from)
  }

  const setNav = (nav: Screen[]) => {
    const from = top(ref.current).name
    setS((p) => clearUnreadFor({ ...p, nav }, nav[nav.length - 1]))
    onEnter(nav[nav.length - 1], from)
  }

  const replaceTop = (screen: Screen) => {
    setS((p) => clearUnreadFor({ ...p, nav: [...p.nav.slice(0, -1), screen] }, screen))
    onEnter(screen, "replace")
  }

  const back = () => {
    setS((p) => {
      if (p.nav.length <= 1) return { ...p, nav: [{ name: "list" }] }
      const nav = p.nav.slice(0, -1)
      return clearUnreadFor({ ...p, nav }, nav[nav.length - 1])
    })
  }

  const showToast = (text: string, action?: Toast["action"]) =>
    setS((p) => ({ ...p, toast: { id: Date.now() + Math.random(), text, action } }))

  const sendText = (chat: ChatId, text: string, replyTo?: Msg) => {
    const clean = text.trim()
    if (!clean) return
    if (chat === "bot") {
      setS((p) => ({ ...p, bot: [...p.bot, meText(clean, nowAt(p))] }))
      logFootprint("bot_typed", { length: clean.length })
      if (/^\/start\b/i.test(clean)) {
        reply((p) =>
          pushBot(p, [
            botText(
              "Hi Maya. Send me any message, email or screenshot about a plan, and I'll keep your calendar right. Nothing changes without your OK.",
              nowAt(p),
              [q("How I find changes", { t: "open-settings-find" }, { nav: true })],
            ),
          ]),
        )
      } else {
        reply((p) =>
          pushBot(p, [
            botText(
              "I work from forwarded messages. Forward me a message, email or screenshot about a plan, and I'll check it against your calendar.",
              nowAt(p),
            ),
          ]),
        )
      }
      return
    }
    setS((p) => ({
      ...p,
      chats: {
        ...p.chats,
        [chat]: [
          ...p.chats[chat as "study"],
          {
            id: uid("me"),
            from: "me",
            text: clean,
            at: nowAt(p),
            replyTo: replyTo ? { name: people[replyTo.from]?.name ?? "You", text: replyTo.text ?? "Photo" } : undefined,
          },
        ],
      },
    }))
  }

  const forward = (from: ChatId, msgs: Msg[], target: ChatId, how: "forward" | "shortcut" | "select") => {
    if (!msgs.length) return
    const sorted = [...msgs].sort((a, b) => a.at - b.at)
    const cur = ref.current
    const appliedStudy = Object.values(cur.proposals).some((p) => p.study && p.status === "applied")
    logFootprint("forward", {
      msgs: sorted.map((m) => m.id).join(","),
      count: sorted.length,
      target,
      how,
      from,
    })
    if (from === "study" && target === "bot" && appliedStudy) {
      logFootprint("followup_forward", { msgs: sorted.map((m) => m.id).join(",") })
    }
    if (target !== "bot") {
      setS((p) => {
        const now = nowAt(p)
        const copies: Msg[] = sorted.map((m) => ({
          id: uid("fw"),
          from: "me",
          text: m.text,
          image: m.image,
          at: now,
          fwd: { name: people[m.from]?.name ?? "You", time: fmt(m.at) },
        }))
        return { ...p, chats: { ...p.chats, [target]: [...p.chats[target as "study"], ...copies] } }
      })
      return
    }
    setS((p) => {
      const now = nowAt(p)
      const items: BotItem[] = sorted.map((msg) => ({ id: uid("f"), kind: "fwd", at: now, chat: from, msg }))
      return { ...p, bot: [...p.bot, ...items] }
    })
    if (how === "shortcut" || how === "select") {
      if (how === "shortcut") showToast("Sent to Calendar Assistant", { label: "Open", kind: "open", chat: "bot" })
    }
    const ids = sorted.map((m) => m.id)
    const hasPhoto = sorted.some((m) => m.image)
    if (hasPhoto) {
      setS((p) => ({ ...p, typing: p.typing + 1 }))
      schedule((p) => pushBot({ ...p, typing: Math.max(0, p.typing - 1) }, [{ id: uid("r"), kind: "reading", at: nowAt(p) }]), 700)
      schedule(screenshotResult, 2200)
      return
    }
    if (from === "study") {
      reply((p) => evaluateStudy(p, ids, "forward"))
      return
    }
    reply((p) => {
      const known = ids.map((id) => cannedReplies[id]).find(Boolean)
      return pushBot(p, [
        botText(known ?? "I don't see a date, time or place in this message, so there's nothing to change.", nowAt(p)),
      ])
    })
  }

  const forwardEmail = (id: Email["id"]) => {
    logFootprint("forward", { msgs: `email-${id}`, count: 1, target: "bot", how: "share" })
    setS((p) => ({ ...p, bot: [...p.bot, { id: uid("f"), kind: "fwd-email", at: nowAt(p), email: id }] }))
    reply((p) => respondEmail(p, id), 1100)
  }

  const forwardSample = () => {
    setS((p) => ({
      ...p,
      bot: [
        ...p.bot.map((b) => (b.kind === "sample" ? { ...b, used: true } : b)),
        { id: uid("f"), kind: "fwd", at: nowAt(p), chat: "sample", msg: PRACTICE_SAMPLE },
      ],
      onboarding: { ...p.onboarding, step: 4 },
    }))
    reply(onboardingSample)
  }

  const markPicked = (itemId: string, quick: Quick) =>
    setS((p) => {
      const bot = p.bot.map((b) => (b.id === itemId && b.kind === "text" ? { ...b, picked: quick.label } : b))
      return {
        ...p,
        bot: quick.echo ? [...bot, meText(quick.label, nowAt(p))] : bot,
      }
    })

  const apply = (pid: string, via: string, remind = false) => {
    const p = ref.current.proposals[pid]
    if (!p || p.status !== "open") return
    if (p.study) {
      const correct =
        p.after.date === 12 && p.after.start === 16 * 60 + 30 && p.after.end === 17 * 60 + 30 && /405/.test(p.after.location)
      logFootprint("update_confirm", {
        final: `${slotText(p.after)}`,
        correct,
        via,
        basis: p.basis,
        edited: editNotes(p).length > 0,
      })
    } else {
      logFootprint("update_confirm", { final: slotText(p.after), correct: false, via, item: p.title })
    }
    setS((x) => applyProposal(x, pid, remind))
  }

  const act = (itemId: string, quick: Quick) => {
    const a = quick.act
    if (!quick.nav) markPicked(itemId, quick)
    switch (a.t) {
      case "apply":
        apply(a.pid, "chat", a.remind)
        return
      case "register":
        logFootprint("menu_action", { action: "register_review" })
        reply(
          (p) =>
            pushBot(p, [
              botText(
                "Here's exactly what I'll send to the Career Center:\n**Name** Maya Chen\n**Email** maya.chen@university.example\n**Program** Master's 2028\n**Résumé** Maya_Chen_Resume_Oct.pdf\nNothing else is shared. I'll also add it to your calendar and remind you 30 min before.",
                nowAt(p),
                [
                  q("Send registration", { t: "send-reg", pid: a.pid }, { primary: true }),
                  q("Not now", { t: "decline", pid: a.pid, text: "OK, I didn't register you." }, { echo: true }),
                ],
                "register_review",
              ),
            ]),
          600,
        )
        return
      case "send-reg":
        logFootprint("menu_action", { action: "register_send" })
        setS((p) => applyProposal(setProposal(p, a.pid, { register: true }), a.pid, true))
        return
      case "decline":
        setS((p) => {
          const next = setProposal(p, a.pid, { status: "declined" })
          return pushBot(next, [botText(a.text ?? "OK.", nowAt(p))])
        })
        return
      case "use-newer":
        logFootprint("menu_action", { action: "use_newer" })
        reply((p) => evaluateStudy(p, ["s231"], "use-newer"), 700)
        return
      case "keep":
        reply((p) =>
          pushBot(p, [botText("OK, keeping Thu 4:00 pm. You can still change it in Review.", nowAt(p))]),
          600,
        )
        return
      case "candidate": {
        logFootprint("not_this_event", { choice: a.target })
        reply((p) => {
          const orig = p.proposals[a.pid]
          const now = nowAt(p)
          if (a.target === "new") {
            let np: Proposal
            ;[p, np] = newProposal(p, {
              title: "Study session (from Sam)",
              color: "teal",
              after: { ...orig.after },
              sources: orig.sources,
              logLines: orig.logLines,
              chip: orig.chip,
            })
            return pushBot(p, [
              botText(
                `OK, a new event. Add **Study session (from Sam)**, ${slotText(orig.after)}?`,
                now,
                [
                  q("Add", { t: "apply", pid: np.id }, { primary: true }),
                  q("No", { t: "decline", pid: np.id, text: "OK, I didn't add anything." }, { echo: true }),
                ],
              ),
            ])
          }
          const target = p.events.find((e) => e.id === a.target)!
          const length = target.end - target.start
          const np: Proposal = {
            ...orig,
            id: uid("p"),
            eventId: target.id,
            title: target.title,
            color: target.color,
            before: slotOf(target),
            orig: {
              date: orig.after.date,
              start: orig.after.start,
              end: orig.after.start + length,
              location: orig.roomMentioned ? orig.after.location : target.location ?? "",
            },
            after: {
              date: orig.after.date,
              start: orig.after.start,
              end: orig.after.start + length,
              location: orig.roomMentioned ? orig.after.location : target.location ?? "",
            },
            notes: [
              { field: "other", text: `You picked ${target.title} instead of Stats 203 study group.` },
              ...orig.notes.filter((n) => n.field !== "room"),
              ...(orig.roomMentioned ? [] : [{ field: "room" as Field, text: `Room not mentioned, keeping ${target.location}.` }]),
            ],
            study: false,
            status: "open",
            entryId: undefined,
          }
          p = addProposal(p, np)
          return pushBot(p, [
            botText(`OK. Here's the change for **${target.title}**.`, now),
            { id: uid("c"), kind: "card", at: now, pid: np.id },
          ])
        }, 700)
        return
      }
      case "pick-day":
        setS((p) => ({ ...p, studyDay: a.date }))
        reply((p) => evaluateStudy(p, [], "forward"), 700)
        return
      case "ambig-day":
        setS((p) => ({ ...p, ambig: { date: a.date } }))
        reply(
          (p) =>
            pushBot(p, [
              botText("4:00 pm, right?", nowAt(p), [
                q("Yes, pm", { t: "ambig-half", pm: true }, { echo: true, primary: true }),
                q("Actually am", { t: "ambig-half", pm: false }, { echo: true }),
              ]),
            ]),
          700,
        )
        return
      case "ambig-half":
        reply((p) => ambigHalf(p, a.pm), 800)
        return
      case "digest-ok":
        reply((p) => pushBot(p, [botText("Good night. I'll check in tomorrow at 8:00 am.", nowAt(p))]), 600)
        return
      case "onb-mode":
        return
      default:
        return
    }
  }

  const value = useMemo<Store>(
    () => ({
      s,
      go,
      back,
      setNav,
      replaceTop,
      sendText,
      forward,
      forwardEmail,
      forwardSample,
      act,
      apply,
      notThis: (pid) => {
        logFootprint("not_this_event", { choice: "open_list" })
        setS((p) => {
          const next = setProposal(p, pid, { status: "not-this" })
          const prop = next.proposals[pid]
          if (prop.practice) {
            return pushBot(next, [
              botText("That's how you tell me I picked the wrong event. It's practice, so nothing changes.", nowAt(p), [
                q("Go to my chats", { t: "onb-done" }, { primary: true }),
              ]),
            ])
          }
          const candidates = prop.study
            ? [
                q("Design 213 team sync · Thu 6:00 pm", { t: "candidate", pid, target: "sync-12" }, { echo: true }),
                q("Stats 203 class · Thu 11:00 am", { t: "candidate", pid, target: "info203-12" }, { echo: true }),
                q("None of these, create a new event", { t: "candidate", pid, target: "new" }, { echo: true }),
              ]
            : []
          return pushBot(next, [
            botText(
              prop.study ? "Got it, I won't change this event. Which event did you mean?" : "Got it, I won't change this event.",
              nowAt(p),
              [...candidates, q("Review anyway", { t: "review-anyway", pid }, { link: true, nav: true })],
              "not_this",
            ),
          ])
        })
      },
      reopen: (pid) => setS((p) => setProposal(p, pid, { status: "open" })),
      editProposal: (pid, slot) => {
        const p = ref.current.proposals[pid]
        if (p) {
          const pairs: [string, string, string][] = [
            ["day", dayLabel(p.after.date), dayLabel(slot.date)],
            ["start", fmt(p.after.start), fmt(slot.start)],
            ["end", fmt(p.after.end), fmt(slot.end)],
            ["room", p.after.location, slot.location],
          ]
          for (const [field, oldValue, newValue] of pairs) {
            if (oldValue !== newValue) logFootprint("edit_field", { field, old: oldValue, new: newValue })
          }
        }
        setS((x) => setProposal(x, pid, { after: slot }))
      },
      undo: (entryId, where) => {
        const entry = ref.current.history.find((e) => e.id === entryId)
        if (!entry || !canUndo(ref.current, entry)) return
        logFootprint("undo", { where, item: entry.title })
        setS((p) => undoEntry(p, entryId))
        if (where !== "chat") showToast("Change undone")
      },
      deleteEvent: (id) => {
        logFootprint("event_delete", { id })
        setS((p) => {
          const [next, entryId] = deleteEvent(p, id)
          const e = p.events.find((x) => x.id === id)
          return {
            ...next,
            toast: { id: Date.now(), text: `Deleted ${e?.title ?? "event"}`, action: { label: "Undo", kind: "undo", entryId } },
          }
        })
      },
      chooseSources: (choice, seconds) => {
        logFootprint("sources_choice", { choice, seconds })
        setS((p) => chooseSources(p, choice))
      },
      setWatch: (watchOn) => {
        const cur = ref.current
        if (cur.mode.watch === watchOn) return
        logFootprint("mode_change", { mode: watchOn ? "watch" : "forward", chats: cur.mode.chats.join(",") })
        setS((p) => {
          const now = nowAt(p)
          if (watchOn) return { ...p, mode: { ...p.mode, watch: true } }
          let next: State = { ...p, mode: { watch: false, chats: [], since: {} } }
          ;[next] = addEntry(next, {
            at: now,
            title: "Changed how I find changes",
            detail: "Only what you forward",
            status: "setting",
          })
          return p.mode.chats.length
            ? pushBot(next, [botText("Back to forward-only. I'll only see messages you send me.", now)])
            : next
        })
        showToast("Saved")
      },
      setWatchChat: (chat, on) => {
        const cur = ref.current.mode.chats
        logFootprint("mode_change", {
          mode: "watch",
          chats: (on ? [...new Set([...cur, chat])] : cur.filter((c) => c !== chat)).join(","),
        })
        setS((p) => {
          const now = nowAt(p)
          const chats = on ? [...new Set([...p.mode.chats, chat])] : p.mode.chats.filter((c) => c !== chat)
          let next: State = {
            ...p,
            mode: { watch: true, chats, since: { ...p.mode.since, [chat]: on ? now : undefined } },
          }
          ;[next] = addEntry(next, {
            at: now,
            title: on ? `Started watching ${chatMeta[chat].name}` : `Stopped watching ${chatMeta[chat].name}`,
            detail: on ? "I read new messages there and tell you about schedule changes" : "I no longer read this chat",
            status: "setting",
          })
          return pushBot(next, [
            botText(
              on
                ? `Now watching **${chatMeta[chat].name}**. I'll read new messages there and tell you about schedule changes. Turn it off in Settings anytime.`
                : `Stopped watching **${chatMeta[chat].name}**. I'll only see its messages if you forward them.`,
              now,
            ),
          ])
        })
        showToast(on ? `Watching ${chatMeta[chat].name}` : "Saved")
      },
      setAutoApply: (on) => {
        logFootprint("confirm_mode", { auto: on })
        setS((p) => {
          const [next] = addEntry(p, {
            at: nowAt(p),
            title: "Changed confirmations",
            detail: on ? "Apply automatically when the organizer changes it and nothing conflicts" : "Always ask me",
            status: "setting",
          })
          return { ...next, autoApply: on }
        })
        showToast("Saved")
      },
      syncNow: () => {
        setS((p) => ({ ...p, sync: { calendar: nowAt(p), bcourses: nowAt(p) } }))
      },
      deleteHistory: () => {
        logFootprint("history_delete", {})
        setS((p) => {
          const now = nowAt(p)
          const next: State = {
            ...p,
            history: [],
            kept: [],
            events: p.events.map((e) =>
              e.assistant
                ? { ...e, sources: [], log: [{ label: `History deleted by you · ${fmt(now)}`, by: "you" }] }
                : e,
            ),
          }
          return pushBot(next, [
            botText("Deleted. I removed your change history and the quotes I kept. Your calendar events stay as they are.", now),
          ])
        })
        showToast("History deleted")
      },
      showToast,
      clearToast: (id) => setS((p) => (p.toast?.id === id ? { ...p, toast: null } : p)),
      clearBanner: (id) => setS((p) => (p.banner?.id === id ? { ...p, banner: null } : p)),
      reset: (nav, config) => {
        timers.current.forEach((id) => window.clearTimeout(id))
        timers.current = []
        epochRef.current += 1
        const ep = epochRef.current
        setS((p) => initialState(config ?? p.config, nav ?? [{ name: "list" }], ep))
        logFootprint("demo_reset", {})
      },
      jump: (target) => {
        timers.current.forEach((id) => window.clearTimeout(id))
        timers.current = []
        epochRef.current += 1
        const ep = epochRef.current
        const navFor: Record<Jump, Screen[]> = {
          t1: [{ name: "lock" }],
          t2: [{ name: "list" }, { name: "chat", chat: "priya" }],
          t3: [{ name: "list" }, { name: "chat", chat: "bot" }],
          t4: [{ name: "list" }, { name: "chat", chat: "bot" }],
          list: [{ name: "list" }],
          settings: [{ name: "list" }, { name: "chat", chat: "bot" }, { name: "settings" }],
          history: [{ name: "list" }, { name: "chat", chat: "bot" }, { name: "history" }],
          onboarding: [{ name: "list" }, { name: "chat", chat: "bot" }],
        }
        logFootprint("demo_jump", { target })
        setS((p) => {
          let next = initialState(p.config, navFor[target], ep)
          if (target === "t4" || target === "history") next = afterT1(next)
          if (target === "onboarding") next = withOnboarding(next)
          if (target === "t2") next = { ...next, unread: { ...next.unread, priya: 0 } }
          if (target === "t3" || target === "t4" || target === "settings" || target === "history" || target === "onboarding") {
            next = { ...next, unread: { ...next.unread, bot: 0 } }
          }
          return next
        })
      },
      setConfig: (config) => {
        timers.current.forEach((id) => window.clearTimeout(id))
        timers.current = []
        epochRef.current += 1
        const ep = epochRef.current
        setS((p) => initialState(config, p.nav[0]?.name === "lock" ? [{ name: "lock" }] : [{ name: "list" }], ep))
      },
      sendCorrectionNow: () => {
        logFootprint("demo_trigger", { trigger: "correction" })
        deliverCorrection()
      },
      triggerEmail: (id) => {
        logFootprint("demo_trigger", { trigger: `email-${id}` })
        forwardEmail(id)
      },
      triggerDigest: () => {
        logFootprint("demo_trigger", { trigger: "digest" })
        setS(digest)
      },
      startOnboarding: () => {
        timers.current.forEach((id) => window.clearTimeout(id))
        timers.current = []
        epochRef.current += 1
        const ep = epochRef.current
        setS((p) => withOnboarding(initialState(p.config, [{ name: "list" }, { name: "chat", chat: "bot" }], ep)))
      },
      onbStart: () => {
        setS((p) => ({ ...p, bot: [...p.bot, meText("/start", nowAt(p))], onboarding: { ...p.onboarding, step: 1 } }))
        reply((p) =>
          pushBot(p, [
            botText(
              "Hi Maya. Send me any message, email or screenshot about a plan, and I'll keep your calendar right. Nothing changes without your OK.",
              nowAt(p),
            ),
            botText("First, connect Google Calendar and your course site, so I can compare what you send me with what's planned.", nowAt(p), [
              q("Connect Google Calendar & course site", { t: "onb-connect" }, { primary: true, nav: true }),
            ]),
          ]),
        )
      },
      onbConnected: () => {
        setS((p) => ({
          ...p,
          onboarding: { ...p.onboarding, step: 2 },
          bot: p.bot.map((b) =>
            b.kind === "text" && b.quick?.some((x) => x.act.t === "onb-connect") ? { ...b, picked: "Connect Google Calendar & course site" } : b,
          ),
        }))
        reply((p) =>
          pushBot(p, [
            botText(
              `Connected: Google Calendar and your course site (last sync ${fmt(nowAt(p))}). I only change Google Calendar events after you confirm.`,
              nowAt(p),
            ),
            botText(
              "How should I find changes?\n\n**Only what I forward** (recommended): I only see messages you send me.\n**Watch chats I choose**: I read new messages in chats you pick. Never your personal chats unless you pick them.",
              nowAt(p),
              [
                q("Only what I forward", { t: "onb-mode", watch: false }, { primary: true }),
                q("Watch chats I choose", { t: "onb-mode", watch: true }),
              ],
            ),
          ]),
        )
      },
      onbMode: (watchOn, chats) => {
        logFootprint("mode_change", { mode: watchOn ? "watch" : "forward", chats: chats.join(","), where: "onboarding" })
        setS((p) => {
          const now = nowAt(p)
          const label = watchOn ? "Watch chats I choose" : "Only what I forward"
          const bot = p.bot.map((b) =>
            b.kind === "text" && b.quick?.some((x) => x.act.t === "onb-mode") ? { ...b, picked: label } : b,
          )
          const since: Partial<Record<ChatId, number>> = {}
          chats.forEach((c) => (since[c] = now))
          return {
            ...p,
            bot: [...bot, meText(watchOn && chats.length ? `${label}: ${chats.map((c) => chatMeta[c].name).join(", ")}` : label, now)],
            mode: watchOn && chats.length ? { watch: true, chats, since } : { watch: false, chats: [], since: {} },
            onboarding: { ...p.onboarding, step: 3 },
          }
        })
        reply((p) =>
          pushBot(p, [
            botText(
              watchOn && chats.length
                ? `Got it. I'll watch ${chats.map((c) => `**${chatMeta[c].name}**`).join(" and ")}, and only see other chats if you forward them. You can change this in Settings.`
                : "Got it. I'll only see messages you send me. You can change this in Settings.",
              nowAt(p),
            ),
            botText("Try it: forward me this sample message.", nowAt(p)),
            { id: uid("sm"), kind: "sample", at: nowAt(p) },
          ]),
        )
      },
      onbDone: () => {
        logFootprint("onboarding_done", {})
        setS((p) => ({
          ...p,
          onboarding: { active: false, step: 5 },
          nav: [{ name: "list" }],
          bot: p.bot.map((b) =>
            b.kind === "text" && b.quick?.some((x) => x.act.t === "onb-done") ? { ...b, picked: "Go to my chats" } : b,
          ),
        }))
      },
      reoffer: (pid) => {
        reply((p) => {
          const prop = p.proposals[pid]
          if (!prop || prop.status !== "open") return p
          return pushBot(p, [
            botText(`Still open: add **${prop.title}**, ${slotText(prop.after)}?`, nowAt(p), [
              q("Add", { t: "apply", pid }, { primary: true }),
              q("Not now", { t: "decline", pid, text: "OK, I didn't add it." }, { echo: true }),
            ]),
          ])
        }, 600)
      },
      botHelp: () => {
        reply((p) =>
          pushBot(p, [
            botText(
              "Forward me a message, email or screenshot about a plan. I'll compare it with your calendar, tell you what I assumed, and ask before changing anything. Use Menu for your calendar, history and settings.",
              nowAt(p),
            ),
          ]),
          600,
        )
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s],
  )

  // Hash routes: #lock, #mod (handled in App), #onboarding, #priya, #bot, #settings, #history.
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash
      if (hash === "#mod" || hash === "") return
      if (hash === "#onboarding") {
        value.startOnboarding()
        return
      }
      value.setNav(navFromHash())
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [value])

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useStore must be used inside StoreProvider")
  return store
}

export { BCOURSES_QUOTE, SCREENSHOT_QUOTE }
