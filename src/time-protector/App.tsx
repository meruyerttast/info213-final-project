import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { FootprintsPanel } from "@/shared/FootprintsPanel"
import { logFootprint } from "@/shared/footprints"
import {
  changeList,
  clock,
  DAY_SHORT,
  dateLabel,
  dayClock,
  dayOf,
  dayRange,
  describePlan,
  dur,
  fitCheck,
  freeWindows,
  generateOptions,
  K,
  lastWeek,
  LOCKABLES,
  lockLabels,
  longDateLabel,
  NOW,
  pastPlans,
  range,
  ruleFor,
  spreadOptions,
  t,
  TODAY,
  user,
  VERSION,
  type Block,
  type CalEvent,
  type Chip,
  type ConflictChoice,
  type ConflictKey,
  type Extras,
  type Level,
  type Lockable,
  type OptionPlan,
  type PlanCtx,
  type Rules,
  type SpreadOption,
} from "./data"
import {
  gapsIn,
  levelLabel,
  StoreProvider,
  useStore,
  workload,
  type AppliedPlan,
} from "./store"

// ---------- Icons ----------

const icons: Record<string, ReactNode> = {
  today: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  week: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
      <path d="M3.5 3.5v5h5M12 7.5V12l3 2" />
    </>
  ),
  insights: (
    <>
      <path d="M5 20v-7M12 20V5M19 20v-11M3 20h18" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  back: <path d="m15 18-6-6 6-6" />,
  close: <path d="m7 7 10 10M17 7 7 17" />,
  check: <path d="m5 12 4 4L19 6" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 7.6-1.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
      <path d="M12 8.5V12l2.3 1.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z" />
      <path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  gym: <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />,
  dinner: <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.7 1-3 3.2-3 6v3h3v9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 10v4.5M12 17.2h.01" />
    </>
  ),
  book: (
    <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5a3.5 3.5 0 0 1 3.5 3z" />
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3.2-.2 5 1.5 5.5 4" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  work: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4.5" r="2" />
      <path d="m9 21 3-6.5 3 3V21M7 12.5l3-4 4 1 2.5 3" />
    </>
  ),
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  grip: <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />,
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21h4" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M8 14h3" />
    </>
  ),
}

function Icon({ name, size = 22, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "grip" ? 3 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}

const sourceClass: Record<string, string> = {
  "Google Calendar": "source-calendar",
  Calendar: "source-calendar",
  "Course site": "source-bcourses",
  "Time Protector": "source-tp",
  You: "source-you",
  "Edited by you": "source-you",
}

function SourceChip({ source }: { source: string }) {
  return <span className={`source-chip ${sourceClass[source] ?? "source-profile"}`}>{source}</span>
}

// ---------- Shared pieces ----------

function useLongPress(ms: number, onLong: () => void) {
  const timer = useRef<number | null>(null)
  const fired = useRef(false)
  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => stop, [])
  return {
    fired,
    handlers: {
      onPointerDown: () => {
        fired.current = false
        stop()
        timer.current = window.setTimeout(() => {
          fired.current = true
          onLong()
        }, ms)
      },
      onPointerUp: stop,
      onPointerCancel: stop,
      onPointerLeave: stop,
    },
  }
}

const openModerator = () => window.dispatchEvent(new CustomEvent("open-moderator"))

function Header({
  eyebrow,
  title,
  onAvatar,
}: {
  eyebrow?: string
  title: string
  onAvatar: () => void
}) {
  const press = useLongPress(3000, openModerator)
  return (
    <header className="app-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      <button
        className="avatar"
        {...press.handlers}
        onClick={() => {
          if (!press.fired.current) onAvatar()
          press.fired.current = false
        }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Open settings"
      >
        {user.initials}
      </button>
    </header>
  )
}

function StatusBar({ time = "4:55", light = false }: { time?: string; light?: boolean }) {
  return (
    <div className={light ? "status-bar light" : "status-bar"}>
      <span>{time}</span>
      <div className="status-icons">
        <span className="signal" />
        <span className="wifi">◒</span>
        <span className="battery" />
      </div>
    </div>
  )
}

function FlowHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  const handleBack = (event: MouseEvent<HTMLButtonElement>) => {
    const screen = event.currentTarget.closest(".flow-screen")
    screen?.classList.add("page-pop")
    window.setTimeout(onBack, 210)
  }
  return (
    <header className="flow-header">
      <button onClick={handleBack} aria-label="Back">
        <Icon name="back" size={23} />
      </button>
      <strong>{title}</strong>
      {right ?? <span />}
    </header>
  )
}

function Sheet({ children, onClose, className = "" }: { children: ReactNode; onClose: () => void; className?: string }) {
  return (
    <div
      className="sheet-layer"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section className={`sheet ${className}`} role="dialog" aria-modal="true">
        <div className="grabber" />
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={21} />
        </button>
        {children}
      </section>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      className={`toggle ${checked ? "on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}

function HoldButton({ label, onComplete, hint = "Press and hold for 1 second" }: { label: string; onComplete: () => void; hint?: string }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | null>(null)
  const completed = useRef(false)
  const start = () => {
    if (timer.current !== null) return
    completed.current = false
    setHolding(true)
    timer.current = window.setTimeout(() => {
      completed.current = true
      timer.current = null
      setHolding(false)
      onComplete()
    }, 1000)
  }
  const stop = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    if (!completed.current) setHolding(false)
  }
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])
  return (
    <button
      className={`hold-button ${holding ? "holding" : ""}`}
      aria-label={`${label}, press and hold`}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          start()
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          stop()
        }
      }}
    >
      <span className="hold-ring">
        <Icon name="check" size={15} />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
    </button>
  )
}

function ChipView({ chip }: { chip: Chip }) {
  return (
    <span className={`plan-chip ${chip.tone}`}>
      {chip.locked && <Icon name="lock" size={13} />}
      {chip.tone !== "neutral" && <Icon name="alert" size={13} />}
      {chip.text}
    </span>
  )
}

function listJoin(items: string[]) {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

function timesLabel(blocks: { start: number; end: number }[]) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start)
  let lastDay = -1
  return sorted
    .map((b) => {
      const d = dayOf(b.start)
      const text = d === lastDay ? range(b.start, b.end) : dayRange(b.start, b.end)
      lastDay = d
      return text
    })
    .join(" + ")
}

const lockIcon: Record<Lockable, string> = { dinner: "dinner", winddown: "moon", sleep: "moon", gym: "gym" }

// ---------- Timeline (vertical day view, used by Today, day view and the preview) ----------

type Seg = { from: number; to: number }
const BAND = 40

function makeScale(segs: Seg[], ppm: number) {
  const tops: number[] = []
  let y = 0
  segs.forEach((s, i) => {
    tops.push(y)
    y += (s.to - s.from) * ppm
    if (i < segs.length - 1) y += BAND
  })
  const height = y
  const yOf = (abs: number) => {
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      if (abs <= s.to) {
        if (abs >= s.from) return tops[i] + (abs - s.from) * ppm
        if (i === 0) return 0
        const prev = segs[i - 1]
        const bandTop = tops[i - 1] + (prev.to - prev.from) * ppm
        return bandTop + ((abs - prev.to) / (s.from - prev.to)) * BAND
      }
    }
    return height
  }
  const minAt = (yy: number) => {
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      const top = tops[i]
      const bottom = top + (s.to - s.from) * ppm
      if (yy <= bottom) {
        if (yy >= top) return s.from + (yy - top) / ppm
        const prev = segs[i - 1]
        if (!prev) return s.from
        return prev.to + ((yy - (top - BAND)) / BAND) * (s.from - prev.to)
      }
    }
    return segs[segs.length - 1].to
  }
  return { yOf, minAt, height, tops }
}

function layoutColumns(items: { id: string; start: number; end: number }[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end)
  const result = new Map<string, { col: number; cols: number }>()
  let cluster: { id: string; start: number; end: number; col: number }[] = []
  let clusterEnd = -Infinity
  const flush = () => {
    const cols = Math.max(1, ...cluster.map((c) => c.col + 1))
    for (const c of cluster) result.set(c.id, { col: c.col, cols })
    cluster = []
  }
  for (const it of sorted) {
    if (it.start >= clusterEnd) {
      flush()
      clusterEnd = -Infinity
    }
    const used = new Set(cluster.filter((c) => c.end > it.start).map((c) => c.col))
    let col = 0
    while (used.has(col)) col++
    cluster.push({ ...it, col })
    clusterEnd = Math.max(clusterEnd, it.end)
  }
  flush()
  return result
}

function ProgressRing({ value }: { value: number }) {
  const r = 9
  const c = 2 * Math.PI * r
  return (
    <svg className="progress-ring" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r={r} fill="none" stroke="#bfdbfe" strokeWidth="3" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
      />
    </svg>
  )
}

function eventIcon(e: CalEvent) {
  if (e.protect === "dinner" || e.protect === "meal" || e.kind === "meal") return "dinner"
  if (e.protect === "gym") return "gym"
  if (e.protect === "sleep" || e.protect === "winddown") return "moon"
  if (e.protect === "family") return "phone"
  if (e.kind === "travel") return "walk"
  if (e.kind === "work") return "work"
  if (e.kind === "meeting") return "people"
  if (e.kind === "deadline") return "flag"
  return "book"
}

interface DraftProps {
  blocks: Block[]
  badId?: string
  onMove: (id: string, start: number) => void
  onDragEnd: (id: string, moved: number) => void
}

function Timeline({
  segs,
  ppm,
  events,
  now,
  gaps = [],
  draft,
  onEvent,
  bandLabel = "Next day",
  segLabels = [],
}: {
  segs: Seg[]
  ppm: number
  events: CalEvent[]
  now?: number
  gaps?: { start: number; end: number }[]
  draft?: DraftProps
  onEvent?: (e: CalEvent) => void
  bandLabel?: string
  segLabels?: string[]
}) {
  const scale = useMemo(() => makeScale(segs, ppm), [segs, ppm])
  const first = segs[0].from
  const last = segs[segs.length - 1].to
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; startY: number; origStart: number; len: number; last: number } | null>(null)
  const visible = events.filter(
    (e) => e.kind !== "deadline" && e.kind !== "reminder" && e.end > first && e.start < last && e.end > e.start,
  )
  const flags = events.filter((e) => (e.kind === "deadline" || e.kind === "reminder") && e.start >= first && e.start <= last)
  const items = [
    ...visible.map((e) => ({ id: e.id, start: e.start, end: e.end })),
    ...(draft?.blocks ?? []).map((b) => ({ id: `draft-${b.id}`, start: b.start, end: b.end })),
  ]
  const cols = layoutColumns(items)
  const ticks: number[] = []
  for (const s of segs) {
    for (let m = Math.ceil(s.from / 30) * 30; m <= s.to; m += 30) ticks.push(m)
  }
  const pos = (id: string, start: number, end: number) => {
    const top = scale.yOf(Math.max(start, first))
    const bottom = scale.yOf(Math.min(end, last))
    const c = cols.get(id) ?? { col: 0, cols: 1 }
    return {
      top: top + 1,
      height: Math.max(bottom - top - 2, 16),
      left: `calc(52px + (100% - 56px) * ${c.col / c.cols})`,
      width: `calc((100% - 56px) / ${c.cols} - 3px)`,
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>, b: Block) => {
    if (!draft) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { id: b.id, startY: e.clientY, origStart: b.start, len: b.end - b.start, last: b.start }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !draft) return
    const y = scale.yOf(d.origStart) + (e.clientY - d.startY)
    let start = Math.round(scale.minAt(y) / 15) * 15
    start = Math.max(first, Math.min(last - d.len, start))
    if (start !== d.last) {
      d.last = start
      draft.onMove(d.id, start)
    }
  }
  const onPointerUp = () => {
    const d = drag.current
    if (!d || !draft) return
    drag.current = null
    if (d.last !== d.origStart) draft.onDragEnd(d.id, d.last - d.origStart)
  }

  return (
    <div className="timeline" ref={ref} style={{ height: scale.height + 8 }}>
      {ticks.map((m) => (
        <div key={m} className={m % 60 === 0 ? "tl-tick hour" : "tl-tick"} style={{ top: scale.yOf(m) }}>
          {m % 60 === 0 && <span>{clock(m).replace(":00", "")}</span>}
        </div>
      ))}
      {segs.slice(0, -1).map((s, i) => (
        <div key={`band-${i}`} className="tl-band" style={{ top: scale.yOf(s.to), height: BAND }}>
          <span>{bandLabel}</span>
        </div>
      ))}
      {segLabels.map((label, i) =>
        label && i > 0 ? (
          <div key={label} className="tl-seg-label" style={{ top: scale.tops[i] + 2 }}>
            {label}
          </div>
        ) : null,
      )}
      {gaps.map((g) => {
        const top = scale.yOf(g.start)
        const height = scale.yOf(g.end) - top
        if (height < 22) return null
        return (
          <div key={`gap-${g.start}`} className="tl-gap" style={{ top: top + 2, height: height - 4 }}>
            <span>{dur(g.end - g.start)} free</span>
          </div>
        )
      })}
      {visible.map((e) => {
        const p = pos(e.id, e.start, e.end)
        const short = p.height < 34
        const prot = Boolean(e.protect)
        const cls = [
          "tl-event",
          `kind-${e.kind}`,
          prot ? "protected" : "",
          e.status ? `status-${e.status}` : "",
          e.tone ? `tone-${e.tone}` : "",
          short ? "short" : "",
        ].join(" ")
        const progress = (e.status === "current" || e.status === "extended") && now ? Math.min(1, Math.max(0, (now - e.start) / (e.end - e.start))) : null
        const content = (
          <>
            <span className="tl-title">
              {prot && e.status !== "ghost" && <Icon name="lock" size={12} />}
              {e.status === "ghost" && <Icon name="arrow" size={12} />}
              <b>{e.status === "ghost" ? e.note : e.title}</b>
              {(e.status === "used" || e.status === "shortened") && e.note && (
                <i className={`tl-badge ${e.tone ?? "amber"}`}>{e.note}</i>
              )}
              {short && <em>{range(e.start, e.end)}</em>}
            </span>
            {!short && (
              <span className="tl-meta">
                {e.status === "ghost" ? `was ${range(e.start, e.end)}` : range(e.start, e.end)}
                {e.status === "new" && <i className="tl-badge">New</i>}
                {e.status === "moved" && <i className="tl-badge amber">Moved</i>}
                {e.status === "done" && <i className="tl-badge green">Done</i>}
                {e.status === "extended" && <i className="tl-badge">+30 min</i>}
              </span>
            )}
            {progress !== null && (
              <span className="tl-progress">
                <ProgressRing value={progress} />
                <small>{Math.max(0, Math.round(e.end - (now ?? 0)))} min left</small>
              </span>
            )}
          </>
        )
        return onEvent && e.status !== "ghost" ? (
          <button key={e.id} className={cls} style={p} onClick={() => onEvent(e)}>
            {content}
          </button>
        ) : (
          <div key={e.id} className={cls} style={p}>
            {content}
          </div>
        )
      })}
      {draft?.blocks.map((b, i) => {
        const p = pos(`draft-${b.id}`, b.start, b.end)
        const bad = draft.badId === b.id
        return (
          <div
            key={b.id}
            className={`tl-event kind-study status-draft ${bad ? "bad" : ""} ${p.height < 34 ? "short" : ""}`}
            style={p}
            onPointerDown={(e) => onPointerDown(e, b)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="group"
            aria-label={`Study block ${i + 1}, ${dayRange(b.start, b.end)}. Drag to move.`}
          >
            <span className="tl-title">
              <b>Study block {draft.blocks.length > 1 ? i + 1 : ""}</b>
              {p.height < 34 && <em>{range(b.start, b.end)}</em>}
            </span>
            {p.height >= 34 && <span className="tl-meta">{range(b.start, b.end)}</span>}
            <span className="tl-grip">
              <Icon name="grip" size={16} />
            </span>
          </div>
        )
      })}
      {flags.map((f) => (
        <div key={f.id} className={`tl-flag ${f.kind}`} style={{ top: scale.yOf(f.start) }}>
          <span>
            <Icon name={f.kind === "deadline" ? "flag" : "bell"} size={12} />
            {f.kind === "deadline" ? `Due ${clock(f.start)} · ${f.title.replace(/ due$/, "").replace("Assignment ", "A")}` : `${clock(f.start)} · ${f.title}`}
          </span>
        </div>
      ))}
      {now !== undefined && now >= first && now <= last && (
        <div className="tl-now" style={{ top: scale.yOf(now) }}>
          <span>{clock(now, false)}</span>
        </div>
      )}
    </div>
  )
}

// ---------- Check-in notification (lock screen and in-app banner) ----------

function CheckinNotification({
  variant,
  onOpen,
  onAction,
  onDismiss,
}: {
  variant: "lock" | "banner"
  onOpen: () => void
  onAction: (action: "done" | "+30" | "need more") => void
  onDismiss: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const start = useRef<{ x: number; y: number; base: number } | null>(null)
  const longTimer = useRef<number | null>(null)
  const longFired = useRef(false)
  const moved = useRef(false)
  const clear = () => {
    if (longTimer.current !== null) window.clearTimeout(longTimer.current)
    longTimer.current = null
  }
  useEffect(() => clear, [])

  const card = (
    <div
      className={`notif-card ${variant}`}
      style={{ transform: variant === "lock" ? `translateX(${offset}px)` : `translateY(${Math.min(0, offset)}px)` }}
      role="button"
      tabIndex={0}
      aria-label="Time Protector notification. Tap to open, press and hold for actions."
      onPointerDown={(e) => {
        if (e.button !== 0) return
        start.current = { x: e.clientX, y: e.clientY, base: revealed ? -96 : 0 }
        longFired.current = false
        moved.current = false
        clear()
        longTimer.current = window.setTimeout(() => {
          longFired.current = true
          setExpanded(true)
          logFootprint("checkin_expand", { where: variant })
        }, 550)
      }}
      onPointerMove={(e) => {
        const s = start.current
        if (!s) return
        const dx = e.clientX - s.x
        const dy = e.clientY - s.y
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          moved.current = true
          clear()
        }
        if (variant === "lock" && Math.abs(dx) > Math.abs(dy)) setOffset(Math.max(-120, Math.min(0, s.base + dx)))
        if (variant === "banner" && dy < 0) setOffset(dy)
      }}
      onPointerUp={() => {
        clear()
        const s = start.current
        start.current = null
        if (!s || longFired.current) return
        if (variant === "lock" && moved.current) {
          if (offset < -55) {
            setOffset(-96)
            setRevealed(true)
          } else {
            setOffset(0)
            setRevealed(false)
          }
          return
        }
        if (variant === "banner" && moved.current) {
          if (offset < -35) onDismiss()
          else setOffset(0)
          return
        }
        if (revealed) {
          setOffset(0)
          setRevealed(false)
          return
        }
        onOpen()
      }}
      onPointerCancel={() => {
        clear()
        start.current = null
        setOffset(revealed ? -96 : 0)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        setExpanded(true)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <span className="notification-icon">
        <Icon name="shield" size={20} />
      </span>
      <span className="notification-copy">
        <span>
          <strong>Time Protector</strong>
          <time>now</time>
        </span>
        <span className="notif-body">Your Stats 203 study block ends in 5 min. Done, or need more time?</span>
      </span>
    </div>
  )

  return (
    <>
      <div className={`notif-wrap ${variant}`}>
        {variant === "lock" && (
          <button
            className="notif-clear"
            aria-label="Clear notification"
            onClick={onDismiss}
            tabIndex={revealed ? 0 : -1}
            // Only show the Clear button once the card is swiped; otherwise it shows through the glass card.
            style={{ opacity: offset < 0 ? 1 : 0, pointerEvents: offset < 0 ? "auto" : "none" }}
          >
            Clear
          </button>
        )}
        {card}
      </div>
      {expanded && (
        <div
          className="notif-expanded"
          data-fp-screen="Notification actions"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setExpanded(false)
          }}
        >
          <div className="notif-expanded-inner">
            <div className="notif-card big">
              <span className="notification-icon">
                <Icon name="shield" size={20} />
              </span>
              <span className="notification-copy">
                <span>
                  <strong>Time Protector</strong>
                  <time>now</time>
                </span>
                <span className="notif-body">Your Stats 203 study block ends in 5 min. Done, or need more time?</span>
              </span>
            </div>
            <div className="notif-actions" role="menu">
              {(
                [
                  ["done", "Done", "check"],
                  ["+30", "+30 min", "plus"],
                  ["need more", "Need more time", "clock"],
                ] as const
              ).map(([id, label, icon]) => (
                <button
                  key={id}
                  role="menuitem"
                  onClick={() => {
                    setExpanded(false)
                    onAction(id)
                  }}
                >
                  {label}
                  <Icon name={icon} size={19} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function LockScreen({
  onOpenApp,
  onOpenCheckin,
  onAction,
}: {
  onOpenApp: () => void
  onOpenCheckin: () => void
  onAction: (action: "done" | "+30" | "need more") => void
}) {
  const { checkin, noteCheckinShown, checkinAction } = useStore()
  const [cleared, setCleared] = useState(false)
  const press = useLongPress(3000, openModerator)
  const pending = checkin === "pending" && !cleared
  useEffect(() => {
    if (checkin === "pending") noteCheckinShown("lock")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <main className="lock-screen" data-fp-screen="Lock screen">
      <div className="lock-status">
        <span>4:55</span>
        <div className="status-icons">
          <span className="signal" />
          <span className="wifi">◒</span>
          <span className="battery" />
        </div>
      </div>
      <div className="lock-heading" {...press.handlers} onContextMenu={(e) => e.preventDefault()}>
        <Icon name="lock" size={17} />
        <p>Tuesday, November 10</p>
        <h1>4:55</h1>
      </div>
      {pending ? (
        <CheckinNotification
          variant="lock"
          onOpen={onOpenCheckin}
          onAction={onAction}
          onDismiss={() => {
            checkinAction("dismissed", "lock")
            setCleared(true)
          }}
        />
      ) : (
        <p className="lock-empty">No older notifications</p>
      )}
      <button className="lock-open" onClick={onOpenApp} aria-label="Open Time Protector">
        <span>Swipe up to open</span>
        <i />
      </button>
    </main>
  )
}

// ---------- Studying screen (N0) ----------

function StudyingScreen({
  autoCheckin,
  trigger,
  onCheckin,
  onBack,
  onDoneEarly,
}: {
  autoCheckin: boolean
  trigger: number
  onCheckin: () => void
  onBack: () => void
  onDoneEarly: () => void
}) {
  const [left, setLeft] = useState(360)
  const fired = useRef(false)
  const press = useLongPress(3000, () => {
    if (!fired.current) {
      fired.current = true
      setLeft((l) => Math.min(l, 300))
      onCheckin()
    }
  })
  useEffect(() => {
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => {
    if (left <= 300 && autoCheckin && !fired.current) {
      fired.current = true
      onCheckin()
    }
  }, [left, autoCheckin, onCheckin])
  useEffect(() => {
    if (trigger > 0 && !fired.current) {
      fired.current = true
      setLeft((l) => Math.min(l, 300))
      onCheckin()
    }
  }, [trigger, onCheckin])
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, "0")
  const clockNow = K.BLOCK_END - Math.ceil(left / 60)
  const progress = (210 * 60 - left) / (210 * 60)
  const r = 104
  const c = 2 * Math.PI * r
  return (
    <main className="studying-screen" data-fp-screen="Studying screen">
      <StatusBar time={clock(clockNow, false)} light />
      <div className="studying-body">
        <span className="studying-kicker">
          <Icon name="book" size={15} /> FOCUS
        </span>
        <h1>Studying: Stats 203 Assignment 4</h1>
        <p>Main Library · 1:30–5:00 pm</p>
        <div className="studying-timer" {...press.handlers} onContextMenu={(e) => e.preventDefault()}>
          <svg width="236" height="236" viewBox="0 0 236 236" aria-hidden="true">
            <circle cx="118" cy="118" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="8" />
            <circle
              cx="118"
              cy="118"
              r={r}
              fill="none"
              stroke="#93c5fd"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - progress)}
              transform="rotate(-90 118 118)"
            />
          </svg>
          <div>
            <strong>
              {mm}:{ss}
            </strong>
            <span>left · ends at 5:00 pm</span>
          </div>
        </div>
        <div className="studying-due">
          <Icon name="flag" size={16} />
          Due Wed 9:00 am · course site
        </div>
        <div className="studying-actions">
          <button className="studying-secondary" onClick={onDoneEarly}>
            I’m done early
          </button>
          <button className="studying-text" onClick={onBack}>
            Back to Today
          </button>
        </div>
      </div>
    </main>
  )
}

// ---------- Check-in sheet (N2) ----------

function CheckinSheet({
  onClose,
  onAction,
}: {
  onClose: () => void
  onAction: (action: "done" | "+30" | "need more") => void
}) {
  const { noteCheckinShown } = useStore()
  useEffect(() => {
    noteCheckinShown("app")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Sheet onClose={onClose}>
      <span className="sheet-kicker">CHECK-IN</span>
      <h2>Your study block ends in 5 min</h2>
      <div className="checkin-block">
        <span className="checkin-block-icon">
          <Icon name="book" size={20} />
        </span>
        <div>
          <strong>Study: Stats 203 Assignment 4</strong>
          <span>1:30–5:00 pm · due Wed 9:00 am</span>
          <SourceChip source="Course site" />
        </div>
      </div>
      <p className="sheet-detail">Done, or need more time? I won’t change anything until you choose.</p>
      <div className="checkin-buttons">
        <button className="secondary-button" onClick={() => onAction("done")}>
          Done
        </button>
        <button className="secondary-button" onClick={() => onAction("+30")}>
          +30 min
        </button>
      </div>
      <button className="primary-button" onClick={() => onAction("need more")}>
        I need more time
      </button>
    </Sheet>
  )
}

// ---------- Today (H1) ----------

const todaySegs: Seg[] = [
  { from: t(1, 13), to: t(2, 0) },
  { from: t(2, 6), to: t(2, 9, 30) },
]

function TonightCard() {
  const { schedule } = useStore()
  const dinner = schedule.find((e) => e.id === "tue-dinner")!
  const wind = schedule.find((e) => e.id === "tue-wind")!
  const sleep = schedule.find((e) => e.id === "wed-sleep")!
  const allKept = !dinner.status && !wind.status && !sleep.status
  const rows: { icon: string; label: string; time: string; note?: string; tone?: string }[] = [
    { icon: "dinner", label: "Dinner", time: clock(dinner.start), note: dinner.status === "moved" ? "moved" : undefined, tone: dinner.status ? "amber" : undefined },
    { icon: "moon", label: "Wind-down", time: clock(wind.start), note: wind.status === "used" ? (wind.note ?? "used") : undefined, tone: wind.status ? "amber" : undefined },
    { icon: "moon", label: "Sleep", time: clock(sleep.start), note: sleep.status === "shortened" ? sleep.note : undefined, tone: sleep.status ? "red" : undefined },
  ]
  return (
    <section className="card tonight-card">
      <div className="tonight-head">
        <span className="tonight-shield">
          <Icon name="shield" size={18} />
        </span>
        <div>
          <h2>{allKept ? "Tonight is protected" : "Tonight, with your changes"}</h2>
          <p>{allKept ? "Nothing here moves unless you say so." : "You chose these changes. Undo anytime in History."}</p>
        </div>
      </div>
      <div className="tonight-items">
        {rows.map((r) => (
          <div key={r.label} className={`tonight-item ${r.tone ?? ""}`}>
            <Icon name={r.icon} size={16} />
            <span>
              <strong>{r.label}</strong>
              <small>{r.note ? `${r.time} · ${r.note}` : r.time}</small>
            </span>
            {r.tone ? <Icon name="alert" size={14} /> : <Icon name="lock" size={14} />}
          </div>
        ))}
      </div>
    </section>
  )
}

function OverloadCard({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
  return (
    <section className="overload-card">
      <div className="overload-head">
        <span>
          <Icon name="alert" size={18} />
        </span>
        <p>
          <strong>Thursday looks heavy</strong>
          9 h planned, 0 h free, and your team sync at 6:00 pm. Want me to spread things out?
        </p>
      </div>
      <div className="overload-actions">
        <button className="primary-button" onClick={onOpen}>
          See options
        </button>
        <button className="secondary-button" onClick={onDismiss}>
          Not now
        </button>
      </div>
    </section>
  )
}

function Today({
  onAvatar,
  onCheckin,
  onEvent,
  onPlan,
  overloadAlert,
  onOverload,
}: {
  onAvatar: () => void
  onCheckin: (action: "done" | "+30" | "need more") => void
  onEvent: (e: CalEvent) => void
  onPlan: (id: string) => void
  overloadAlert: boolean
  onOverload: () => void
}) {
  const store = useStore()
  const { schedule, checkin, activeReplan, plans, sources, overloadDismissed, dismissOverload, undoPlan, showToast } = store
  const extendPlan = plans.find((p) => p.status === "active" && p.kind === "extend")
  const thuHeavy = workload(schedule, 3).heavy
  const gaps = gapsIn(schedule, NOW, t(1, 23, 15), 30)
  const tue = workload(schedule, TODAY)
  const nextBlock = activeReplan
    ? [...activeReplan.blocks].sort((a, b) => a.start - b.start).find((b) => b.end > NOW)
    : undefined
  const blockEnd = schedule.find((e) => e.id === "tue-study")!.end
  return (
    <main className="screen today-screen">
      <Header eyebrow={`Good afternoon, ${user.firstName}`} title="Tuesday, Nov 10" onAvatar={onAvatar} />
      {!sources.calendar && (
        <div className="paused-banner">
          <Icon name="calendar" size={18} />
          <p>
            <strong>Google Calendar is disconnected.</strong>I can’t see new events until you reconnect.
          </p>
        </div>
      )}
      {checkin === "pending" && (
        <section className="checkin-card">
          <div className="checkin-card-top">
            <span className="sparkle">
              <Icon name="bell" size={16} />
            </span>
            <h2>Check-in</h2>
            <time>now</time>
          </div>
          <h3>Your study block ends in 5 min</h3>
          <p>Study: Stats 203 Assignment 4 · 1:30–5:00 pm · due Wed 9:00 am</p>
          <div className="checkin-buttons">
            <button className="secondary-button" onClick={() => onCheckin("done")}>
              Done
            </button>
            <button className="secondary-button" onClick={() => onCheckin("+30")}>
              +30 min
            </button>
          </div>
          <button className="primary-button" onClick={() => onCheckin("need more")}>
            I need more time
          </button>
        </section>
      )}
      {checkin === "extended" && extendPlan && (
        <section className="status-card">
          <span className="success-circle">
            <Icon name="check" size={16} />
          </span>
          <p>
            <strong>Extended to 5:30 pm</strong>
            You still leave for dinner at 6:15 ✓
          </p>
          <button
            onClick={() => {
              undoPlan(extendPlan.id, "today")
              showToast("Undone. Your block ends at 5:00 pm again.")
            }}
          >
            Undo
          </button>
        </section>
      )}
      {checkin === "done" && !activeReplan && (
        <section className="status-card">
          <span className="success-circle">
            <Icon name="check" size={16} />
          </span>
          <p>
            <strong>Study block complete</strong>
            Tonight stays yours.
          </p>
        </section>
      )}
      {activeReplan && (
        <section className="plan-card">
          <div>
            <span className="plan-card-kicker">
              <Icon name="check" size={14} /> PLAN SET · {activeReplan.name.toUpperCase()}
            </span>
            <strong>
              {nextBlock
                ? `Next study block: ${dayOf(nextBlock.start) === TODAY ? clock(nextBlock.start) : dayClock(nextBlock.start)}`
                : "All study blocks are done"}
            </strong>
            <small>
              {dur(activeReplan.blocks.reduce((s, b) => s + b.end - b.start, 0))} added ·{" "}
              {activeReplan.blocks.length} block{activeReplan.blocks.length > 1 ? "s" : ""}
            </small>
          </div>
          <button onClick={() => onPlan(activeReplan.id)}>View plan</button>
        </section>
      )}
      {overloadAlert && thuHeavy && !overloadDismissed && (
        <OverloadCard onOpen={onOverload} onDismiss={dismissOverload} />
      )}
      <TonightCard />
      <div className="deadline-chip">
        <Icon name="flag" size={15} />
        <span>
          <strong>Stats 203 Assignment 4</strong>
          <small>Due Wed 9:00 am</small>
        </span>
        <SourceChip source="Course site" />
      </div>
      <section className="content-section">
        <div className="section-title-row">
          <h2>Today</h2>
          <span>
            {dur(tue.free)} free {blockEnd > K.BLOCK_END ? "after 5:30 pm" : "before your deadline"}
          </span>
        </div>
        <div className="card timeline-card">
          <Timeline
            segs={todaySegs}
            ppm={1.25}
            events={schedule}
            now={NOW}
            gaps={gaps}
            onEvent={onEvent}
            bandLabel="Wed"
          />
        </div>
      </section>
    </main>
  )
}

// ---------- Week (W1) and day view ----------

function Week({
  onAvatar,
  onDay,
  overloadAlert,
  onOverload,
}: {
  onAvatar: () => void
  onDay: (day: number) => void
  overloadAlert: boolean
  onOverload: () => void
}) {
  const { schedule, overloadDismissed, dismissOverload } = useStore()
  const loads = Array.from({ length: 7 }, (_, d) => workload(schedule, d))
  const startHour = 7
  const hours = 17
  const hh = 26
  const yOf = (abs: number) => ((abs % 1440) / 60 - startHour) * hh
  const visible = schedule.filter(
    (e) => e.status !== "ghost" && e.kind !== "reminder" && dayOf(e.start) <= 6 && ((e.start % 1440) / 60 >= startHour - 0.01 || e.kind === "deadline"),
  )
  const heavyDay = loads.findIndex((l) => l.heavy)
  return (
    <main className="screen week-screen">
      <Header eyebrow="Nov 9–15" title="Week" onAvatar={onAvatar} />
      {overloadAlert && heavyDay === 3 && !overloadDismissed && (
        <OverloadCard onOpen={onOverload} onDismiss={dismissOverload} />
      )}
      <div className="week-card card">
        <div className="week-days">
          {loads.map((l, d) => {
            const total = l.planned + l.free
            const share = total ? l.planned / total : 0
            return (
              <button
                key={d}
                className={`${d === TODAY ? "selected" : ""} ${l.heavy ? "heavy" : ""} ${d < TODAY ? "past" : ""}`}
                onClick={() => onDay(d)}
                aria-label={`${longDateLabel(d)}: ${dur(l.planned)} planned, ${dur(l.free)} free`}
              >
                <span>{DAY_SHORT[d][0]}</span>
                <strong>{9 + d}</strong>
                <i className="load-bar">
                  <b style={{ width: `${Math.round(share * 100)}%` }} />
                </i>
                <small>{Math.round(l.planned / 6) / 10}h</small>
              </button>
            )
          })}
        </div>
        {heavyDay >= 0 && (
          <button className="heavy-callout" onClick={() => onDay(heavyDay)}>
            <Icon name="alert" size={16} />
            <span>
              <strong>{DAY_SHORT[heavyDay]} · Heavy:</strong> {dur(loads[heavyDay].planned)} planned, 0 h free
            </span>
            <Icon name="chevron" size={16} />
          </button>
        )}
        <div className="week-grid" style={{ height: hours * hh + 6 }}>
          {Array.from({ length: hours + 1 }, (_, i) => i + startHour).map((h, i) => (
            <div className="hour-line" style={{ top: i * hh }} key={h}>
              {i % 2 === 1 && <span>{h === 24 ? "12a" : h > 12 ? `${h - 12}p` : h === 12 ? "12p" : `${h}a`}</span>}
            </div>
          ))}
          {Array.from({ length: 7 }, (_, d) => (
            <button
              key={`col-${d}`}
              className={`week-col ${loads[d].heavy ? "heavy" : ""}`}
              style={{ left: `calc(34px + ${d} * (100% - 34px) / 7)`, width: "calc((100% - 34px) / 7)" }}
              onClick={() => onDay(d)}
              aria-label={`Open ${longDateLabel(d)}`}
            />
          ))}
          {visible.map((e) => {
            const d = dayOf(e.start)
            const left = `calc(34px + ${d} * (100% - 34px) / 7 + 1px)`
            const width = "calc((100% - 34px) / 7 - 3px)"
            if (e.kind === "deadline") {
              return (
                <div key={e.id} className="wk-flag" style={{ top: Math.min(yOf(e.start), hours * hh - 22), left, width }}>
                  <Icon name="flag" size={10} />
                  <b>{e.short}</b>
                </div>
              )
            }
            const endAbs = Math.min(e.end, t(d + 1, 0))
            const top = yOf(e.start)
            const height = Math.max(((endAbs - e.start) / 60) * hh - 1.5, 5)
            return (
              <div
                key={e.id}
                className={`wk-event kind-${e.kind} ${e.protect ? "protected" : ""} ${e.status ? `status-${e.status}` : ""}`}
                style={{ top, height, left, width }}
              >
                {height > 20 && <b>{e.protect ? "🔒" : ""}{shortTitle(e)}</b>}
              </div>
            )
          })}
          <div className="now-line" style={{ top: yOf(NOW), left: `calc(34px + (100% - 34px) / 7)`, width: `calc((100% - 34px) / 7)` }}>
            <span />
          </div>
        </div>
        <div className="week-legend">
          <span>
            <i className="lg-study" /> Study
          </span>
          <span>
            <i className="lg-protected" /> Protected
          </span>
          <span>
            <i className="lg-fixed" /> Fixed
          </span>
          <span>
            <Icon name="flag" size={11} /> Due
          </span>
        </div>
      </div>
      <section className="content-section">
        <div className="section-title-row">
          <h2>Workload</h2>
          <span>planned vs free</span>
        </div>
        <div className="card workload-list">
          {loads.map((l, d) => {
            const total = l.planned + l.free
            return (
              <button key={d} onClick={() => onDay(d)} className={l.heavy ? "heavy" : ""}>
                <span className="wl-day">
                  <strong>{dateLabel(d)}</strong>
                  <small>
                    {d < TODAY
                      ? `${dur(l.planned)} done`
                      : l.heavy
                        ? `Heavy: ${dur(l.planned)} planned, 0 h free`
                        : `${dur(l.planned)} planned · ${dur(l.free)} free`}
                  </small>
                </span>
                <i className="wl-bar">
                  <b style={{ width: `${total ? (l.planned / total) * 100 : 100}%` }} />
                </i>
                <Icon name="chevron" size={16} />
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function shortTitle(e: CalEvent) {
  return e.title
    .replace("Study: ", "")
    .replace("Stats 203 ", "203 ")
    .replace("Design 213 ", "213 ")
    .replace("Assignment ", "A")
    .replace("Milestone ", "M")
    .replace("Research assistant (RA) shift", "RA")
    .replace("Get ready and commute", "Commute")
}

function DayView({
  day,
  onBack,
  onEvent,
  onOverload,
}: {
  day: number
  onBack: () => void
  onEvent: (e: CalEvent) => void
  onOverload: () => void
}) {
  const { schedule } = useStore()
  const l = workload(schedule, day)
  const segs: Seg[] = [{ from: t(day, 7), to: t(day + 1, 0) }]
  const deadlines = schedule.filter((e) => e.kind === "deadline" && dayOf(e.start) === day)
  const gaps = day >= TODAY ? gapsIn(schedule, day === TODAY ? NOW : t(day, 8), t(day, 23, 15), 45) : []
  return (
    <main className="flow-screen day-screen">
      <FlowHeader title={dateLabel(day)} onBack={onBack} />
      <div className="flow-scroll day-scroll">
        <h1>{longDateLabel(day)}</h1>
        <div className={`day-summary ${l.heavy ? "heavy" : ""}`}>
          <span>
            <strong>{dur(l.planned)}</strong>
            <small>{day < TODAY ? "done" : "planned"}</small>
          </span>
          <span>
            <strong>{day < TODAY ? "–" : dur(l.free)}</strong>
            <small>free</small>
          </span>
          {l.heavy && <b>Heavy</b>}
        </div>
        {deadlines.map((d) => (
          <div className="deadline-chip" key={d.id}>
            <Icon name="flag" size={15} />
            <span>
              <strong>{d.title.replace(/ due$/, "")}</strong>
              <small>Due {clock(d.start)}</small>
            </span>
            <SourceChip source="Course site" />
          </div>
        ))}
        {l.heavy && (
          <button className="heavy-callout inline" onClick={onOverload}>
            <Icon name="alert" size={16} />
            <span>
              <strong>Heavy:</strong> {dur(l.planned)} planned, 0 h free. Spread things out?
            </span>
            <Icon name="chevron" size={16} />
          </button>
        )}
        <div className="card timeline-card">
          <Timeline segs={segs} ppm={0.95} events={schedule} now={day === TODAY ? NOW : undefined} gaps={gaps} onEvent={onEvent} />
        </div>
      </div>
    </main>
  )
}

// ---------- Block detail (W2) ----------

function BlockSheet({
  event,
  onClose,
  onDone,
  onNeedMore,
  onMove,
  onSettings,
}: {
  event: CalEvent
  onClose: () => void
  onDone: () => void
  onNeedMore: () => void
  onMove: (planId: string) => void
  onSettings: () => void
}) {
  const { rules, protectedExtra, toggleProtectExtra, showToast, checkin } = useStore()
  const isCurrent = event.id === "tue-study"
  const isNew = event.status === "new" && Boolean(event.planId)
  const isStudy = event.kind === "study"
  const baseProtected = ["dinner", "winddown", "sleep", "gym", "family", "meal"].includes(event.protect ?? "") && !protectedExtra.includes(event.id)
  const extraProtected = protectedExtra.includes(event.id)
  const ruleLevel =
    event.protect === "gym"
      ? rules.gym.level
      : event.protect === "sleep" || event.protect === "winddown"
        ? rules.sleep.level
        : event.protect === "dinner" || event.protect === "meal"
          ? rules.meals.level
          : null
  const typeLabel = isStudy
    ? "Study block"
    : event.kind === "class"
      ? "Class"
      : event.kind === "work"
        ? "Work"
        : event.kind === "meeting"
          ? "Meeting"
          : event.kind === "travel"
            ? "Travel"
            : baseProtected
              ? "Protected time"
              : "Personal"
  const future = event.start > NOW
  const actions: { label: string; icon: string; enabled: boolean; reason: string; run: () => void }[] = [
    {
      label: "Mark done",
      icon: "check",
      enabled: isCurrent && checkin !== "done",
      reason: isCurrent ? "Already done" : future ? `Starts ${dayClock(event.start)}` : "Only for study blocks",
      run: onDone,
    },
    {
      label: "Need more time",
      icon: "clock",
      enabled: isCurrent || isNew,
      reason: isStudy ? "Check-ins start 5 min before it ends" : "Only for study blocks",
      run: onNeedMore,
    },
    {
      label: "Move",
      icon: "arrow",
      enabled: isNew,
      reason: isCurrent ? "It’s in progress" : "Fixed in your calendar",
      run: () => event.planId && onMove(event.planId),
    },
    {
      label: extraProtected ? "Unprotect" : "Protect this",
      icon: "lock",
      enabled: !baseProtected && !isCurrent && future,
      reason: baseProtected ? "Already protected" : isCurrent ? "It’s in progress" : "It’s in the past",
      run: () => {
        toggleProtectExtra(event.id)
        showToast(extraProtected ? `${event.title} is no longer protected.` : `Protected. I won’t move or use ${event.title}.`)
      },
    },
  ]
  return (
    <Sheet onClose={onClose}>
      <div className={`sheet-icon ${baseProtected ? "event-protected" : isStudy ? "" : "event-gray"}`}>
        <Icon name={eventIcon(event)} size={24} />
      </div>
      <SourceChip source={event.source} />
      <h2>{event.title}</h2>
      <p className="sheet-detail">
        {dayRange(event.start, event.end)} · {dur(event.end - event.start)}
      </p>
      <p className="sheet-meta">
        {typeLabel}
        {event.location ? ` · ${event.location}` : ""}
        {event.people ? ` · with ${event.people}` : ""}
      </p>
      {event.detail && <p className="sheet-meta">{event.detail}</p>}
      {event.note && event.status !== "ghost" && (
        <div className={`block-note ${event.tone ?? "blue"}`}>
          <Icon name={event.tone ? "alert" : "info"} size={16} />
          {event.note}
        </div>
      )}
      {baseProtected ? (
        <div className="protected-panel">
          <Icon name="lock" size={18} />
          <p>
            <strong>Protected{ruleLevel ? ` · ${levelLabel[ruleLevel]}` : ""}</strong>
            {ruleLevel === "hard" || !ruleLevel
              ? "I never move or use this time unless you unlock it."
              : ruleLevel === "soft"
                ? "When you’re behind, I may suggest moving it. I always ask first."
                : "Not protected right now."}
          </p>
          {ruleLevel && (
            <button onClick={onSettings}>Change</button>
          )}
        </div>
      ) : (
        <div className="block-actions">
          {actions.map((a) => (
            <button key={a.label} disabled={!a.enabled} onClick={a.run}>
              <Icon name={a.icon} size={19} />
              <strong>{a.label}</strong>
              {!a.enabled && <small>{a.reason}</small>}
            </button>
          ))}
        </div>
      )}
      <button className="secondary-button" onClick={onClose}>
        Close
      </button>
    </Sheet>
  )
}

// ---------- Re-plan flow (F1–F6) ----------

type FlowStep = "howMuch" | "protect" | "options" | "conflict" | "preview" | "set" | "extension"

interface Draft {
  name: string
  template: string
  blocks: Block[]
  allowed: Lockable[]
  costLocked: Lockable[]
  extras: Extras
  conflictKey?: ConflictKey
}

const CHIPS = [30, 60, 120, 180, 240]

function extensionBody(need: number) {
  const hours = need % 60 === 0 ? `${need / 60}` : dur(need)
  return `Hi Alex, I’ve finished about 60% of Assignment 4 and need roughly ${hours} more hours. Could I submit by Wed 5:00 pm instead of 9:00 am? Happy to share what I have now.`
}

function OptionCard({
  name,
  times,
  keeps,
  changes,
  onClick,
}: {
  name: string
  times: string
  keeps: Chip[]
  changes: Chip[]
  onClick: () => void
}) {
  return (
    <button className="option-card" onClick={onClick}>
      <div className="option-top">
        <span>
          <h2>{name}</h2>
          <p>{times}</p>
        </span>
        <Icon name="chevron" size={19} />
      </div>
      <div className="option-row">
        <small>Keeps</small>
        <div>
          {keeps.length ? keeps.map((c) => <ChipView chip={c} key={c.text} />) : <span className="plan-chip none">Nothing protected</span>}
        </div>
      </div>
      <div className="option-row">
        <small>Changes</small>
        <div>
          {changes.length ? changes.map((c) => <ChipView chip={c} key={c.text} />) : <span className="plan-chip neutral">Nothing else changes</span>}
        </div>
      </div>
    </button>
  )
}

function ReplanFlow({
  editPlanId,
  onExit,
  onViewPlan,
}: {
  editPlanId?: string
  onExit: () => void
  onViewPlan: (id: string) => void
}) {
  const store = useStore()
  const { rules, blockEnd, activeReplan, changeMode, setRule, applyPlan, updatePlan, undoPlan, showToast } = store
  const editPlan = editPlanId ? store.plans.find((p) => p.id === editPlanId) : undefined
  const initialUnlocked = (): Record<Lockable, boolean> => ({
    dinner: rules.meals.level !== "hard",
    winddown: rules.sleep.level !== "hard",
    sleep: rules.sleep.level !== "hard",
    gym: rules.gym.level !== "hard",
  })
  const [step, setStep] = useState<FlowStep>(editPlan ? "preview" : "howMuch")
  const [need, setNeed] = useState<number | null>(editPlan?.need ?? null)
  const [customNeed, setCustomNeed] = useState<number | null>(null)
  const [estimateUsed, setEstimateUsed] = useState(false)
  const [deadline, setDeadline] = useState(editPlan?.deadline ?? K.DEADLINE)
  const [unlocked, setUnlocked] = useState<Record<Lockable, boolean>>(editPlan?.unlockedAt ?? initialUnlocked)
  const [scope, setScope] = useState<Record<Lockable, "once" | "always">>(() => {
    const u = initialUnlocked()
    return { dinner: u.dinner ? "always" : "once", winddown: u.winddown ? "always" : "once", sleep: u.sleep ? "always" : "once", gym: u.gym ? "always" : "once" }
  })
  const [draft, setDraft] = useState<Draft | null>(
    editPlan
      ? { name: editPlan.name, template: "edit", blocks: editPlan.blocks, allowed: editPlan.allowed, costLocked: editPlan.costLocked, extras: editPlan.extras }
      : null,
  )
  const [previewFrom, setPreviewFrom] = useState<"options" | "conflict" | "extension">("options")
  const [adjustments, setAdjustments] = useState(0)
  const [appliedId, setAppliedId] = useState<string | null>(editPlan?.id ?? null)
  const [autoApplied, setAutoApplied] = useState(false)
  const [sheet, setSheet] = useState<null | "estimate" | "why" | "deadline" | "custom" | "message">(null)
  const [estimatePct, setEstimatePct] = useState(60)
  const [customValue, setCustomValue] = useState(150)
  const [ext, setExt] = useState({ body: "", edited: false, sent: false })
  const [msgSent, setMsgSent] = useState(false)
  const optionsShownAt = useRef(0)
  const lastFitOk = useRef(true)

  const ctx: PlanCtx = useMemo(
    () => ({ blockEnd, deadline, unlocked, noWorkAfter: rules.noWorkAfter, sleepMin: rules.sleep.minHours * 60 }),
    [blockEnd, deadline, unlocked, rules.noWorkAfter, rules.sleep.minHours],
  )
  const generated = useMemo(() => (need ? generateOptions(need, ctx) : null), [need, ctx])
  const lockedList = LOCKABLES.filter((k) => !unlocked[k])

  const go = (s: FlowStep) => {
    setStep(s)
    document.querySelector(".flow-scroll")?.scrollTo({ top: 0 })
  }

  const findOptions = () => {
    if (!generated || !need) return
    const changedRules: string[] = []
    for (const k of LOCKABLES) {
      const rule = ruleFor[k]
      if (unlocked[k] && scope[k] === "always" && (rules[rule] as { level: Level }).level === "hard" && !changedRules.includes(rule)) {
        setRule(rule, { level: "soft" } as Partial<Rules[typeof rule]>, "replan_always")
        changedRules.push(rule)
      }
    }
    if (changedRules.length)
      showToast(`${changedRules.map((r) => (r === "meals" ? "Meals with friends" : r === "sleep" ? "Sleep" : "Gym")).join(" and ")} set to Soft in Settings`)
    if (generated.mode === "conflict") {
      logFootprint("options_view", { mode: "conflict", fit: generated.fit, need })
      go("conflict")
      return
    }
    const top = generated.options[0]
    const topFx = describePlan(top, unlocked, ctx.sleepMin)
    const nothingProtected = topFx.changes.every((c) => c.tone === "neutral") && top.allowed.length === 0
    if (changeMode === "auto" && nothingProtected && !editPlan) {
      const id = applyPlan({
        kind: "replan",
        name: top.name,
        need,
        blocks: top.blocks,
        allowed: top.allowed,
        costLocked: [],
        unlockedAt: unlocked,
        extras: top.extras ?? {},
        deadline,
        auto: true,
      })
      setDraft({ name: top.name, template: top.template, blocks: top.blocks, allowed: top.allowed, costLocked: [], extras: top.extras ?? {} })
      setAppliedId(id)
      setAutoApplied(true)
      go("set")
      return
    }
    optionsShownAt.current = Date.now()
    logFootprint("options_view", {
      count: generated.options.length,
      order: generated.options.map((o) => o.name).join(" | "),
    })
    go("options")
  }

  const pickOption = (o: OptionPlan, index: number) => {
    logFootprint("option_select", {
      option: o.name,
      position: index + 1,
      seconds_on_options: Math.round((Date.now() - optionsShownAt.current) / 1000),
    })
    setDraft({
      name: o.name,
      template: o.template,
      blocks: o.blocks.map((b) => ({ ...b })),
      allowed: o.allowed,
      costLocked: o.allowed.filter((k) => !unlocked[k]),
      extras: o.extras ?? {},
    })
    setAdjustments(0)
    setPreviewFrom("options")
    go("preview")
  }

  const pickConflict = (c: ConflictChoice) => {
    const warn = document.querySelector("[data-sleep-warning]")
    const rect = warn?.getBoundingClientRect()
    const visible = Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0)
    logFootprint("conflict_choice", { choice: c.key, sleep_warning_on_screen: visible })
    if (c.key === "extension") {
      setExt({ body: extensionBody(need ?? 240), edited: false, sent: store.extensionSent })
      go("extension")
      return
    }
    if (!c.plan) return
    setDraft({
      name: c.plan.name,
      template: c.plan.template,
      blocks: c.plan.blocks.map((b) => ({ ...b })),
      allowed: c.plan.allowed,
      costLocked: c.key === "gym" || c.key === "winddown" || c.key === "sleep" ? [c.key] : [],
      extras: c.plan.extras ?? {},
      conflictKey: c.key,
    })
    setAdjustments(0)
    setPreviewFrom("conflict")
    go("preview")
  }

  const check = draft ? fitCheck(draft.blocks, draft.allowed, blockEnd, deadline) : null
  useEffect(() => {
    if (!check) return
    if (!check.ok && lastFitOk.current) logFootprint("fit_check_fail", { reason: check.text })
    lastFitOk.current = check.ok
  }, [check?.ok, check?.text])

  const moveBlock = (id: string, start: number) =>
    setDraft((d) => (d ? { ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, start, end: start + (b.end - b.start) } : b)) } : d))
  const nudge = (id: string, delta: number, index: number) => {
    const b = draft?.blocks.find((x) => x.id === id)
    if (!b) return
    moveBlock(id, b.start + delta)
    setAdjustments((n) => n + 1)
    logFootprint("preview_adjust", { block: index + 1, minutes: delta, how: "button", adjustments: adjustments + 1 })
  }

  const apply = () => {
    if (!draft || !check?.ok) return
    if (editPlan) {
      updatePlan(editPlan.id, draft.blocks)
      setAppliedId(editPlan.id)
      go("set")
      return
    }
    const id = applyPlan({
      kind: "replan",
      name: draft.name,
      need: need ?? undefined,
      blocks: draft.blocks,
      allowed: draft.allowed,
      costLocked: draft.costLocked,
      unlockedAt: unlocked,
      extras: draft.extras,
      deadline,
    })
    setAppliedId(id)
    go("set")
  }

  // ----- F1: How much more time? -----
  if (step === "howMuch") {
    const chipLabel = (m: number) => dur(m)
    return (
      <main className="flow-screen replan-screen">
        <FlowHeader title="Need more time" onBack={onExit} />
        <div className="flow-scroll replan-scroll">
          <span className="flow-kicker">STUDY: STATS 203 ASSIGNMENT 4</span>
          <h1>How much more time?</h1>
          <p className="flow-intro">Your best guess is fine. You can adjust the times later.</p>
          {activeReplan && (
            <div className="replace-note">
              <Icon name="info" size={16} />
              This replaces tonight’s plan, “{activeReplan.name}”. You can undo it after.
            </div>
          )}
          <div className="time-chips" role="radiogroup" aria-label="How much more time">
            {CHIPS.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={need === m && customNeed === null}
                className={need === m && customNeed === null ? "selected" : ""}
                onClick={() => {
                  setNeed(m)
                  setCustomNeed(null)
                }}
              >
                {chipLabel(m)}
              </button>
            ))}
            <button
              role="radio"
              aria-checked={customNeed !== null}
              className={customNeed !== null ? "selected" : ""}
              onClick={() => {
                setCustomValue(customNeed ?? need ?? 150)
                setSheet("custom")
              }}
            >
              {customNeed !== null ? dur(customNeed) : "Custom"}
            </button>
          </div>
          <button className="link-button" onClick={() => setSheet("estimate")}>
            <Icon name="sparkle" size={16} />
            Not sure? Help me estimate
          </button>
          <div className="deadline-card">
            <span className="deadline-icon">
              <Icon name="flag" size={18} />
            </span>
            <span>
              <small>DEADLINE</small>
              <strong>Due {dayClock(deadline)}</strong>
              <SourceChip source={deadline === K.DEADLINE ? "Course site" : "Edited by you"} />
            </span>
            <button onClick={() => setSheet("deadline")}>Edit</button>
          </div>
          <button
            className="primary-button"
            disabled={!need}
            onClick={() => {
              logFootprint("time_needed", { minutes: need ?? 0, custom: customNeed !== null, estimate_used: estimateUsed })
              go("protect")
            }}
          >
            Next
          </button>
        </div>
        {sheet === "estimate" && (
          <Sheet onClose={() => setSheet(null)}>
            {(() => {
              const spent = 210
              const left = Math.round((spent * (100 - estimatePct)) / estimatePct / 5) * 5
              const down = Math.max(30, Math.floor(left / 30) * 30)
              const up = Math.max(down + 30, Math.ceil(left / 30) * 30)
              const choose = (m: number) => {
                setNeed(m)
                setCustomNeed(CHIPS.includes(m) ? null : m)
                setEstimateUsed(true)
                logFootprint("estimate_use", { percent: estimatePct, minutes: m })
                setSheet(null)
              }
              return (
                <>
                  <span className="sheet-kicker">HELP ME ESTIMATE</span>
                  <h2>How far along are you?</h2>
                  <div className="estimate-slider">
                    <input
                      type="range"
                      min={5}
                      max={95}
                      step={5}
                      value={estimatePct}
                      aria-label="How far along are you, in percent"
                      onChange={(e) => setEstimatePct(Number(e.target.value))}
                    />
                    <output>{estimatePct}%</output>
                  </div>
                  <div className="estimate-fact">
                    <span>Time spent so far</span>
                    <strong>{dur(spent)}</strong>
                    <SourceChip source="Calendar" />
                  </div>
                  <div className="estimate-result">
                    That’s about <strong>{dur(left)}</strong> left. Round to {dur(down)}?
                  </div>
                  <button className="primary-button" onClick={() => choose(down)}>
                    Use {dur(down)}
                  </button>
                  <button className="secondary-button" onClick={() => choose(up)}>
                    Use {dur(up)}
                  </button>
                </>
              )
            })()}
          </Sheet>
        )}
        {sheet === "custom" && (
          <Sheet onClose={() => setSheet(null)}>
            <span className="sheet-kicker">CUSTOM</span>
            <h2>How much more time?</h2>
            <div className="stepper">
              <button aria-label="15 minutes less" disabled={customValue <= 30} onClick={() => setCustomValue((v) => Math.max(30, v - 15))}>
                <Icon name="minus" size={22} />
              </button>
              <strong>{dur(customValue)}</strong>
              <button aria-label="15 minutes more" disabled={customValue >= 360} onClick={() => setCustomValue((v) => Math.min(360, v + 15))}>
                <Icon name="plus" size={22} />
              </button>
            </div>
            <p className="sheet-meta center">In 15-minute steps, up to 6 h.</p>
            <button
              className="primary-button"
              onClick={() => {
                setNeed(customValue)
                setCustomNeed(CHIPS.includes(customValue) ? null : customValue)
                setSheet(null)
              }}
            >
              Use {dur(customValue)}
            </button>
          </Sheet>
        )}
        {sheet === "deadline" && (
          <Sheet onClose={() => setSheet(null)}>
            <span className="sheet-kicker">DEADLINE</span>
            <h2>When is it due?</h2>
            <p className="sheet-detail">I found this on the course site. Change it only if your TA agreed to a new time.</p>
            <div className="scope-options">
              {[
                [K.DEADLINE, "Wed Nov 11, 9:00 am", "From the course site"],
                [K.DEADLINE_LATE, "Wed Nov 11, 5:00 pm", "Only if Alex agreed to an extension"],
              ].map(([value, label, detail]) => (
                <button
                  key={value}
                  className={deadline === value ? "selected" : ""}
                  onClick={() => {
                    setDeadline(value as number)
                    logFootprint("deadline_edit", { deadline: label as string })
                    setSheet(null)
                  }}
                >
                  <span />
                  <div>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </div>
                </button>
              ))}
            </div>
          </Sheet>
        )}
      </main>
    )
  }

  // ----- F2: What stays protected? -----
  if (step === "protect") {
    return (
      <main className="flow-screen replan-screen">
        <FlowHeader title="Need more time" onBack={() => go("howMuch")} />
        <div className="flow-scroll replan-scroll">
          <span className="flow-kicker">{dur(need ?? 0).toUpperCase()} MORE · DUE {dayClock(deadline).toUpperCase()}</span>
          <h1>What stays protected?</h1>
          <p className="flow-intro">Unlock anything you’re willing to move this time.</p>
          <div className="protect-list">
            {LOCKABLES.map((k) => {
              const locked = !unlocked[k]
              const rule = ruleFor[k]
              const level = (rules[rule] as { level: Level }).level
              const detail =
                k === "winddown"
                  ? `11:15 pm · ${rules.sleep.windDown} min, no work before bed`
                  : k === "sleep"
                    ? `${rules.sleep.minHours} h minimum`
                    : lockLabels[k].detail
              return (
                <section key={k} className={locked ? "locked" : "unlocked"}>
                  <div className="protect-row">
                    <span className="protect-icon">
                      <Icon name={lockIcon[k]} size={19} />
                    </span>
                    <span className="protect-text">
                      <strong>{lockLabels[k].title}</strong>
                      <small>{detail}</small>
                      <span className={`protect-state ${locked ? "on" : ""}`}>
                        <Icon name={locked ? "lock" : "unlock"} size={14} />
                        {locked ? "Protected" : "Unlocked"}
                      </span>
                    </span>
                    <Toggle
                      checked={locked}
                      label={`Protect ${lockLabels[k].title}`}
                      onChange={(on) => {
                        setUnlocked((u) => ({ ...u, [k]: !on }))
                        logFootprint("protect_toggle", { item: k, on, scope: scope[k] })
                      }}
                    />
                  </div>
                  {!locked && (
                    <div className="scope-row">
                      <div className="autonomy-segments" role="radiogroup" aria-label={`How long to unlock ${lockLabels[k].title}`}>
                        {(["once", "always"] as const).map((s) => (
                          <button
                            key={s}
                            role="radio"
                            aria-checked={scope[k] === s}
                            className={scope[k] === s ? "selected" : ""}
                            onClick={() => {
                              setScope((sc) => ({ ...sc, [k]: s }))
                              logFootprint("protect_toggle", { item: k, on: false, scope: s })
                            }}
                          >
                            {s === "once" ? "Just this time" : "Always"}
                          </button>
                        ))}
                      </div>
                      <p>
                        {scope[k] === "once"
                          ? "Back to protected after tonight."
                          : level === "hard"
                            ? `Updates Settings: ${k === "dinner" ? "meals with friends" : k === "gym" ? "the gym" : "sleep"} becomes Soft (can move when you’re behind).`
                            : `${levelLabel[level]} in Settings already.`}
                      </p>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
          <p className="settings-control-note">
            <Icon name="lock" size={14} />
            Nothing moves until you approve a plan.
          </p>
          <button className="primary-button" onClick={findOptions}>
            Find options
          </button>
        </div>
      </main>
    )
  }

  // ----- F3: Your options -----
  if (step === "options" && generated?.mode === "options") {
    const n = generated.options.length
    // Don't promise that protected time stays: some options (e.g. Morning push) move it, flagged with ⚠.
    const header = `${n} option${n === 1 ? "" : "s"} · changes to protected time are flagged ⚠`
    const windows = freeWindows(ctx)
    return (
      <main className="flow-screen replan-screen">
        <FlowHeader title="Need more time" onBack={() => go("protect")} />
        <div className="flow-scroll replan-scroll">
          <span className="flow-kicker">
            {dur(need ?? 0).toUpperCase()} MORE · {dur(windows.reduce((s, w) => s + w.end - w.start, 0)).toUpperCase()} FREE BEFORE {dayClock(deadline).toUpperCase()}
          </span>
          <h1>Your options</h1>
          <p className="options-count">
            <Icon name="shield" size={16} />
            {header}
          </p>
          <div className="option-list">
            {generated.options.map((o, i) => {
              const d = describePlan(o, unlocked, ctx.sleepMin)
              return (
                <OptionCard key={o.id} name={o.name} times={timesLabel(o.blocks)} keeps={d.keeps} changes={d.changes} onClick={() => pickOption(o, i)} />
              )
            })}
          </div>
          <button
            className="link-button center"
            onClick={() => {
              logFootprint("why_open")
              setSheet("why")
            }}
          >
            <Icon name="info" size={16} />
            Why these?
          </button>
        </div>
        {sheet === "why" && (
          <Sheet onClose={() => setSheet(null)}>
            <div className="sheet-icon">
              <Icon name="shield" size={24} />
            </div>
            <h2>Why these options?</h2>
            <p className="sheet-detail why-text">
              I only use your free time before the deadline. I don’t use protected time unless you unlock it, and I don’t create blocks shorter than 45 min.
            </p>
            <div className="why-list">
              <small>FREE BEFORE {dayClock(deadline).toUpperCase()}</small>
              {windows.map((w) => (
                <span key={w.start}>
                  <Icon name="clock" size={15} />
                  {dayRange(w.start, w.end)} · {dur(w.end - w.start)}
                </span>
              ))}
            </div>
            <p className="sheet-meta">Options that keep the most protected time come first. Anything that touches protected time is marked in amber.</p>
            <button className="secondary-button" onClick={() => setSheet(null)}>
              Got it
            </button>
          </Sheet>
        )}
      </main>
    )
  }

  // ----- F3b: Conflict -----
  if (step === "conflict" && generated?.mode === "conflict") {
    return (
      <main className="flow-screen replan-screen">
        <FlowHeader title="Need more time" onBack={() => go("protect")} />
        <div className="flow-scroll replan-scroll">
          <div className="conflict-hero">
            <span>
              <Icon name="alert" size={22} />
            </span>
            <h1>Only {dur(generated.fit)} fits before your deadline without touching protected time.</h1>
            <p>You need about {dur(need ?? 0)}. Here are your real choices. Each one says what it costs.</p>
          </div>
          <div className="choice-list">
            {generated.choices.map((c) => {
              const disabled = !c.plan
              return (
                <button key={c.key} className={`choice-card ${disabled ? "disabled" : ""}`} disabled={disabled} onClick={() => pickConflict(c)}>
                  <span className="choice-icon">
                    <Icon
                      name={c.key === "gym" ? "gym" : c.key === "winddown" || c.key === "sleep" ? "moon" : c.key === "extension" ? "mail" : "check"}
                      size={19}
                    />
                  </span>
                  <span className="choice-text">
                    <strong>{c.title}</strong>
                    <small>{c.detail}</small>
                    {c.cost && (
                      <span className={`plan-chip ${c.cost.tone}`} {...(c.key === "sleep" ? { "data-sleep-warning": "" } : {})}>
                        <Icon name="alert" size={13} />
                        {c.cost.text}
                      </span>
                    )}
                  </span>
                  <Icon name="chevron" size={18} />
                </button>
              )
            })}
          </div>
          <button className="link-button center" onClick={() => go("howMuch")}>
            Change how much time
          </button>
        </div>
      </main>
    )
  }

  // ----- F6: Extension draft -----
  if (step === "extension" && generated?.mode === "conflict") {
    const fits = generated.choices.find((c) => c.key === "extension")!.plan!
    return (
      <main className="flow-screen replan-screen">
        <FlowHeader title="Extension request" onBack={() => go("conflict")} />
        <div className="flow-scroll replan-scroll">
          <span className="flow-kicker">DRAFT · NOTHING IS SENT YET</span>
          <h1>Ask for a short extension</h1>
          <div className="message-to">
            <span>To:</span>
            <strong>Alex Rivera</strong>
            <small>Stats 203 TA</small>
          </div>
          <div className="message-to">
            <span>Subject:</span>
            <strong>Assignment 4: short extension request</strong>
          </div>
          <label className="message-draft">
            <span>Message (you can edit it)</span>
            <textarea
              value={ext.body}
              rows={6}
              disabled={ext.sent}
              onChange={(e) => setExt((x) => ({ ...x, body: e.target.value, edited: true }))}
            />
          </label>
          <div className="setting-explanation">
            <Icon name="clock" size={16} />
            I’ll still schedule the {dur(generated.base.blocks.reduce((s, b) => s + b.end - b.start, 0))} that fits tonight.
          </div>
          {ext.sent ? (
            <div className="sent-panel">
              <span className="success-circle">
                <Icon name="check" size={16} />
              </span>
              <p>
                <strong>Sent ✓</strong>
                To Alex Rivera. Your deadline stays Wed 9:00 am until Alex replies.
              </p>
            </div>
          ) : (
            <>
              <HoldButton
                label="Send to Alex"
                onComplete={() => {
                  logFootprint("extension_draft", { action: "sent", edited: ext.edited, chars: ext.body.length })
                  setExt((x) => ({ ...x, sent: true }))
                  store.setExtensionSent(true)
                }}
              />
              <button
                className="secondary-button"
                onClick={() => {
                  logFootprint("extension_draft", { action: "copied", edited: ext.edited, chars: ext.body.length })
                  navigator.clipboard?.writeText(ext.body).catch(() => undefined)
                  showToast("Copied. Paste it into your email.")
                }}
              >
                <Icon name="copy" size={16} /> Copy
              </button>
            </>
          )}
          <button
            className={ext.sent ? "primary-button" : "secondary-button"}
            onClick={() => {
              setDraft({
                name: ext.sent ? "Asked for an extension" : "What fits",
                template: "c-ext",
                blocks: fits.blocks.map((b) => ({ ...b })),
                allowed: fits.allowed,
                costLocked: [],
                extras: ext.sent ? { extension: true } : {},
                conflictKey: "extension",
              })
              setPreviewFrom("extension")
              go("preview")
            }}
          >
            Schedule the {dur(fits.blocks.reduce((s, b) => s + b.end - b.start, 0))} that fits
          </button>
          <button className="text-button" onClick={() => go("conflict")}>
            Back
          </button>
        </div>
      </main>
    )
  }

  // ----- F4: Preview and adjust -----
  if (step === "preview" && draft && check) {
    const desc = describePlan(draft, editPlan ? editPlan.unlockedAt : unlocked, ctx.sleepMin, draft.costLocked)
    const fx = desc.fx
    const evs = buildPreviewEvents(draft.blocks, draft.allowed, blockEnd, fx)
    const segs: Seg[] = [
      { from: t(1, 16, 30), to: t(2, 0) },
      { from: t(2, 6), to: Math.max(t(2, 9, 30), deadline > K.DEADLINE ? t(2, 17, 30) : 0) },
    ]
    return (
      <main className="flow-screen replan-screen preview-screen">
        <FlowHeader
          title={editPlan ? "Edit plan" : "Preview"}
          onBack={() => (editPlan ? onExit() : go(previewFrom))}
        />
        <div className="flow-scroll replan-scroll preview-scroll">
          <span className="flow-kicker">{editPlan ? "ADJUST YOUR PLAN" : "PREVIEW · NOTHING CHANGES YET"}</span>
          <h1>{draft.name}</h1>
          <p className="flow-intro">{timesLabel(draft.blocks)}</p>
          <div className="preview-keeps">
            {desc.keeps.map((c) => (
              <ChipView chip={c} key={c.text} />
            ))}
            {desc.changes.map((c) => (
              <ChipView chip={c} key={c.text} />
            ))}
          </div>
          <div className="card timeline-card preview-timeline">
            <Timeline
              segs={segs}
              ppm={1.05}
              events={evs}
              draft={{
                blocks: draft.blocks,
                badId: check.ok ? undefined : check.blockId,
                onMove: moveBlock,
                onDragEnd: (id, moved) => {
                  setAdjustments((n) => n + 1)
                  logFootprint("preview_adjust", {
                    block: draft.blocks.findIndex((b) => b.id === id) + 1,
                    minutes: moved,
                    how: "drag",
                    adjustments: adjustments + 1,
                  })
                },
              }}
              bandLabel="Wed"
            />
          </div>
          <section className="adjust-list">
            <h2>Adjust times</h2>
            <p>Drag a block, or move it 15 minutes at a time.</p>
            {[...draft.blocks]
              .sort((a, b) => a.start - b.start)
              .map((b, i) => (
                <div key={b.id} className={`adjust-row ${!check.ok && check.blockId === b.id ? "bad" : ""}`}>
                  <span>
                    <small>Block {i + 1} · {dur(b.end - b.start)}</small>
                    <strong>{dayRange(b.start, b.end)}</strong>
                  </span>
                  <button aria-label={`Move block ${i + 1} 15 minutes earlier`} onClick={() => nudge(b.id, -15, i)}>
                    −15
                  </button>
                  <button aria-label={`Move block ${i + 1} 15 minutes later`} onClick={() => nudge(b.id, 15, i)}>
                    +15
                  </button>
                </div>
              ))}
          </section>
          <section className="what-changes">
            <h2>What changes</h2>
            {changeList(draft, ctx.sleepMin).map((r, i) => (
              <ChangeRow key={i} row={r} />
            ))}
          </section>
        </div>
        <footer className="preview-footer">
          <div className={`fit-check ${check.ok ? "ok" : "bad"}`} role="status">
            {check.text}
          </div>
          <button className="primary-button" disabled={!check.ok} onClick={apply}>
            {editPlan ? "Save changes" : "Apply plan"}
          </button>
          <button className="secondary-button" onClick={() => (editPlan ? onExit() : go(previewFrom))}>
            {editPlan ? "Cancel" : previewFrom === "extension" ? "Back" : "Back to options"}
          </button>
        </footer>
      </main>
    )
  }

  // ----- F5: Plan set -----
  if (step === "set" && appliedId) {
    const plan = store.plans.find((p) => p.id === appliedId)
    if (!plan) return null
    const fx = describePlan(plan, plan.unlockedAt, ctx.sleepMin, plan.costLocked).fx
    const first = [...plan.blocks].sort((a, b) => a.start - b.start)[0]
    const undone = plan.status !== "active"
    return (
      <main className="flow-screen plan-set-screen">
        <div className="flow-scroll plan-set-scroll">
          <div className="confirmation-check">
            <Icon name={undone ? "undo" : "check"} size={28} />
          </div>
          <h1>{undone ? "Plan undone." : editPlan ? "Plan updated." : "Plan set."}</h1>
          {!undone && (
            <p className="plan-set-protected">
              {fx.dinnerShifted ? (
                <>
                  <Icon name="dinner" size={16} /> Dinner moves to 7:30 pm.
                </>
              ) : (
                <>
                  <Icon name="lock" size={16} /> Dinner at 7:00 stays protected.
                </>
              )}
            </p>
          )}
          {autoApplied && !undone && (
            <div className="setting-explanation">
              <Icon name="sparkle" size={16} />
              Applied automatically, because nothing protected changed. Undo anytime.
            </div>
          )}
          {first && !undone && (
            <div className="next-block">
              <Icon name="clock" size={18} />
              Next study block: <strong>{dayOf(first.start) === TODAY ? clock(first.start) : dayClock(first.start)}</strong>
            </div>
          )}
          <section className="what-changes">
            <h2>What changed</h2>
            {changeList(plan, ctx.sleepMin).map((r, i) => (
              <ChangeRow key={i} row={r} />
            ))}
          </section>
          {fx.dinnerShifted && !undone && (
            <section className="message-offer">
              <span>
                <Icon name="people" size={19} />
              </span>
              <p>
                <strong>{plan.dinnerMessage || msgSent ? "Priya and Jonah know ✓" : "Message Priya and Jonah?"}</strong>
                {plan.dinnerMessage || msgSent ? "Sent: dinner at 7:30 instead of 7:00." : "They’re still expecting you at 7:00."}
              </p>
              {!(plan.dinnerMessage || msgSent) && <button onClick={() => setSheet("message")}>Open draft</button>}
            </section>
          )}
          {!undone ? (
            <>
              <button className="primary-button" onClick={onExit}>
                Done
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  undoPlan(plan.id, "plan set")
                  showToast("Plan undone. Your evening is back to how it was.")
                  onExit()
                }}
              >
                <Icon name="undo" size={16} /> Undo
              </button>
              <button className="text-button" onClick={() => onViewPlan(plan.id)}>
                See it in History
              </button>
            </>
          ) : (
            <button className="primary-button" onClick={onExit}>
              Back to Today
            </button>
          )}
        </div>
        {sheet === "message" && (
          <Sheet onClose={() => setSheet(null)}>
            <span className="sheet-kicker">DRAFT · NOTHING IS SENT YET</span>
            <h2>Message Priya and Jonah</h2>
            <div className="message-to">
              <span>To:</span>
              <strong>Priya, Jonah</strong>
            </div>
            <div className="poll-preview">Hi both, I’m running a bit behind on an assignment. Could we push dinner to 7:30? Same place in Rockridge. Sorry for the shuffle.</div>
            <HoldButton
              label="Send"
              onComplete={() => {
                logFootprint("dinner_message", { action: "sent" })
                store.setDinnerMessage(plan.id)
                setMsgSent(true)
                setSheet(null)
                showToast("Sent to Priya and Jonah")
              }}
            />
            <button className="secondary-button" onClick={() => setSheet(null)}>
              Not now
            </button>
          </Sheet>
        )}
      </main>
    )
  }

  return (
    <main className="flow-screen replan-screen">
      <FlowHeader title="Need more time" onBack={onExit} />
      <div className="flow-scroll replan-scroll">
        <h1>Let’s start again</h1>
        <button className="primary-button" onClick={() => go("howMuch")}>
          Start over
        </button>
      </div>
    </main>
  )
}

function buildPreviewEvents(
  blocks: Block[],
  allowed: Lockable[],
  blockEnd: number,
  fx: ReturnType<typeof describePlan>["fx"],
): CalEvent[] {
  const out: CalEvent[] = []
  const deadline = { id: "wed-due", title: "Stats 203 Assignment 4 due", short: "Stats 203 A4", start: K.DEADLINE, end: K.DEADLINE, kind: "deadline" as const, source: "Course site" as const }
  out.push(deadline)
  const base = solidPreview(blockEnd)
  for (const e of base) {
    if (["tue-travel", "tue-dinner", "tue-home"].includes(e.id) && fx.dinnerShifted) {
      if (e.id === "tue-dinner")
        out.push({ ...e, id: "dinner-ghost", status: "ghost", note: "Dinner → 7:30 pm", tone: "amber" })
      const moved = e.id === "tue-travel" ? { start: K.DINNER, end: K.DINNER + 30 } : { start: e.start + 30, end: e.end + 30 }
      out.push({ ...e, ...moved, status: "moved", tone: e.id === "tue-dinner" ? "amber" : undefined })
      continue
    }
    if (e.id === "wed-gym" && fx.gymMoved) {
      out.push({ ...e, id: "gym-ghost", status: "ghost", note: "Gym → Thu 7:00 am", tone: "amber" })
      continue
    }
    if (e.id === "tue-wind" && fx.windUsed > 0) {
      out.push({ ...e, status: "used", tone: "amber", note: fx.windUsed >= 45 ? "Used for study" : `Cut to ${45 - fx.windUsed} min` })
      continue
    }
    if (e.id === "wed-sleep" && fx.sleepCut > 0) {
      let start = e.start
      let end = e.end
      for (const b of blocks) {
        if (b.end > start && b.start <= start) start = Math.min(b.end, end)
        if (b.start < end && b.end >= end) end = Math.max(b.start, start)
      }
      out.push({ ...e, start, end, status: "shortened", tone: "red", note: `${dur(7 * 60 - fx.sleepCut)}, below minimum` })
      continue
    }
    out.push(e)
  }
  void allowed
  return out
}

function solidPreview(blockEnd: number): CalEvent[] {
  return [
    { id: "tue-study", title: "Study: Stats 203 Assignment 4", start: K.BLOCK_START, end: blockEnd, kind: "study", source: "Google Calendar" },
    { id: "tue-travel", title: "Travel to dinner", start: t(1, 18, 15), end: t(1, 19), kind: "travel", source: "Google Calendar" },
    { id: "tue-dinner", title: "Dinner with friends", start: t(1, 19), end: t(1, 21), kind: "protected", protect: "dinner", source: "Google Calendar" },
    { id: "tue-home", title: "Travel home", start: t(1, 21), end: t(1, 21, 15), kind: "travel", source: "Google Calendar" },
    { id: "tue-wind", title: "Wind-down", start: t(1, 23, 15), end: t(2, 0), kind: "protected", protect: "winddown", source: "Time Protector" },
    { id: "wed-sleep", title: "Sleep", start: t(2, 0), end: t(2, 7), kind: "protected", protect: "sleep", source: "Time Protector" },
    { id: "wed-gym", title: "Gym", start: t(2, 7), end: t(2, 8), kind: "protected", protect: "gym", source: "Google Calendar" },
    { id: "wed-ready", title: "Get ready and commute", start: t(2, 8), end: t(2, 8, 45), kind: "travel", source: "Google Calendar" },
    { id: "wed-gsr", title: "RA shift", start: t(2, 9, 30), end: t(2, 12, 30), kind: "work", source: "Google Calendar" },
    { id: "wed-213", title: "Design 213 class", start: t(2, 14), end: t(2, 15, 30), kind: "class", source: "Google Calendar" },
    { id: "wed-group", title: "Stats 203 study group", start: t(2, 16), end: t(2, 17), kind: "meeting", source: "Google Calendar" },
  ]
}

function ChangeRow({ row }: { row: { icon: string; title: string; detail: string; tone: string } }) {
  return (
    <div className={`change-row ${row.tone}`}>
      <span>
        <Icon name={row.icon === "add" ? "plus" : row.icon === "move" ? "arrow" : row.icon === "warn" ? "alert" : "info"} size={15} />
      </span>
      <p>
        <strong>{row.title}</strong>
        {row.detail}
      </p>
    </div>
  )
}

// ---------- F7: Done on time ----------

function DoneScreen({ onBack }: { onBack: () => void }) {
  const { doneProgress, setDoneProgress, schedule } = useStore()
  const [value, setValue] = useState(doneProgress ?? 100)
  const [saved, setSaved] = useState(doneProgress !== null)
  const dinner = schedule.find((e) => e.id === "tue-dinner")!
  return (
    <main className="flow-screen done-screen">
      <div className="flow-scroll plan-set-scroll">
        <div className="confirmation-check">
          <Icon name="check" size={28} />
        </div>
        <h1>Nice. Study block complete.</h1>
        <p className="done-sub">Tonight stays yours.</p>
        <div className="tonight-items done-items">
          {[
            ["dinner", "Dinner", clock(dinner.start)],
            ["moon", "Wind-down", "11:15 pm"],
            ["moon", "Sleep", "12:00 am"],
          ].map(([icon, label, time]) => (
            <div className="tonight-item" key={label}>
              <Icon name={icon} size={16} />
              <span>
                <strong>{label}</strong>
                <small>{time}</small>
              </span>
              <Icon name="lock" size={14} />
            </div>
          ))}
        </div>
        <section className="progress-card">
          <h2>How far did you get?</h2>
          <p>Optional. I use this to plan future Stats 203 blocks.</p>
          <div className="estimate-slider">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={value}
              aria-label="How far did you get, in percent"
              onChange={(e) => {
                setValue(Number(e.target.value))
                setSaved(false)
              }}
            />
            <output>{value}%</output>
          </div>
          <button
            className="secondary-button"
            disabled={saved}
            onClick={() => {
              setDoneProgress(value)
              setSaved(true)
              logFootprint("done_progress", { percent: value })
            }}
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
        </section>
        <button className="primary-button" onClick={onBack}>
          Back to Today
        </button>
      </div>
    </main>
  )
}

// ---------- History (HI1) and plan detail (HI2) ----------

function planSummary(p: AppliedPlan) {
  if (p.kind === "spread" && p.spread) return { added: "Thursday lighter", kept: p.spread.keeps[0] === "Everything" ? "Everything kept" : `${p.spread.keeps[0]} kept` }
  const fx = describePlan(p, p.unlockedAt, 420, p.costLocked).fx
  const added = dur(p.blocks.reduce((s, b) => s + b.end - b.start, 0))
  const kept = fx.dinnerShifted ? "Dinner moved" : "Dinner kept"
  return { added: `${added} added`, kept }
}

function History({ onAvatar, onOpen }: { onAvatar: () => void; onOpen: (id: string) => void }) {
  const { plans } = useStore()
  const thisWeek = [...plans].sort((a, b) => b.createdOrder - a.createdOrder)
  return (
    <main className="screen history-screen">
      <Header eyebrow="Your re-plans" title="History" onAvatar={onAvatar} />
      <p className="page-intro">Every change you approved, block by block. Undo anything that hasn’t started yet.</p>
      <section className="content-section first">
        <div className="section-title-row">
          <h2>This week</h2>
          <span>Nov 9–15</span>
        </div>
        {thisWeek.length === 0 ? (
          <div className="segment-empty">
            <span className="success-circle">
              <Icon name="history" size={17} />
            </span>
            <strong>No re-plans yet this week</strong>
            <p>When work runs over and you set a plan, it shows up here.</p>
          </div>
        ) : (
          <div className="card history-list">
            {thisWeek.map((p) => {
              const s = planSummary(p)
              return (
                <button key={p.id} onClick={() => onOpen(p.id)}>
                  <span className={`history-icon ${p.status}`}>
                    <Icon name={p.status === "active" ? "check" : "undo"} size={16} />
                  </span>
                  <span className="history-text">
                    <strong>
                      {p.date} · {p.name}
                    </strong>
                    <small>
                      {s.added} · {s.kept}
                    </small>
                  </span>
                  {p.status !== "active" && <i className="status-pill">{p.status === "replaced" ? "Replaced" : "Undone"}</i>}
                  <Icon name="chevron" size={16} />
                </button>
              )
            })}
          </div>
        )}
      </section>
      <section className="content-section">
        <div className="section-title-row">
          <h2>Last week</h2>
          <span>{lastWeek.label}</span>
        </div>
        <div className="card history-list">
          {pastPlans.map((p) => (
            <button key={p.id} onClick={() => onOpen(p.id)}>
              <span className="history-icon past">
                <Icon name="clock" size={16} />
              </span>
              <span className="history-text">
                <strong>
                  {p.date} · {p.name}
                </strong>
                <small>
                  {dur(p.added)} added · {p.kept}
                </small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function PlanDetail({ id, onBack, onEdit }: { id: string; onBack: () => void; onEdit: (id: string) => void }) {
  const { plans, undoPlan, showToast, rules } = useStore()
  const plan = plans.find((p) => p.id === id)
  const past = pastPlans.find((p) => p.id === id)
  if (past) {
    return (
      <main className="flow-screen plan-detail-screen">
        <FlowHeader title="Plan detail" onBack={onBack} />
        <div className="flow-scroll plan-detail-scroll">
          <span className="status-pill past">Past</span>
          <h1>{past.name}</h1>
          <p className="flow-intro">
            {past.date} · {past.course} · {dur(past.added)} added
          </p>
          <section className="what-changes">
            <h2>What changed</h2>
            {past.rows.map((r, i) => (
              <ChangeRow key={i} row={{ ...r, icon: r.tone === "blue" ? "add" : "warn" }} />
            ))}
          </section>
          <button className="primary-button" disabled>
            Undo this plan
          </button>
          <button className="secondary-button" disabled>
            Edit
          </button>
          <p className="form-help">These blocks are in the past, so there’s nothing to undo.</p>
        </div>
      </main>
    )
  }
  if (!plan) return null
  const future = plan.kind === "spread" ? true : plan.blocks.every((b) => b.start >= K.BLOCK_END)
  const active = plan.status === "active"
  const desc = plan.kind === "spread" ? null : describePlan(plan, plan.unlockedAt, rules.sleep.minHours * 60, plan.costLocked)
  return (
    <main className="flow-screen plan-detail-screen">
      <FlowHeader title="Plan detail" onBack={onBack} />
      <div className="flow-scroll plan-detail-scroll">
        <span className={`status-pill ${plan.status}`}>{active ? "Active" : plan.status === "replaced" ? "Replaced" : "Undone"}</span>
        <h1>{plan.name}</h1>
        <p className="flow-intro">
          {plan.date}
          {plan.need ? ` · ${dur(plan.need)} needed` : ""}
          {plan.auto ? " · applied automatically" : ""}
        </p>
        {desc && (
          <div className="preview-keeps">
            {desc.keeps.map((c) => (
              <ChipView chip={c} key={c.text} />
            ))}
          </div>
        )}
        <section className="what-changes">
          <h2>What changed</h2>
          {plan.kind === "spread" && plan.spread
            ? plan.spread.moves.map((m) => {
                const ev = (["thu-m3", "thu-rr", "thu-a5"] as const).includes(m.eventId as "thu-m3")
                  ? { "thu-m3": "Study: Design 213 Milestone 3", "thu-rr": "Study: Stats 203 Reading response", "thu-a5": "Study: Stats 203 Assignment 5" }[m.eventId as "thu-m3"]
                  : m.eventId
                return <ChangeRow key={m.eventId} row={{ icon: "move", title: `${ev} moved`, detail: `Now ${dayRange(m.start, m.end)}`, tone: "blue" }} />
              })
            : changeList(plan, rules.sleep.minHours * 60).map((r, i) => <ChangeRow key={i} row={r} />)}
        </section>
        <button
          className="primary-button"
          disabled={!active || !future}
          onClick={() => {
            undoPlan(plan.id, "history")
            showToast("Plan undone. Everything is back where it was.")
          }}
        >
          <Icon name="undo" size={16} /> Undo this plan
        </button>
        <button className="secondary-button" disabled={!active || plan.kind !== "replan"} onClick={() => onEdit(plan.id)}>
          <Icon name="edit" size={16} /> Edit
        </button>
        {!active && <p className="form-help">This plan was {plan.status === "replaced" ? "replaced by a newer one" : "undone"}. Nothing from it is on your calendar.</p>}
        {active && plan.kind !== "replan" && <p className="form-help">To change this, undo it and choose again.</p>}
      </div>
    </main>
  )
}

// ---------- Insights (IN1) ----------

function Insights({ onAvatar }: { onAvatar: () => void }) {
  const { suggestion, setSuggestion, plans, showToast, schedule } = useStore()
  const [sheet, setSheet] = useState<null | "evenings" | "sleep" | "overruns" | "average" | "evidence">(null)
  const todayPlan = plans.find((p) => p.status === "active" && (p.kind === "replan" || p.kind === "extend"))
  const sleep = schedule.find((e) => e.id === "wed-sleep")!
  const sleepShort = sleep.status === "shortened"
  const addedToday = todayPlan ? todayPlan.blocks.reduce((s, b) => s + b.end - b.start, 0) : 0
  const rows = [
    {
      id: "evenings" as const,
      label: "Evenings protected",
      last: `${lastWeek.eveningsProtected.kept} of ${lastWeek.eveningsProtected.of}`,
      now: "1 of 1 so far",
    },
    { id: "sleep" as const, label: "Sleep under 7 h", last: `${lastWeek.sleepUnder.length} nights`, now: sleepShort ? "1 night (planned tonight)" : "0 nights" },
    { id: "overruns" as const, label: "Overruns", last: "3, mostly Stats 203", now: todayPlan ? "1 (Stats 203, today)" : "None yet" },
    { id: "average" as const, label: "Average overrun", last: dur(lastWeek.averageOverrun), now: todayPlan ? dur(addedToday) : "–" },
  ]
  const open = (id: NonNullable<typeof sheet>) => {
    logFootprint("insight_open", { insight: id })
    setSheet(id)
  }
  return (
    <main className="screen insights-screen">
      <Header eyebrow="Patterns, not scores" title="Insights" onAvatar={onAvatar} />
      <section className="card compare-card">
        <div className="compare-head">
          <span />
          <small>LAST WEEK</small>
          <small>THIS WEEK</small>
        </div>
        {rows.map((r) => (
          <button key={r.id} className="compare-row" onClick={() => open(r.id)}>
            <strong>{r.label}</strong>
            <span>{r.last}</span>
            <span className="now">{r.now}</span>
            <Icon name="chevron" size={15} />
          </button>
        ))}
        <p className="compare-foot">Last week: {lastWeek.label}. This week so far: Nov 9–10.</p>
      </section>
      <section className="content-section">
        <div className="section-title-row">
          <h2>Where overruns came from</h2>
          <span>last week</span>
        </div>
        <div className="card overrun-bars">
          {lastWeek.overruns.map((o) => (
            <div key={o.course}>
              <span>{o.course}</span>
              <i>
                <b style={{ width: `${(o.count / 3) * 100}%` }} />
              </i>
              <strong>{o.count}×</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="content-section">
        <div className="section-title-row">
          <h2>One suggestion</h2>
        </div>
        {suggestion === "open" && (
          <div className="suggestion-card">
            <span className="sparkle">
              <Icon name="sparkle" size={16} />
            </span>
            <p>Stats 203 blocks run about 1.5× longer than planned. Plan them longer next week?</p>
            <button className="link-button" onClick={() => open("evidence")}>
              How I worked this out
            </button>
            <div className="overload-actions">
              <button
                className="primary-button"
                onClick={() => {
                  setSuggestion("applied")
                  showToast("Next week’s Stats 203 blocks are planned 1.5× longer.", () => setSuggestion("open"))
                }}
              >
                Apply to next week
              </button>
              <button className="secondary-button" onClick={() => setSuggestion("dismissed")}>
                Not now
              </button>
            </div>
          </div>
        )}
        {suggestion === "applied" && (
          <div className="status-card">
            <span className="success-circle">
              <Icon name="check" size={16} />
            </span>
            <p>
              <strong>Applied to next week</strong>
              Stats 203 blocks for Nov 16–22 are planned 1.5× longer.
            </p>
            <button onClick={() => setSuggestion("open")}>Undo</button>
          </div>
        )}
        {suggestion === "dismissed" && (
          <div className="status-card muted">
            <span className="success-circle">
              <Icon name="info" size={16} />
            </span>
            <p>
              <strong>Okay, not now</strong>
              I won’t bring it up again this week.
            </p>
            <button onClick={() => setSuggestion("open")}>Show again</button>
          </div>
        )}
      </section>
      <div className="privacy-note">
        <Icon name="lock" size={17} />
        <span>
          <strong>Only you see this</strong>
          <br />
          No scores, no streaks. Just what happened.
        </span>
      </div>
      {sheet && (
        <Sheet onClose={() => setSheet(null)}>
          <span className="sheet-kicker">INSIGHT</span>
          {sheet === "evenings" && (
            <>
              <h2>Evenings protected: 4 of 5</h2>
              <p className="sheet-detail">Last week, one weekday evening went to work.</p>
              <div className="week-dots">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                  <span key={d} className={d === "Wed" ? "missed" : ""}>
                    <i>{d === "Wed" ? <Icon name="moon" size={14} /> : <Icon name="check" size={14} />}</i>
                    {d}
                  </span>
                ))}
              </div>
              <p className="sheet-meta">Wed Nov 4: a late push for Stats 203 Assignment 3 used your wind-down.</p>
            </>
          )}
          {sheet === "sleep" && (
            <>
              <h2>Sleep under 7 h: 2 nights</h2>
              <div className="insight-list">
                {lastWeek.sleepUnder.map((s) => (
                  <div key={s.night}>
                    <strong>{s.night}</strong>
                    <span>{s.hours} · {s.why}</span>
                  </div>
                ))}
              </div>
              {sleepShort && <p className="sheet-meta">Tonight’s plan also has {sleep.note}.</p>}
            </>
          )}
          {sheet === "overruns" && (
            <>
              <h2>Overruns: 3, mostly Stats 203</h2>
              <div className="insight-list">
                {pastPlans.map((p) => (
                  <div key={p.id}>
                    <strong>{p.date} · {p.course}</strong>
                    <span>{dur(p.added)} more than planned</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {sheet === "average" && (
            <>
              <h2>Average overrun: 1 h 20 m</h2>
              <p className="sheet-detail">Across 3 overruns last week: 1 h, 1 h 30 m and 1 h 30 m.</p>
            </>
          )}
          {sheet === "evidence" && (
            <>
              <h2>Stats 203 runs about 1.5× longer</h2>
              <p className="sheet-detail">Your last four Stats 203 study blocks were planned for 9 h in total and took about 13 h 30 m.</p>
              <p className="sheet-meta">I only use your calendar and check-ins for this. It isn’t a grade or a score.</p>
            </>
          )}
          <button className="secondary-button" onClick={() => setSheet(null)}>
            Close
          </button>
        </Sheet>
      )}
    </main>
  )
}

// ---------- Overload flow (IN2 → options) ----------

function OverloadFlow({ onExit }: { onExit: () => void }) {
  const { applyPlan, undoPlan, showToast, schedule } = useStore()
  const [chosen, setChosen] = useState<SpreadOption | null>(null)
  const thu = workload(schedule, 3)
  if (!chosen) {
    return (
      <main className="flow-screen replan-screen">
        <FlowHeader title="Thursday" onBack={onExit} />
        <div className="flow-scroll replan-scroll">
          <span className="flow-kicker">
            THU NOV 12 · {dur(thu.planned).toUpperCase()} PLANNED · 0 H FREE
          </span>
          <h1>Spread things out</h1>
          <p className="options-count">
            <Icon name="shield" size={16} />
            {spreadOptions.length} options · changes to protected time are flagged ⚠
          </p>
          <div className="option-list">
            {spreadOptions.map((o) => (
              <OptionCard
                key={o.id}
                name={o.name}
                times={o.moves.map((m) => dayRange(m.start, m.end)).join(" + ")}
                keeps={o.keeps.map((k) => ({ text: k, tone: "neutral", locked: true }))}
                changes={o.changes.map((c) => ({ text: c, tone: "neutral" }))}
                onClick={() => {
                  logFootprint("option_select", { option: o.name, flow: "overload" })
                  setChosen(o)
                }}
              />
            ))}
          </div>
        </div>
      </main>
    )
  }
  const after = (() => {
    const moved = schedule.map((e) => {
      const m = chosen.moves.find((x) => x.eventId === e.id)
      return m ? { ...e, start: m.start, end: m.end } : e
    })
    return workload(moved, 3)
  })()
  const names: Record<string, string> = {
    "thu-m3": "Study: Design 213 Milestone 3",
    "thu-rr": "Study: Stats 203 Reading response",
    "thu-a5": "Study: Stats 203 Assignment 5",
  }
  return (
    <main className="flow-screen replan-screen">
      <FlowHeader title="Preview" onBack={() => setChosen(null)} />
      <div className="flow-scroll replan-scroll">
        <span className="flow-kicker">PREVIEW · NOTHING CHANGES YET</span>
        <h1>{chosen.name}</h1>
        <div className="before-after">
          <div>
            <small>THURSDAY NOW</small>
            <strong>{dur(thu.planned)} planned</strong>
            <span>{dur(thu.free)} free</span>
          </div>
          <Icon name="arrow" size={20} />
          <div className="after">
            <small>AFTER</small>
            <strong>{dur(after.planned)} planned</strong>
            <span>{dur(after.free)} free</span>
          </div>
        </div>
        <section className="what-changes">
          <h2>What changes</h2>
          {chosen.moves.map((m) => {
            const ev = schedule.find((e) => e.id === m.eventId)!
            return (
              <ChangeRow
                key={m.eventId}
                row={{ icon: "move", title: names[m.eventId] ?? ev.title, detail: `${dayRange(ev.start, ev.end)} → ${dayRange(m.start, m.end)}`, tone: "blue" }}
              />
            )
          })}
          <ChangeRow row={{ icon: "note", title: "Protected time stays", detail: "Team sync, family call and dinners don’t move", tone: "neutral" }} />
        </section>
        <button
          className="primary-button"
          onClick={() => {
            const id = applyPlan({
              kind: "spread",
              name: chosen.name,
              blocks: [],
              allowed: [],
              costLocked: [],
              unlockedAt: { dinner: false, winddown: false, sleep: false, gym: false },
              extras: {},
              deadline: K.DEADLINE,
              spread: chosen,
            })
            showToast("Thursday is lighter now.", () => undoPlan(id, "toast"))
            onExit()
          }}
        >
          Apply
        </button>
        <button className="secondary-button" onClick={() => setChosen(null)}>
          Back to options
        </button>
      </div>
    </main>
  )
}

// ---------- Settings (S1–S5) ----------

type SettingsRoute = "root" | "rules" | "checkins" | "change" | "calendars" | "privacy"

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: T
  options: [T, string][]
  onChange: (v: T) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div className={`autonomy-segments ${options.length === 3 ? "three" : ""}`} role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} role="radio" aria-checked={value === v} disabled={disabled} className={value === v ? "selected" : ""} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  )
}

function RulesSettings({ onBack }: { onBack: () => void }) {
  const { rules, setRule, showToast } = useStore()
  const levels: [Level, string][] = [
    ["hard", "Hard"],
    ["soft", "Soft"],
    ["off", "Off"],
  ]
  const previews: Record<string, Record<Level, string>> = {
    sleep: {
      hard: "I’ll never shorten your sleep or use your wind-down.",
      soft: "When you’re behind, I may shorten sleep, but never below 6 h. I always ask first.",
      off: "Sleep isn’t protected. I’ll still warn you below your minimum.",
    },
    gym: {
      hard: "I’ll never move the gym.",
      soft: "When you’re behind, I may move the gym to another day.",
      off: "Gym time counts as free time.",
    },
    meals: {
      hard: "I’ll never move meals with friends.",
      soft: "When you’re behind, I may suggest a later time and draft a message for you.",
      off: "Meals with friends count as free time.",
    },
  }
  const change = <R extends "sleep" | "gym" | "meals">(item: R, level: Level, title: string) => {
    if (rules[item].level === level) return
    setRule(item, { level } as Partial<Rules[R]>)
    showToast(`${title}: ${levelLabel[level]}. ${previews[item][level]}`)
  }
  const cutoffTimes = [21 * 60, 22 * 60, 23 * 60]
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Protected-time rules" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <p className="settings-intro">
          <strong>Hard</strong> never moves. <strong>Soft</strong> can move when you’re behind, and I always ask first. <strong>Off</strong> isn’t protected.
        </p>
        <section className="autonomy-card rule-card">
          <div className="rule-head">
            <span className="protect-icon">
              <Icon name="moon" size={18} />
            </span>
            <h2>Sleep</h2>
            <small>{rules.sleep.minHours} h minimum · {rules.sleep.windDown} min wind-down</small>
          </div>
          <Segmented value={rules.sleep.level} options={levels} label="Sleep protection" onChange={(v) => change("sleep", v, "Sleep")} />
          <p>
            <Icon name="sparkle" size={14} />
            {previews.sleep[rules.sleep.level]}
          </p>
          <div className="rule-detail">
            <span>Minimum sleep</span>
            <div className="mini-stepper">
              <button aria-label="Less sleep minimum" disabled={rules.sleep.minHours <= 6} onClick={() => setRule("sleep", { minHours: rules.sleep.minHours - 0.5 })}>
                <Icon name="minus" size={16} />
              </button>
              <strong>{dur(rules.sleep.minHours * 60)}</strong>
              <button aria-label="More sleep minimum" disabled={rules.sleep.minHours >= 9} onClick={() => setRule("sleep", { minHours: rules.sleep.minHours + 0.5 })}>
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>
          <div className="rule-detail">
            <span>Wind-down before bed</span>
            <div className="mini-stepper">
              <button aria-label="Shorter wind-down" disabled={rules.sleep.windDown <= 15} onClick={() => setRule("sleep", { windDown: rules.sleep.windDown - 15 })}>
                <Icon name="minus" size={16} />
              </button>
              <strong>{rules.sleep.windDown} min</strong>
              <button aria-label="Longer wind-down" disabled={rules.sleep.windDown >= 90} onClick={() => setRule("sleep", { windDown: rules.sleep.windDown + 15 })}>
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>
        </section>
        <section className="autonomy-card rule-card">
          <div className="rule-head">
            <span className="protect-icon">
              <Icon name="gym" size={18} />
            </span>
            <h2>Gym</h2>
            <small>Mon, Wed, Fri · 7:00 am</small>
          </div>
          <Segmented value={rules.gym.level} options={levels} label="Gym protection" onChange={(v) => change("gym", v, "Gym")} />
          <p>
            <Icon name="sparkle" size={14} />
            {previews.gym[rules.gym.level]}
          </p>
        </section>
        <section className="autonomy-card rule-card">
          <div className="rule-head">
            <span className="protect-icon">
              <Icon name="dinner" size={18} />
            </span>
            <h2>Meals with friends</h2>
            <small>Dinner Tue 7:00 pm · Dinner with Priya Fri 7:00 pm</small>
          </div>
          <Segmented value={rules.meals.level} options={levels} label="Meals with friends protection" onChange={(v) => change("meals", v, "Meals with friends")} />
          <p>
            <Icon name="sparkle" size={14} />
            {previews.meals[rules.meals.level]}
          </p>
        </section>
        <section className="autonomy-card rule-card">
          <div className="rule-head">
            <span className="protect-icon">
              <Icon name="clock" size={18} />
            </span>
            <h2>No work after…</h2>
            <small>A daily cutoff for study blocks</small>
          </div>
          <Segmented
            value={rules.noWorkAfter.level}
            options={levels}
            label="No work after protection"
            onChange={(v) => {
              setRule("noWorkAfter", { level: v })
              showToast(v === "off" ? "No cutoff. I stop at your wind-down." : `No work after ${clock(t(0, 0) + rules.noWorkAfter.time)}: ${levelLabel[v]}`)
            }}
          />
          <div className="rule-detail">
            <span>Cutoff time</span>
            <div className="time-pills">
              {cutoffTimes.map((m) => (
                <button
                  key={m}
                  disabled={rules.noWorkAfter.level === "off"}
                  className={rules.noWorkAfter.time === m ? "selected" : ""}
                  onClick={() => setRule("noWorkAfter", { time: m })}
                >
                  {clock(m)}
                </button>
              ))}
            </div>
          </div>
          <p>
            <Icon name="sparkle" size={14} />
            {rules.noWorkAfter.level === "off"
              ? "No cutoff. I stop at your wind-down."
              : rules.noWorkAfter.level === "hard"
                ? `I’ll never plan work after ${clock(rules.noWorkAfter.time)}.`
                : `I’ll avoid work after ${clock(rules.noWorkAfter.time)}, and tell you if I can’t.`}
          </p>
        </section>
      </div>
    </main>
  )
}

function CheckinSettings({ onBack }: { onBack: () => void }) {
  const { checkins, setCheckins } = useStore()
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Check-ins" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <p className="settings-intro">One tap at the right moment. You can answer from the lock screen.</p>
        <section className="autonomy-card">
          <h2>When should I check in?</h2>
          <div className="autonomy-options">
            {(
              [
                ["before", "5 min before a study block ends"],
                ["end", "At the end"],
                ["off", "Off"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} className={checkins.timing === v ? "selected" : ""} onClick={() => setCheckins({ timing: v })}>
                <span />
                <strong>{label}</strong>
              </button>
            ))}
          </div>
        </section>
        <div className="notification-settings-list">
          <section>
            <div>
              <strong>Quiet hours</strong>
              <span>10:00 pm–8:00 am · no check-ins</span>
            </div>
            <Toggle checked={checkins.quiet} onChange={(v) => setCheckins({ quiet: v })} label="Quiet hours" />
          </section>
          <section>
            <div>
              <strong>Skip check-ins for blocks under 1 h</strong>
              <span>Short blocks end without a check-in</span>
            </div>
            <Toggle checked={checkins.skipShort} onChange={(v) => setCheckins({ skipShort: v })} label="Skip check-ins for blocks under 1 hour" />
          </section>
        </div>
      </div>
    </main>
  )
}

function ChangeModeSettings({ onBack }: { onBack: () => void }) {
  const { changeMode, setChangeMode } = useStore()
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="How I change your plan" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <p className="settings-intro">Either way, every plan can be undone from History.</p>
        <div className="scope-options">
          {(
            [
              ["ask", "Always ask", "I show you options and a preview. Nothing moves until you approve."],
              ["auto", "Apply automatically if nothing protected changes", "If the best option keeps everything protected, I apply it and tell you. Anything else, I ask."],
            ] as const
          ).map(([v, title, detail]) => (
            <button key={v} className={changeMode === v ? "selected" : ""} onClick={() => setChangeMode(v)}>
              <span />
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}

function CalendarSettings({ onBack }: { onBack: () => void }) {
  const { sources, setSource } = useStore()
  const [confirm, setConfirm] = useState<null | "calendar" | "bcourses">(null)
  const rows = [
    { id: "calendar" as const, name: "Google Calendar", reads: "Event times, to find free time", cls: "source-calendar", icon: "calendar" },
    { id: "bcourses" as const, name: "Course site", reads: "Assignment deadlines only", cls: "source-bcourses", icon: "book" },
  ]
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Calendars & course site" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <p className="settings-intro">I read these to find free time and deadlines. I never edit them without your OK.</p>
        <div className="source-settings-list">
          {rows.map((r) => (
            <section key={r.id}>
              <div className={`source-logo ${r.cls}`}>
                <Icon name={r.icon} size={20} />
              </div>
              <div>
                <strong>{r.name}</strong>
                <small>{r.reads}</small>
                <span>
                  <i className={sources[r.id] ? "connected" : ""} />
                  {sources[r.id] ? "Connected · synced 4:50 pm" : "Disconnected"}
                </span>
              </div>
              {sources[r.id] ? (
                <button onClick={() => setConfirm(r.id)}>Disconnect</button>
              ) : (
                <button className="reconnect-button" onClick={() => setSource(r.id, true)}>
                  Reconnect
                </button>
              )}
            </section>
          ))}
        </div>
      </div>
      {confirm && (
        <Sheet onClose={() => setConfirm(null)}>
          <div className="sheet-icon cancel-icon">
            <Icon name="calendar" size={24} />
          </div>
          <h2>Disconnect {confirm === "calendar" ? "Google Calendar" : "Course site"}?</h2>
          <p className="sheet-detail">I’ll stop reading it. Plans you already set stay as they are.</p>
          <button
            className="danger-button"
            onClick={() => {
              setSource(confirm, false)
              setConfirm(null)
            }}
          >
            Disconnect
          </button>
          <button className="secondary-button" onClick={() => setConfirm(null)}>
            Keep connected
          </button>
        </Sheet>
      )}
    </main>
  )
}

function PrivacySettings({ onBack, onDeleted }: { onBack: () => void; onDeleted: () => void }) {
  const { deleteAllData } = useStore()
  const [confirm, setConfirm] = useState(false)
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Privacy & data" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <section className="privacy-summary-card static">
          <span className="settings-list-icon">
            <Icon name="book" size={20} />
          </span>
          <div>
            <strong>What I read</strong>
            <p>Your calendar and course site deadlines. Nothing else.</p>
          </div>
        </section>
        <div className="read-list standalone">
          {[
            ["Google Calendar", "Event times and titles, to find free time"],
            ["Course site", "Due dates for your assignments"],
            ["Check-ins", "What you tap, to plan better next time"],
          ].map(([what, why]) => (
            <div className="read-item" key={what}>
              <span>
                <strong>{what}</strong>
                <small>{why}</small>
              </span>
              <Icon name="check" size={16} />
            </div>
          ))}
        </div>
        <section className="data-promise">
          <Icon name="lock" size={22} />
          <div>
            <h2>I don’t read email, messages or grades</h2>
            <p>Drafts to friends or your TA are only sent when you press and hold Send.</p>
          </div>
        </section>
        <button className="delete-data-button" onClick={() => setConfirm(true)}>
          Delete my data
        </button>
      </div>
      {confirm && (
        <Sheet onClose={() => setConfirm(false)}>
          <div className="sheet-icon cancel-icon">
            <Icon name="trash" size={23} />
          </div>
          <h2>Delete your Time Protector data?</h2>
          <p className="sheet-detail">I’ll delete your rules, plans and history, and disconnect your calendar. This can’t be undone.</p>
          <button
            className="danger-button"
            onClick={() => {
              deleteAllData()
              setConfirm(false)
              onDeleted()
            }}
          >
            Delete my data
          </button>
          <button className="secondary-button" onClick={() => setConfirm(false)}>
            Keep my data
          </button>
        </Sheet>
      )}
    </main>
  )
}

function SettingsPage({ route, onRoute, onClose, onDeleted }: { route: SettingsRoute; onRoute: (r: SettingsRoute) => void; onClose: () => void; onDeleted: () => void }) {
  const { rules, checkins, changeMode, sources } = useStore()
  const back = () => onRoute("root")
  if (route === "rules") return <RulesSettings onBack={back} />
  if (route === "checkins") return <CheckinSettings onBack={back} />
  if (route === "change") return <ChangeModeSettings onBack={back} />
  if (route === "calendars") return <CalendarSettings onBack={back} />
  if (route === "privacy") return <PrivacySettings onBack={back} onDeleted={onDeleted} />
  const rows: { id: SettingsRoute; title: string; detail: string; icon: string }[] = [
    {
      id: "rules",
      title: "Protected-time rules",
      detail: `Sleep: ${levelLabel[rules.sleep.level]} · Gym: ${levelLabel[rules.gym.level]} · Meals: ${levelLabel[rules.meals.level]}`,
      icon: "shield",
    },
    {
      id: "checkins",
      title: "Check-ins",
      detail: checkins.timing === "before" ? "5 min before a block ends" : checkins.timing === "end" ? "At the end of a block" : "Off",
      icon: "bell",
    },
    { id: "change", title: "How I change your plan", detail: changeMode === "ask" ? "Always ask" : "Automatic if nothing protected changes", icon: "sparkle" },
    {
      id: "calendars",
      title: "Calendars & course site",
      detail: `${[sources.calendar, sources.bcourses].filter(Boolean).length} of 2 connected`,
      icon: "calendar",
    },
    { id: "privacy", title: "Privacy & data", detail: "What I read, and deleting it", icon: "lock" },
  ]
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Settings" onBack={onClose} />
      <div className="flow-scroll settings-scroll">
        <div className="settings-profile">
          <div className="profile-large">{user.initials}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.program}</span>
          </div>
        </div>
        <div className="settings-list">
          {rows.map((row) => (
            <button onClick={() => onRoute(row.id)} key={row.id}>
              <span className="settings-list-icon">
                <Icon name={row.icon} size={20} />
              </span>
              <span>
                <strong>{row.title}</strong>
                <small>{row.detail}</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
        <p className="settings-control-note">
          <Icon name="lock" size={14} />
          Protected time never moves without your OK.
        </p>
      </div>
    </main>
  )
}

// ---------- Onboarding (O1–O6) ----------

function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const { setRule, setCheckins, setChangeMode, setOnboardingComplete, setSource } = useStore()
  const [step, setStep] = useState(1)
  const [picks, setPicks] = useState<string[]>(["Meals with friends", "Sleep", "Exercise"])
  const [custom, setCustom] = useState<string | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [customText, setCustomText] = useState("")
  const [sleepMin, setSleepMin] = useState(7)
  const [wind, setWind] = useState(45)
  const [gymDays, setGymDays] = useState(["Mon", "Wed", "Fri"])
  const [dinner, setDinner] = useState<boolean | null>(null)
  const [connected, setConnected] = useState<string[]>([])
  const [timing, setTiming] = useState<"before" | "end" | "off">("before")
  const [quiet, setQuiet] = useState(true)
  const [mode, setMode] = useState<"ask" | "auto">("ask")
  const next = () => setStep((s) => Math.min(6, s + 1))
  const finish = () => {
    setRule("sleep", { level: picks.includes("Sleep") ? "hard" : "off", minHours: sleepMin, windDown: wind }, "onboarding")
    setRule("gym", { level: picks.includes("Exercise") ? "hard" : "off" }, "onboarding")
    setRule("meals", { level: picks.includes("Meals with friends") && dinner !== false ? "hard" : "off" }, "onboarding")
    setRule("noWorkAfter", { level: picks.includes("No work after a set time") ? "hard" : "off" }, "onboarding")
    setCheckins({ timing, quiet })
    setChangeMode(mode)
    setSource("calendar", true)
    setSource("bcourses", true)
    setOnboardingComplete(true)
    onDone()
  }
  if (step === 1) {
    return (
      <main className="onboarding-screen onboarding-welcome">
        <div className="onboarding-brand">
          <Icon name="shield" size={30} />
        </div>
        <span className="onboarding-kicker">TIME PROTECTOR</span>
        <h1>Work runs over.</h1>
        <h2>Your evenings shouldn’t.</h2>
        <div className="onboarding-promises">
          {[
            ["bell", "One tap when a block ends", "Done, or need more time?"],
            ["shield", "Your evenings stay yours", "Protected time never moves on its own"],
            ["undo", "You approve every change", "Every plan can be undone"],
          ].map(([icon, title, detail]) => (
            <div key={title}>
              <span>
                <Icon name={icon} size={19} />
              </span>
              <p>
                <strong>{title}</strong>
                {detail}
              </p>
            </div>
          ))}
        </div>
        <button className="primary-button" onClick={next}>
          Get started
        </button>
      </main>
    )
  }
  const allChips = ["Meals with friends", "Sleep", "Exercise", "Family calls", "No work after a set time"]
  return (
    <main className="flow-screen onboarding-flow">
      <header className="onboarding-header">
        <button className="onboarding-back" aria-label="Back" onClick={() => setStep((s) => Math.max(1, s - 1))}>
          <Icon name="back" size={20} />
        </button>
        <span>{step - 1} of 5</span>
        <div>
          <i style={{ width: `${((step - 1) / 5) * 100}%` }} />
        </div>
      </header>
      <div className="flow-scroll onboarding-scroll">
        {step === 2 && (
          <>
            <h1>What’s worth protecting?</h1>
            <p>Pick what work shouldn’t eat into. You can change this anytime.</p>
            <div className="pick-chips">
              {allChips.map((c) => (
                <button
                  key={c}
                  role="checkbox"
                  aria-checked={picks.includes(c)}
                  className={picks.includes(c) ? "selected" : ""}
                  onClick={() => setPicks((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}
                >
                  {picks.includes(c) && <Icon name="check" size={15} />}
                  {c}
                </button>
              ))}
              <button
                role="checkbox"
                aria-checked={custom !== null}
                className={custom !== null ? "selected" : ""}
                onClick={() => (custom !== null ? setCustom(null) : setCustomOpen(true))}
              >
                {custom !== null ? <Icon name="check" size={15} /> : <Icon name="plus" size={15} />}
                {custom ?? "Custom"}
              </button>
            </div>
            <button className="primary-button" disabled={!picks.length && custom === null} onClick={next}>
              Continue
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h1>The details</h1>
            <p>I’ll use these when I suggest plans.</p>
            <section className="onboarding-card">
              <div className="ob-row">
                <span>
                  <strong>Sleep minimum</strong>
                  <small>I’ll warn you before going below this</small>
                </span>
                <output>{dur(sleepMin * 60)}</output>
              </div>
              <input type="range" min={6} max={9} step={0.5} value={sleepMin} aria-label="Sleep minimum in hours" onChange={(e) => setSleepMin(Number(e.target.value))} />
              <div className="ob-row">
                <span>
                  <strong>Wind-down</strong>
                  <small>No work right before bed</small>
                </span>
              </div>
              <Segmented
                value={String(wind)}
                options={[
                  ["15", "15 min"],
                  ["30", "30 min"],
                  ["45", "45 min"],
                  ["60", "1 h"],
                ]}
                label="Wind-down length"
                onChange={(v) => setWind(Number(v))}
              />
              <div className="ob-row">
                <span>
                  <strong>Gym days</strong>
                  <small>7:00 am</small>
                </span>
              </div>
              <div className="day-pills">
                {DAY_SHORT.map((d) => (
                  <button
                    key={d}
                    role="checkbox"
                    aria-checked={gymDays.includes(d)}
                    className={gymDays.includes(d) ? "selected" : ""}
                    onClick={() => setGymDays((g) => (g.includes(d) ? g.filter((x) => x !== d) : [...g, d]))}
                  >
                    {d[0]}
                    <span className="sr-only">{d}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="found-card">
              <span className="sparkle">
                <Icon name="dinner" size={16} />
              </span>
              <p>
                <strong>I found Dinner with friends, Tue 7:00 pm.</strong>
                Protect it?
              </p>
              <div>
                <button className={dinner === true ? "selected" : ""} onClick={() => setDinner(true)}>
                  Yes
                </button>
                <button className={dinner === false ? "selected" : ""} onClick={() => setDinner(false)}>
                  No
                </button>
              </div>
            </section>
            <button className="primary-button" disabled={dinner === null} onClick={next}>
              Continue
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <h1>Connect your calendar and course site</h1>
            <p>I use them to find free time and deadlines. I never edit them without your OK.</p>
            <div className="onboarding-sources">
              {[
                ["calendar", "Google Calendar", "Free time and events", "source-calendar", "calendar"],
                ["bcourses", "Course site", "Deadlines only", "source-bcourses", "book"],
              ].map(([id, name, detail, cls, icon]) => (
                <section key={id}>
                  <span className={`source-logo ${cls}`}>
                    <Icon name={icon} size={19} />
                  </span>
                  <div>
                    <strong>{name}</strong>
                    <small>{detail}</small>
                  </div>
                  {connected.includes(id) ? (
                    <span className="onboarding-connected">
                      <Icon name="check" size={13} />
                      Connected
                    </span>
                  ) : (
                    <button onClick={() => setConnected((c) => [...c, id])}>Connect</button>
                  )}
                </section>
              ))}
            </div>
            <button className="primary-button" disabled={connected.length < 2} onClick={next}>
              Continue
            </button>
          </>
        )}
        {step === 5 && (
          <>
            <h1>Check-ins</h1>
            <p>When a study block is ending, I ask one question: done, or need more time?</p>
            <div className="onboarding-autonomy">
              {(
                [
                  ["before", "5 min before a study block ends", "Recommended. Time to decide before you’re late."],
                  ["end", "At the end", "Right when the block finishes."],
                  ["off", "Off", "You can still open the app and re-plan."],
                ] as const
              ).map(([v, title, detail]) => (
                <button key={v} className={timing === v ? "selected" : ""} onClick={() => setTiming(v)}>
                  <span />
                  <div>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </div>
                </button>
              ))}
            </div>
            <div className="notification-settings-list ob-quiet">
              <section>
                <div>
                  <strong>Quiet hours</strong>
                  <span>10:00 pm–8:00 am</span>
                </div>
                <Toggle checked={quiet} onChange={setQuiet} label="Quiet hours" />
              </section>
            </div>
            <button className="primary-button" onClick={next}>
              Continue
            </button>
          </>
        )}
        {step === 6 && (
          <>
            <h1>How I change your plan</h1>
            <p>You can change this later in Settings.</p>
            <div className="onboarding-autonomy">
              {(
                [
                  ["ask", "Always show me options and ask first", ["See what each option keeps and costs", "Nothing moves until you approve"]],
                  ["auto", "Apply automatically if nothing protected changes", ["Saves a tap on easy days", "Anything that touches protected time, I ask"]],
                ] as const
              ).map(([v, title, examples]) => (
                <button key={v} className={mode === v ? "selected" : ""} onClick={() => setMode(v)}>
                  <span />
                  <div>
                    <strong>{title}</strong>
                    {examples.map((x) => (
                      <small key={x}>
                        <Icon name="check" size={12} />
                        {x}
                      </small>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <button className="primary-button" onClick={finish}>
              Go to Today
            </button>
          </>
        )}
      </div>
      {customOpen && (
        <Sheet onClose={() => setCustomOpen(false)}>
          <span className="sheet-kicker">CUSTOM</span>
          <h2>What else should I protect?</h2>
          <label className="edit-field-input">
            <span>Name</span>
            <input value={customText} placeholder="e.g. Choir practice" onChange={(e) => setCustomText(e.target.value)} />
          </label>
          <button
            className="primary-button"
            disabled={!customText.trim()}
            onClick={() => {
              setCustom(customText.trim())
              setCustomOpen(false)
            }}
          >
            Add
          </button>
        </Sheet>
      )}
    </main>
  )
}

// ---------- Moderator panel ----------

type Jump = "lock" | "studying" | "today" | "settings" | "insights" | "onboarding"

function ModeratorPanel({
  onClose,
  onReset,
  onJump,
  overloadAlert,
  setOverloadAlert,
  autoCheckin,
  setAutoCheckin,
  onTrigger,
}: {
  onClose: () => void
  onReset: () => void
  onJump: (j: Jump) => void
  overloadAlert: boolean
  setOverloadAlert: (v: boolean) => void
  autoCheckin: boolean
  setAutoCheckin: (v: boolean) => void
  onTrigger: () => void
}) {
  const jumps: [Jump, string, string][] = [
    ["lock", "Lock screen", "Task 1 & 2 start"],
    ["studying", "Studying screen", "Check-in while working"],
    ["today", "Today", "Task 3 & 4 start"],
    ["settings", "Settings", "Protected-time rules"],
    ["insights", "Insights", "Task 4 shortcut"],
    ["onboarding", "Onboarding", "First-run setup"],
  ]
  return (
    <div
      className="moderator-layer"
      data-fp-moderator=""
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section className="moderator-sheet">
        <div className="grabber" />
        <header>
          <div>
            <span>DEMO CONTROLS</span>
            <h2>Moderator</h2>
          </div>
          <b>{VERSION}</b>
        </header>
        <button className="moderator-reset" onClick={onReset}>
          <Icon name="undo" size={18} />
          Reset demo
        </button>
        <h3>JUMP TO</h3>
        <div className="moderator-jumps">
          {jumps.map(([id, label, detail]) => (
            <button onClick={() => onJump(id)} key={id}>
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <Icon name="chevron" size={17} />
            </button>
          ))}
        </div>
        <h3>TOGGLES</h3>
        <div className="moderator-toggles">
          <label>
            <span>
              <strong>Show overload alert</strong>
              <small>“Thursday looks heavy” on Today and Week</small>
            </span>
            <Toggle checked={overloadAlert} onChange={setOverloadAlert} label="Show overload alert" />
          </label>
          <label>
            <span>
              <strong>Auto check-in on Studying screen</strong>
              <small>Arrives after 60 s (or long-press the timer 3 s)</small>
            </span>
            <Toggle checked={autoCheckin} onChange={setAutoCheckin} label="Auto check-in" />
          </label>
        </div>
        <button className="moderator-trigger" onClick={onTrigger}>
          <Icon name="bell" size={17} />
          Trigger check-in now
        </button>
        <FootprintsPanel prototype="time-protector" />
        <button className="moderator-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  )
}

// ---------- In-app banner ----------

function CheckinBanner({
  onOpen,
  onAction,
  onDismiss,
}: {
  onOpen: () => void
  onAction: (a: "done" | "+30" | "need more") => void
  onDismiss: () => void
}) {
  const { noteCheckinShown } = useStore()
  useEffect(() => {
    noteCheckinShown("banner")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="banner-layer">
      <CheckinNotification variant="banner" onOpen={onOpen} onAction={onAction} onDismiss={onDismiss} />
    </div>
  )
}

// ---------- App ----------

type Tab = "today" | "week" | "history" | "insights"

type View =
  | { name: "tabs" }
  | { name: "lock" }
  | { name: "studying" }
  | { name: "replan"; editPlanId?: string; key: number }
  | { name: "done" }
  | { name: "settings"; route: SettingsRoute }
  | { name: "day"; day: number }
  | { name: "plan"; id: string }
  | { name: "overload" }

const initialView = (): View => {
  const h = window.location.hash
  if (h === "#lock") return { name: "lock" }
  if (h === "#studying") return { name: "studying" }
  return { name: "tabs" }
}

function Navigation({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tab-bar">
      {(["today", "week", "history", "insights"] as Tab[]).map((key) => (
        <button className={tab === key ? "active" : ""} onClick={() => onChange(key)} key={key} aria-current={tab === key ? "page" : undefined}>
          <span className="nav-icon">
            <Icon name={key} size={22} />
          </span>
          <span>{key[0].toUpperCase() + key.slice(1)}</span>
        </button>
      ))}
    </nav>
  )
}

function AppContent() {
  const store = useStore()
  const { onboardingComplete, setOnboardingComplete, toast, clearToast, checkinAction, markDone, extendBlock, reset, checkin } = store
  const [view, setView] = useState<View>(initialView)
  const [tab, setTab] = useState<Tab>("today")
  const [showMod, setShowMod] = useState(() => window.location.hash === "#mod")
  const [checkinSheet, setCheckinSheet] = useState(false)
  const [block, setBlock] = useState<CalEvent | null>(null)
  const [banner, setBanner] = useState(false)
  const [overloadAlert, setOverloadAlert] = useState(false)
  const [autoCheckin, setAutoCheckin] = useState(true)
  const [trigger, setTrigger] = useState(0)
  const [prevView, setPrevView] = useState<View>({ name: "tabs" })
  const replanKey = useRef(0)

  useEffect(() => {
    if (window.location.hash === "#onboarding") setOnboardingComplete(false)
    const onHash = () => {
      const h = window.location.hash
      if (h === "#lock") {
        setShowMod(false)
        setView({ name: "lock" })
      } else if (h === "#mod") setShowMod(true)
      else if (h === "#studying") setView({ name: "studying" })
      else if (h === "#onboarding") {
        setShowMod(false)
        setOnboardingComplete(false)
        setView({ name: "tabs" })
      }
    }
    const open = () => setShowMod(true)
    window.addEventListener("hashchange", onHash)
    window.addEventListener("open-moderator", open)
    return () => {
      window.removeEventListener("hashchange", onHash)
      window.removeEventListener("open-moderator", open)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(clearToast, toast.undo ? 5000 : 3200)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])

  const startReplan = (editPlanId?: string) => {
    replanKey.current += 1
    setBlock(null)
    setCheckinSheet(false)
    setView({ name: "replan", editPlanId, key: replanKey.current })
  }

  const handleCheckin = (action: "done" | "+30" | "need more", where: string) => {
    checkinAction(action, where)
    setCheckinSheet(false)
    setBanner(false)
    setBlock(null)
    if (action === "done") {
      markDone()
      setView({ name: "done" })
    } else if (action === "+30") {
      extendBlock(where)
      setTab("today")
      setView({ name: "tabs" })
    } else {
      startReplan()
    }
  }

  const closeAll = () => {
    setShowMod(false)
    setCheckinSheet(false)
    setBlock(null)
    setBanner(false)
  }

  const jump = (j: Jump) => {
    reset()
    closeAll()
    setOnboardingComplete(j !== "onboarding")
    setTab(j === "insights" ? "insights" : "today")
    if (j === "lock") setView({ name: "lock" })
    else if (j === "studying") setView({ name: "studying" })
    else if (j === "settings") setView({ name: "settings", route: "rules" })
    else setView({ name: "tabs" })
  }

  const toastView = toast && (
    <div className="app-toast" role="status" key={toast.key}>
      <Icon name="check" size={17} />
      <span>{toast.text}</span>
      {toast.undo && (
        <button
          onClick={() => {
            toast.undo?.()
            clearToast()
          }}
        >
          Undo
        </button>
      )}
    </div>
  )

  const moderator = showMod && (
    <ModeratorPanel
      onClose={() => setShowMod(false)}
      onReset={() => {
        reset()
        closeAll()
        setOverloadAlert(false)
        setAutoCheckin(true)
        setTab("today")
        setView({ name: "tabs" })
      }}
      onJump={jump}
      overloadAlert={overloadAlert}
      setOverloadAlert={setOverloadAlert}
      autoCheckin={autoCheckin}
      setAutoCheckin={setAutoCheckin}
      onTrigger={() => {
        setShowMod(false)
        if (view.name === "studying") setTrigger((n) => n + 1)
        else if (view.name !== "lock") setBanner(true)
      }}
    />
  )

  if (view.name === "lock") {
    return (
      <div className="device-shell lock-shell">
        <LockScreen
          onOpenApp={() => {
            setTab("today")
            setView({ name: "tabs" })
          }}
          onOpenCheckin={() => {
            setTab("today")
            setView({ name: "tabs" })
            setCheckinSheet(true)
          }}
          onAction={(a) => handleCheckin(a, "lock")}
        />
        {toastView}
        {moderator}
      </div>
    )
  }

  if (view.name === "studying") {
    return (
      <div className="device-shell studying-shell">
        <StudyingScreen
          autoCheckin={autoCheckin && checkin === "pending"}
          trigger={trigger}
          onCheckin={() => setBanner(true)}
          onBack={() => {
            setTab("today")
            setView({ name: "tabs" })
          }}
          onDoneEarly={() => handleCheckin("done", "studying")}
        />
        {banner && checkin === "pending" && (
          <CheckinBanner
            onOpen={() => {
              setBanner(false)
              setTab("today")
              setView({ name: "tabs" })
              setCheckinSheet(true)
            }}
            onAction={(a) => handleCheckin(a, "banner")}
            onDismiss={() => {
              checkinAction("dismissed", "banner")
              setBanner(false)
            }}
          />
        )}
        {toastView}
        {moderator}
      </div>
    )
  }

  const goTabs = (tb: Tab = tab) => {
    setTab(tb)
    setView({ name: "tabs" })
  }
  const openSettings = (route: SettingsRoute = "root") => {
    setBlock(null)
    setPrevView(view)
    setView({ name: "settings", route })
  }
  const showTabs = onboardingComplete && view.name === "tabs"

  let body: ReactNode = null
  if (!onboardingComplete) {
    body = <OnboardingFlow onDone={() => goTabs("today")} />
  } else if (view.name === "replan") {
    body = (
      <ReplanFlow
        key={view.key}
        editPlanId={view.editPlanId}
        onExit={() => goTabs("today")}
        onViewPlan={(id) => {
          setTab("history")
          setView({ name: "plan", id })
        }}
      />
    )
  } else if (view.name === "done") {
    body = <DoneScreen onBack={() => goTabs("today")} />
  } else if (view.name === "settings") {
    body = (
      <SettingsPage
        route={view.route}
        onRoute={(route) => setView({ name: "settings", route })}
        onClose={() => (prevView.name === "settings" || prevView.name === "replan" ? goTabs() : setView(prevView))}
        onDeleted={() => goTabs("today")}
      />
    )
  } else if (view.name === "day") {
    body = <DayView day={view.day} onBack={() => goTabs("week")} onEvent={setBlock} onOverload={() => setView({ name: "overload" })} />
  } else if (view.name === "plan") {
    body = <PlanDetail id={view.id} onBack={() => goTabs("history")} onEdit={(id) => startReplan(id)} />
  } else if (view.name === "overload") {
    body = <OverloadFlow onExit={() => goTabs()} />
  } else if (tab === "today") {
    body = (
      <Today
        onAvatar={() => openSettings()}
        onCheckin={(a) => handleCheckin(a, "today")}
        onEvent={setBlock}
        onPlan={(id) => setView({ name: "plan", id })}
        overloadAlert={overloadAlert}
        onOverload={() => setView({ name: "overload" })}
      />
    )
  } else if (tab === "week") {
    body = <Week onAvatar={() => openSettings()} onDay={(day) => setView({ name: "day", day })} overloadAlert={overloadAlert} onOverload={() => setView({ name: "overload" })} />
  } else if (tab === "history") {
    body = <History onAvatar={() => openSettings()} onOpen={(id) => setView({ name: "plan", id })} />
  } else {
    body = <Insights onAvatar={() => openSettings()} />
  }

  return (
    <div className="device-shell">
      <StatusBar />
      <div className="app-body">{body}</div>
      {showTabs && <Navigation tab={tab} onChange={(tb) => goTabs(tb)} />}
      {checkinSheet && checkin === "pending" && (
        <CheckinSheet onClose={() => setCheckinSheet(false)} onAction={(a) => handleCheckin(a, "app")} />
      )}
      {block && (
        <BlockSheet
          event={block}
          onClose={() => setBlock(null)}
          onDone={() => handleCheckin("done", "block")}
          onNeedMore={() => {
            if (block.id === "tue-study" && checkin === "pending") checkinAction("need more", "block")
            startReplan()
          }}
          onMove={(planId) => startReplan(planId)}
          onSettings={() => openSettings("rules")}
        />
      )}
      {banner && checkin === "pending" && (
        <CheckinBanner
          onOpen={() => {
            setBanner(false)
            goTabs("today")
            setCheckinSheet(true)
          }}
          onAction={(a) => handleCheckin(a, "banner")}
          onDismiss={() => {
            checkinAction("dismissed", "banner")
            setBanner(false)
          }}
        />
      )}
      {toastView}
      {moderator}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}
