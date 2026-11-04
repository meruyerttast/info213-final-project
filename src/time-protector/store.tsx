import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { logFootprint } from "@/shared/footprints"
import {
  baseEvents,
  dayRange,
  defaultRules,
  dur,
  effectsOf,
  K,
  NOW,
  shiftedDinnerEvent,
  STUDY_TITLE,
  t,
  TODAY,
  type Block,
  type CalEvent,
  type Extras,
  type Level,
  type Lockable,
  type Rules,
  type SpreadOption,
} from "./data"

export type CheckinState = "pending" | "done" | "extended" | "replanned"

export interface AppliedPlan {
  id: string
  kind: "replan" | "extend" | "spread"
  name: string
  date: string
  need?: number
  blocks: Block[]
  allowed: Lockable[]
  costLocked: Lockable[]
  unlockedAt: Record<Lockable, boolean>
  extras: Extras
  deadline: number
  spread?: SpreadOption
  status: "active" | "undone" | "replaced"
  auto?: boolean
  dinnerMessage?: boolean
  createdOrder: number
}

export type ToastState = { text: string; undo?: () => void; key: number } | null

type Sources = { calendar: boolean; bcourses: boolean }
type Checkins = { timing: "before" | "end" | "off"; quiet: boolean; skipShort: boolean }

interface StoreState {
  onboardingComplete: boolean
  rules: Rules
  checkins: Checkins
  changeMode: "ask" | "auto"
  sources: Sources
  checkin: CheckinState
  checkinShownAt: number | null
  doneProgress: number | null
  plans: AppliedPlan[]
  suggestion: "open" | "applied" | "dismissed"
  overloadDismissed: boolean
  protectedExtra: string[]
  extensionSent: boolean
}

const startState = (): StoreState => ({
  onboardingComplete: true,
  rules: structuredClone(defaultRules),
  checkins: { timing: "before", quiet: true, skipShort: false },
  changeMode: "ask",
  sources: { calendar: true, bcourses: true },
  checkin: "pending",
  checkinShownAt: null,
  doneProgress: null,
  plans: [],
  suggestion: "open",
  overloadDismissed: false,
  protectedExtra: [],
  extensionSent: false,
})

export const levelLabel: Record<Level, string> = { hard: "Hard", soft: "Soft", off: "Off" }

/** Applies every active plan to the base week. Today, Week, History and Insights all read this. */
export function buildSchedule(state: Pick<StoreState, "plans" | "checkin" | "protectedExtra">): CalEvent[] {
  const events: CalEvent[] = baseEvents.map((e) => ({ ...e }))
  const byId = (id: string) => events.find((e) => e.id === id)!
  const study = byId("tue-study")
  study.status = state.checkin === "done" ? "done" : "current"
  const active = state.plans
    .filter((p) => p.status === "active")
    .sort((a, b) => a.createdOrder - b.createdOrder)
  for (const p of active) {
    if (p.kind === "spread" && p.spread) {
      for (const m of p.spread.moves) {
        const ev = byId(m.eventId)
        ev.note = `Moved from ${dayRange(ev.start, ev.end)}`
        ev.start = m.start
        ev.end = m.end
        ev.status = "moved"
        ev.planId = p.id
      }
      continue
    }
    const fx = effectsOf(p.blocks, p.allowed)
    for (const b of p.blocks) {
      if (p.extras.continuation && b.start === study.end) {
        study.end = b.end
        study.status = state.checkin === "done" ? "done" : "extended"
        study.planId = p.id
        study.note = `Extended from 5:00 pm`
        continue
      }
      events.push({
        id: `${p.id}-${b.id}`,
        title: STUDY_TITLE,
        start: b.start,
        end: b.end,
        kind: "study",
        source: "Time Protector",
        status: "new",
        planId: p.id,
        detail: `Added by your plan “${p.name}”`,
      })
    }
    if (fx.dinnerShifted) {
      for (const id of ["tue-travel", "tue-dinner", "tue-home"]) {
        const ev = byId(id)
        Object.assign(ev, shiftedDinnerEvent(ev))
        ev.status = "moved"
        ev.planId = p.id
        ev.note = id === "tue-dinner" ? "Moved from 7:00 pm" : "Moves with dinner"
        ev.tone = id === "tue-dinner" ? "amber" : undefined
      }
    }
    if (fx.gymMoved) {
      const gym = byId("wed-gym")
      events.push({ ...gym, id: "wed-gym-ghost", status: "ghost", note: "Gym → Thu 7:00 am", tone: "amber", planId: p.id })
      gym.start = K.GYM_THU
      gym.end = K.GYM_THU + 60
      gym.status = "moved"
      gym.tone = "amber"
      gym.note = "Moved from Wed 7:00 am"
      gym.planId = p.id
    }
    if (fx.windUsed > 0) {
      const wind = byId("tue-wind")
      wind.status = "used"
      wind.tone = "amber"
      wind.note = fx.windUsed >= 45 ? "Used for study tonight" : `Cut to ${45 - fx.windUsed} min`
      wind.planId = p.id
    }
    if (fx.sleepCut > 0) {
      const sleep = byId("wed-sleep")
      let start = sleep.start
      let end = sleep.end
      for (const b of p.blocks) {
        if (b.end > start && b.start <= start) start = Math.min(b.end, end)
        if (b.start < end && b.end >= end) end = Math.max(b.start, start)
      }
      sleep.start = start
      sleep.end = end
      sleep.status = "shortened"
      sleep.tone = "red"
      sleep.note = `${dur(7 * 60 - fx.sleepCut)} tonight`
      sleep.planId = p.id
    }
    if (p.extras.submitAsIs) {
      events.push({
        id: `${p.id}-reminder`,
        title: "Submit what you have, as is",
        short: "Submit as is",
        start: t(2, 8, 45),
        end: t(2, 8, 45),
        kind: "reminder",
        source: "Time Protector",
        planId: p.id,
      })
    }
  }
  for (const id of state.protectedExtra) {
    const ev = events.find((e) => e.id === id)
    if (ev) ev.protect = ev.protect ?? "meal"
  }
  return events.sort((a, b) => a.start - b.start || a.end - b.end)
}

const solidForGaps = (e: CalEvent) =>
  e.status !== "ghost" && e.kind !== "deadline" && e.kind !== "reminder"

/** Open stretches inside [from, to) not covered by any event. */
export function gapsIn(events: CalEvent[], from: number, to: number, min = 30) {
  const covering = events
    .filter(solidForGaps)
    .filter((e) => e.end > from && e.start < to)
    .sort((a, b) => a.start - b.start)
  const gaps: { start: number; end: number }[] = []
  let cursor = from
  for (const e of covering) {
    if (e.start > cursor && e.start - cursor >= min) gaps.push({ start: cursor, end: e.start })
    cursor = Math.max(cursor, e.end)
  }
  if (to - cursor >= min) gaps.push({ start: cursor, end: to })
  return gaps
}

const WORK = ["study", "class", "work", "meeting"]

export function workload(events: CalEvent[], day: number) {
  const dayStart = t(day, 0)
  const dayEnd = t(day + 1, 0)
  const planned = events
    .filter((e) => WORK.includes(e.kind) && e.status !== "ghost")
    .reduce((s, e) => s + Math.max(0, Math.min(e.end, dayEnd) - Math.max(e.start, dayStart)), 0)
  const from = day === TODAY ? NOW : t(day, 8)
  const free = day < TODAY ? 0 : gapsIn(events, from, t(day, 23, 15), 45).reduce((s, g) => s + g.end - g.start, 0)
  return { planned, free, heavy: planned >= 8 * 60 && free === 0 }
}

type AppStore = StoreState & {
  schedule: CalEvent[]
  activeReplan: AppliedPlan | undefined
  blockEnd: number
  toast: ToastState
  showToast: (text: string, undo?: () => void) => void
  clearToast: () => void
  reset: () => void
  setOnboardingComplete: (done: boolean) => void
  setRule: <R extends keyof Rules>(item: R, patch: Partial<Rules[R]>, where?: string) => void
  setCheckins: (patch: Partial<Checkins>) => void
  setChangeMode: (mode: "ask" | "auto") => void
  setSource: (id: keyof Sources, connected: boolean) => void
  noteCheckinShown: (where: "lock" | "app" | "banner") => void
  checkinAction: (action: "done" | "+30" | "need more" | "dismissed", where: string) => void
  markDone: () => void
  setDoneProgress: (value: number) => void
  extendBlock: (where: string) => void
  applyPlan: (plan: Omit<AppliedPlan, "id" | "status" | "createdOrder" | "date">) => string
  updatePlan: (id: string, blocks: Block[]) => void
  undoPlan: (id: string, where: string) => void
  setDinnerMessage: (id: string) => void
  setExtensionSent: (sent: boolean) => void
  setSuggestion: (value: StoreState["suggestion"]) => void
  dismissOverload: () => void
  toggleProtectExtra: (id: string) => void
  deleteAllData: () => void
}

const StoreContext = createContext<AppStore | null>(null)

let planSeq = 0

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(startState)
  const [toast, setToast] = useState<ToastState>(null)
  const toastSeq = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const patch = useCallback((p: Partial<StoreState> | ((s: StoreState) => Partial<StoreState>)) => {
    setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) }))
  }, [])

  const showToast = useCallback((text: string, undo?: () => void) => {
    toastSeq.current += 1
    setToast({ text, undo, key: toastSeq.current })
  }, [])
  const clearToast = useCallback(() => setToast(null), [])

  const schedule = useMemo(() => buildSchedule(state), [state])
  const activeReplan = state.plans.find((p) => p.status === "active" && p.kind === "replan")
  const extendPlan = state.plans.find(
    (p) => p.status === "active" && (p.kind === "extend" || p.extras.continuation),
  )
  const blockEnd = extendPlan ? Math.max(...extendPlan.blocks.map((b) => b.end)) : K.BLOCK_END

  const undoPlan = useCallback(
    (id: string, where: string) => {
      const plan = stateRef.current.plans.find((p) => p.id === id)
      if (!plan || plan.status !== "active") return
      logFootprint("undo", { where, plan: plan.name })
      setState((s) => {
        const plans = s.plans.map((p) => (p.id === id ? { ...p, status: "undone" as const } : p))
        const stillActive = plans.some((p) => p.status === "active" && p.kind !== "spread")
        return {
          ...s,
          plans,
          checkin:
            plan.kind === "spread" || stillActive || s.checkin === "done" ? s.checkin : "pending",
          extensionSent: plan.extras.extension ? false : s.extensionSent,
        }
      })
    },
    [],
  )

  const store: AppStore = {
    ...state,
    schedule,
    activeReplan,
    blockEnd,
    toast,
    showToast,
    clearToast,
    reset: () => {
      setState(startState())
      setToast(null)
      logFootprint("demo_reset")
    },
    setOnboardingComplete: (done) => patch({ onboardingComplete: done }),
    setRule: (item, p, where = "settings") => {
      const before = stateRef.current.rules[item] as { level: Level }
      const next = { ...before, ...p } as Rules[typeof item]
      if ("level" in p && p.level !== before.level)
        logFootprint("rule_change", { item, old: before.level, new: String(p.level), where })
      else logFootprint("rule_change", { item, detail: Object.keys(p).join(","), where })
      patch((s) => ({ rules: { ...s.rules, [item]: next } }))
    },
    setCheckins: (p) => patch((s) => ({ checkins: { ...s.checkins, ...p } })),
    setChangeMode: (mode) => {
      logFootprint("rule_change", { item: "change_mode", new: mode })
      patch({ changeMode: mode })
    },
    setSource: (id, connected) => patch((s) => ({ sources: { ...s.sources, [id]: connected } })),
    noteCheckinShown: (where) => {
      logFootprint("checkin_shown", { where })
      patch((s) => ({ checkinShownAt: s.checkinShownAt ?? Date.now() }))
    },
    checkinAction: (action, where) => {
      const shown = stateRef.current.checkinShownAt
      logFootprint("checkin_action", {
        action,
        where,
        seconds: shown ? Math.round((Date.now() - shown) / 1000) : -1,
      })
    },
    markDone: () => patch({ checkin: "done" }),
    setDoneProgress: (value) => patch({ doneProgress: value }),
    extendBlock: (where) => {
      const id = `plan-${++planSeq}`
      const plan: AppliedPlan = {
        id,
        kind: "extend",
        name: "Extended 30 min",
        date: "Tue Nov 10",
        need: 30,
        blocks: [{ id: "ext", start: K.BLOCK_END, end: K.BLOCK_END + 30 }],
        allowed: [],
        costLocked: [],
        unlockedAt: { dinner: false, winddown: false, sleep: false, gym: false },
        extras: { continuation: true },
        deadline: K.DEADLINE,
        status: "active",
        createdOrder: planSeq,
      }
      logFootprint("plan_apply", { option: "+30 min", where })
      patch((s) => ({ plans: [...s.plans, plan], checkin: "extended" }))
      showToast("Extended to 5:30 pm. You still leave for dinner at 6:15 ✓", () => {
        undoPlan(id, "toast")
      })
    },
    applyPlan: (draft) => {
      const id = `plan-${++planSeq}`
      const shown = stateRef.current.checkinShownAt
      logFootprint("plan_apply", {
        option: draft.name,
        kind: draft.kind,
        auto: Boolean(draft.auto),
        seconds_from_checkin: shown ? Math.round((Date.now() - shown) / 1000) : -1,
      })
      setState((s) => ({
        ...s,
        plans: [
          ...s.plans.map((p) =>
            p.status === "active" && p.kind === "replan" && draft.kind === "replan"
              ? { ...p, status: "replaced" as const }
              : p,
          ),
          { ...draft, id, status: "active", createdOrder: planSeq, date: draft.kind === "spread" ? "Thu Nov 12" : "Tue Nov 10" },
        ],
        checkin: draft.kind === "replan" ? (s.checkin === "done" ? "done" : "replanned") : s.checkin,
        extensionSent: draft.extras.extension ? true : s.extensionSent,
      }))
      return id
    },
    updatePlan: (id, blocks) => {
      logFootprint("plan_edit", { blocks: blocks.length })
      patch((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, blocks } : p)) }))
    },
    undoPlan,
    setDinnerMessage: (id) =>
      patch((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, dinnerMessage: true } : p)) })),
    setExtensionSent: (sent) => patch({ extensionSent: sent }),
    setSuggestion: (value) => {
      logFootprint("suggestion_action", { value })
      patch({ suggestion: value })
    },
    dismissOverload: () => patch({ overloadDismissed: true }),
    toggleProtectExtra: (id) =>
      patch((s) => ({
        protectedExtra: s.protectedExtra.includes(id)
          ? s.protectedExtra.filter((x) => x !== id)
          : [...s.protectedExtra, id],
      })),
    deleteAllData: () => {
      setState({ ...startState(), onboardingComplete: false })
      setToast(null)
    },
  }

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useStore must be used inside StoreProvider")
  return store
}
