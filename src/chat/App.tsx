import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { FootprintsPanel } from "@/shared/FootprintsPanel"
import { logFootprint } from "@/shared/footprints"
import {
  BUILD_VERSION,
  DAY,
  TODAY,
  UNLOCK_AT,
  atDayLabel,
  atShort,
  atStamp,
  chatMeta,
  clock,
  dayLabel,
  durationLabel,
  emails,
  fmt,
  fmtRange,
  people,
  weekday,
  weekdayLong,
  type CalEvent,
  type ChatId,
  type Email,
  type Msg,
  type Quote,
  type Tone,
} from "./data"
import {
  SAMPLE_MSG,
  StoreProvider,
  canUndo,
  corrAt,
  editNotes,
  editedFields,
  entryUndone,
  isCorrectStudy,
  itemPreview,
  nowAt,
  overlaps,
  shortRoom,
  slotText,
  studyEvent,
  top,
  useStore,
  type BotItem,
  type Jump,
  type Proposal,
  type Quick,
  type Screen,
  type Slot,
  type State,
} from "./store"

type ThreadChat = Exclude<ChatId, "bot">

// ---------- Icons ----------

const paths: Record<string, ReactNode> = {
  back: <path d="m15 18-6-6 6-6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <path d="m7 7 10 10M17 7 7 17" />,
  check: <path d="m5 12 4 4L19 6" />,
  checks: (
    <>
      <path d="m2.5 12.5 4 4 8-9" />
      <path d="m11 16 .8.6 8-9.1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  calcheck: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="m9 15.5 2 2 4-4" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z" />
      <path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
      <path d="M3.5 3.5v5h5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  forward: (
    <>
      <path d="m15 5 6 6-6 6" />
      <path d="M21 11H10a7 7 0 0 0-7 7v1" />
    </>
  ),
  reply: (
    <>
      <path d="M9 5 3 11l6 6" />
      <path d="M3 11h11a7 7 0 0 1 7 7v1" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </>
  ),
  select: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  send: <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />,
  clip: <path d="m20.5 11.5-8.2 8.2a5.2 5.2 0 0 1-7.4-7.4l8.6-8.6a3.5 3.5 0 0 1 5 5l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  zoom: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
    </>
  ),
  pin: (
    <>
      <path d="M9 3.5h6l-1 6.5 3.5 3.5h-11L10 10z" />
      <path d="M12 13.5V21" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 2.8 19.5h18.4z" />
      <path d="M12 10v4.2M12 16.9h.01" />
    </>
  ),
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  place: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 21h4" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h12l-2.5 4L17 12H5" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3.2-.2 5 1.5 5.5 4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 3.5V8h4.5" />
      <path d="M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20.5V16h-4.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  shield: <path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  book: (
    <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5a3.5 3.5 0 0 1 3.5 3z" />
  ),
  link: (
    <>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L11.8 6" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

// ---------- Small pieces ----------

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  )
}

function Avatar({
  colors,
  text,
  icon,
  size = 40,
  className = "",
}: {
  colors: [string, string]
  text?: string
  icon?: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={`round-avatar ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, ${colors[0]}, ${colors[1]})`,
        fontSize: Math.max(12, Math.round(size * (text && text.length > 2 ? 0.3 : 0.4))),
      }}
      aria-hidden="true"
    >
      {icon ? <Icon name={icon} size={Math.round(size * 0.5)} /> : text}
    </span>
  )
}

function ChatAvatar({ chat, size = 40 }: { chat: ChatId; size?: number }) {
  const meta = chatMeta[chat]
  return (
    <Avatar
      colors={meta.avatar}
      text={meta.avatarText}
      icon={chat === "bot" ? "calcheck" : undefined}
      size={size}
    />
  )
}

function PersonAvatar({ id, size = 34 }: { id: string; size?: number }) {
  const person = people[id] ?? people.me
  return <Avatar colors={person.avatar} text={person.name[0]} size={size} />
}

const toneClass: Record<Tone, string> = {
  chat: "tone-chat",
  screenshot: "tone-screenshot",
  email: "tone-email",
  bcourses: "tone-bcourses",
  calendar: "tone-calendar",
}

function SourceChip({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`source-chip ${toneClass[tone]}`}>{label}</span>
}

function EditedChip() {
  return (
    <span className="source-chip tone-edited">
      <Icon name="edit" size={12} />
      Edited by you
    </span>
  )
}

function useTick(ms = 10000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), ms)
    return () => window.clearInterval(id)
  }, [ms])
}

function openModerator() {
  window.dispatchEvent(new CustomEvent("open-moderator"))
}

// A 3-second press-and-hold opens the moderator panel (same gesture as the assistant).
function useModeratorPress(onTap?: () => void) {
  const timer = useRef<number | null>(null)
  const opened = useRef(false)
  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }
  return {
    onPointerDown: () => {
      opened.current = false
      stop()
      timer.current = window.setTimeout(() => {
        opened.current = true
        openModerator()
      }, 3000)
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onPointerLeave: stop,
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
    onClick: () => {
      if (!opened.current) onTap?.()
      opened.current = false
    },
  }
}

// Tap and long-press on a message bubble.
function usePress(onTap: (target: HTMLElement) => void, onLong: () => void, ms = 450) {
  const timer = useRef<number | null>(null)
  const fired = useRef(false)
  const start = useRef({ x: 0, y: 0 })
  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      clear()
      timer.current = window.setTimeout(() => {
        fired.current = true
        logFootprint("long_press", {})
        onLong()
      }, ms)
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (Math.abs(e.clientX - start.current.x) > 8 || Math.abs(e.clientY - start.current.y) > 8) clear()
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e: ReactMouseEvent) => {
      e.preventDefault()
      clear()
      if (!fired.current) {
        fired.current = true
        onLong()
      }
    },
    onClick: (e: ReactMouseEvent) => {
      if (fired.current) {
        fired.current = false
        return
      }
      onTap(e.target as HTMLElement)
    },
  }
}

function animateBack(el: HTMLElement | null, done: () => void) {
  const root = el?.closest(".screen-root")
  root?.classList.add("page-pop")
  window.setTimeout(done, 170)
}

function FlowHeader({
  title,
  backLabel = "Back",
  onBack,
  right,
  closeIcon,
}: {
  title: string
  backLabel?: string
  onBack?: () => void
  right?: ReactNode
  closeIcon?: boolean
}) {
  const { back } = useStore()
  return (
    <header className="flow-header">
      <button
        className="header-back"
        onClick={(e) => animateBack(e.currentTarget, onBack ?? back)}
        aria-label={closeIcon ? "Close" : backLabel}
      >
        <Icon name={closeIcon ? "close" : "back"} size={closeIcon ? 21 : 23} />
        <span>{closeIcon ? "Close" : backLabel}</span>
      </button>
      <h1 className="flow-title">{title}</h1>
      <div className="header-right">{right}</div>
    </header>
  )
}

function Sheet({
  children,
  onClose,
  className = "",
  label,
}: {
  children: ReactNode
  onClose: () => void
  className?: string
  label?: string
}) {
  return (
    <div
      className="sheet-layer"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section className={`sheet ${className}`} role="dialog" aria-modal="true" aria-label={label}>
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
      onClick={(e) => {
        e.preventDefault()
        onChange(!checked)
      }}
    >
      <span />
    </button>
  )
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement("textarea")
      area.value = text
      area.style.position = "fixed"
      area.style.opacity = "0"
      document.body.appendChild(area)
      area.select()
      document.execCommand("copy")
      area.remove()
      return true
    } catch {
      return false
    }
  }
}

// ---------- The screenshot in Priya's chat (drawn, not an image file) ----------

function ScreenshotArt({ thumb = false }: { thumb?: boolean }) {
  return (
    <svg
      className="shot-art"
      viewBox="0 0 360 540"
      preserveAspectRatio={thumb ? "xMidYMin slice" : "xMidYMid meet"}
      role="img"
      aria-label="Screenshot of an Stats 203 announcement by Alex Rivera (TA), Nov 9, 4:12 pm: Assignment 5 deadline extended to Mon Nov 16, 9:00 am. Late days still apply after that."
      fontFamily="'Inter Variable', Inter, -apple-system, sans-serif"
    >
      <rect width="360" height="540" fill="#f8fafc" />
      <text x="24" y="27" fontSize="14" fontWeight="700" fill="#111827">1:50</text>
      <rect x="304" y="15" width="28" height="13" rx="3.5" fill="none" stroke="#111827" strokeWidth="1.5" />
      <rect x="307" y="18" width="19" height="7" rx="1.5" fill="#111827" />
      <rect y="40" width="360" height="56" fill="#ffffff" />
      <path d="M26 59l-8 9 8 9" stroke="#2563eb" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="36" y="74" fontSize="16" fill="#2563eb">Stats 203</text>
      <text x="196" y="74" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">Discussion</text>
      <line x1="0" y1="96" x2="360" y2="96" stroke="#e5e7eb" />
      <rect x="18" y="112" width="122" height="26" rx="13" fill="#fef3c7" />
      <text x="79" y="130" textAnchor="middle" fontSize="13" fontWeight="700" fill="#b45309">Announcement</text>
      <text x="152" y="130" fontSize="13" fill="#6b7280">📌 Pinned</text>
      <circle cx="40" cy="174" r="21" fill="#0d9488" />
      <text x="40" y="180" textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffffff">AR</text>
      <text x="72" y="169" fontSize="16" fontWeight="700" fill="#111827">Alex Rivera</text>
      <rect x="172" y="155" width="38" height="19" rx="5" fill="#dbeafe" />
      <text x="191" y="169" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1d4ed8">TA</text>
      <text x="72" y="190" fontSize="13.5" fill="#6b7280">Nov 9, 4:12 pm · Stats 203</text>
      <text x="18" y="236" fontSize="20" fontWeight="800" fill="#111827">Assignment 5 deadline extended</text>
      <text x="18" y="272" fontSize="16" fill="#374151">Assignment 5 deadline extended to</text>
      <text x="18" y="297" fontSize="16" fill="#111827" fontWeight="800">
        Mon Nov 16, 9:00 am<tspan fontWeight="400" fill="#374151">. Late days still</tspan>
      </text>
      <text x="18" y="322" fontSize="16" fill="#374151">apply after that.</text>
      <text x="18" y="356" fontSize="16" fill="#374151">– Alex</text>
      <rect x="18" y="380" width="66" height="28" rx="14" fill="#eef2f7" />
      <text x="51" y="399" textAnchor="middle" fontSize="13.5" fill="#374151">👍 24</text>
      <text x="98" y="399" fontSize="13.5" fill="#6b7280">12 replies · 86 views</text>
      <line x1="0" y1="426" x2="360" y2="426" stroke="#e5e7eb" />
      <circle cx="34" cy="456" r="13" fill="#cbd5e1" />
      <rect x="56" y="446" width="150" height="9" rx="4.5" fill="#e2e8f0" />
      <rect x="56" y="461" width="236" height="9" rx="4.5" fill="#e2e8f0" />
      <circle cx="34" cy="504" r="13" fill="#cbd5e1" />
      <rect x="56" y="494" width="120" height="9" rx="4.5" fill="#e2e8f0" />
      <rect x="56" y="509" width="210" height="9" rx="4.5" fill="#e2e8f0" />
    </svg>
  )
}

// ---------- Status bar, banner, toast ----------

function StatusBar() {
  const { s } = useStore()
  useTick()
  return (
    <div className="status-bar">
      <span>{clock(nowAt(s))}</span>
      <div className="status-icons">
        <span className="signal" />
        <span className="wifi">◒</span>
        <span className="battery" />
      </div>
    </div>
  )
}

function BannerView() {
  const { s, go, clearBanner } = useStore()
  const banner = s.banner
  useEffect(() => {
    if (!banner) return
    const id = window.setTimeout(() => clearBanner(banner.id), 4500)
    return () => window.clearTimeout(id)
  }, [banner, clearBanner])
  if (!banner) return null
  return (
    <button
      className="in-app-banner"
      key={banner.id}
      onClick={() => {
        clearBanner(banner.id)
        go({ name: "chat", chat: banner.chat })
      }}
    >
      <ChatAvatar chat={banner.chat} size={38} />
      <span>
        <strong>{banner.title}</strong>
        <span>{banner.text}</span>
      </span>
    </button>
  )
}

function ToastView() {
  const { s, clearToast, undo, go } = useStore()
  const toast = s.toast
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => clearToast(toast.id), 3800)
    return () => window.clearTimeout(id)
  }, [toast, clearToast])
  if (!toast) return null
  return (
    <div className="app-toast" role="status" key={toast.id}>
      <Icon name="check" size={17} />
      <span>{toast.text}</span>
      {toast.action && (
        <button
          onClick={() => {
            const action = toast.action!
            clearToast(toast.id)
            if (action.kind === "undo") undo(action.entryId, "toast")
            else go({ name: "chat", chat: action.chat })
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}

// ---------- L1 Lock screen ----------

function LockScreen() {
  const { s, setNav } = useStore()
  // Moderators: hold the clock for 3 seconds to open the moderator panel.
  const clockHold = useModeratorPress()
  useTick()
  const now = nowAt(s)
  const notes = (["study", "bot", "priya", "team", "mom"] as ChatId[])
    .filter((chat) => s.unread[chat] > 0)
    .map((chat) => {
      if (chat === "bot") {
        const last = [...s.bot].reverse().find((b) => b.kind !== "fwd" && b.kind !== "fwd-email")
        return last ? { chat, at: last.at, title: chatMeta.bot.name, text: itemPreview(last, s) } : null
      }
      const msgs = s.chats[chat as ThreadChat]
      const last = msgs[msgs.length - 1]
      const sender = chatMeta[chat].kind === "group" && last.from !== "me" ? `${people[last.from]?.name}: ` : ""
      return { chat, at: last.at, title: chatMeta[chat].name, text: sender + (last.text ?? "Photo") }
    })
    .filter((n): n is { chat: ChatId; at: number; title: string; text: string } => !!n && n.at >= UNLOCK_AT)
    .sort((a, b) => b.at - a.at)
  return (
    <main className="lock-screen screen-root" data-fp-screen="Lock screen">
      <div className="lock-status">
        <span>{clock(now)}</span>
        <div className="status-icons">
          <span className="signal" />
          <span className="wifi">◒</span>
          <span className="battery" />
        </div>
      </div>
      <div className="lock-heading">
        <Icon name="lock" size={17} />
        <p>Tuesday, November 10</p>
        <h1 {...clockHold} style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>
          {clock(now)}
        </h1>
      </div>
      <div className="lock-notes">
        {notes.map((note) => {
          const ago = now - note.at
          const more = s.unread[note.chat] - 1
          return (
            <button
              className="lock-notification"
              key={note.chat}
              onClick={() => setNav([{ name: "list" }, { name: "chat", chat: note.chat }])}
            >
              <span className="notification-icon">
                <Icon name="chat" size={19} />
              </span>
              <span className="notification-copy">
                <span>
                  <small>CHATS</small>
                  <time>{ago < 1 ? "now" : `${ago}m ago`}</time>
                </span>
                <b>{note.title}</b>
                <span>{note.text}</span>
                {more > 0 && <em>{more} more {more === 1 ? "message" : "messages"}</em>}
              </span>
            </button>
          )
        })}
      </div>
      <button className="lock-open" onClick={() => setNav([{ name: "list" }])}>
        <span>Tap to open</span>
        <i />
      </button>
    </main>
  )
}

// ---------- C1 Chat list ----------

type Row = { chat: ChatId; at: number; preview: ReactNode; sender?: string; photo?: boolean }

function ChatList() {
  const { s, go } = useStore()
  const [query, setQuery] = useState("")
  const [profile, setProfile] = useState(false)
  const avatarPress = useModeratorPress(() => setProfile(true))
  const botPress = useModeratorPress()
  const rows: Row[] = (["study", "priya", "team", "mom"] as ThreadChat[]).map((chat) => {
    const msgs = s.chats[chat]
    const last = msgs[msgs.length - 1]
    const isGroup = chatMeta[chat].kind === "group"
    const sender = last.from === "me" ? "You" : isGroup ? people[last.from]?.name : undefined
    return {
      chat,
      at: last.at,
      sender,
      photo: !!last.image,
      preview: last.fwd ? `Forwarded message` : last.text ?? "Photo",
    }
  })
  rows.sort((a, b) => b.at - a.at)
  const lastBot = s.bot[s.bot.length - 1]
  const botRow: Row = {
    chat: "bot",
    at: lastBot?.at ?? DAY + 8 * 60,
    sender: lastBot && ((lastBot.kind === "text" && lastBot.from === "me") || lastBot.kind === "fwd" || lastBot.kind === "fwd-email") ? "You" : undefined,
    preview: s.typing ? <em className="typing-preview">typing…</em> : lastBot ? itemPreview(lastBot, s) : "Tap Start to set me up",
  }
  const all = [botRow, ...rows]
  const q = query.trim().toLowerCase()
  const visible = q
    ? all.filter(
        (row) =>
          chatMeta[row.chat].name.toLowerCase().includes(q) ||
          (row.chat !== "bot" && s.chats[row.chat as ThreadChat].some((m) => m.text?.toLowerCase().includes(q))),
      )
    : all
  return (
    <main className="screen-root chat-list-screen" data-fp-screen="Chat list">
      <header className="list-header">
        <h1>Chats</h1>
        <button className="profile-avatar" aria-label="Your profile" {...avatarPress}>
          MC
        </button>
      </header>
      <label className="search-field">
        <Icon name="search" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search chats"
          enterKeyHint="search"
        />
        {query && (
          <button aria-label="Clear search" onClick={() => setQuery("")}>
            <Icon name="close" size={16} />
          </button>
        )}
      </label>
      <div className="list-scroll">
        {visible.map((row) => {
          const meta = chatMeta[row.chat]
          const unread = s.unread[row.chat]
          const isBot = row.chat === "bot"
          return (
            <button
              className="chat-row"
              key={row.chat}
              aria-label={`${meta.name}${unread ? `, ${unread} unread` : ""}`}
              onClick={() => go({ name: "chat", chat: row.chat })}
              {...(isBot ? { onPointerDown: botPress.onPointerDown, onPointerUp: botPress.onPointerUp, onPointerCancel: botPress.onPointerCancel, onPointerLeave: botPress.onPointerLeave } : {})}
            >
              <ChatAvatar chat={row.chat} size={54} />
              <span className="chat-row-main">
                <span className="chat-row-top">
                  <strong>
                    {meta.name}
                    {isBot && <span className="bot-badge">bot</span>}
                  </strong>
                  <time>{atShort(row.at)}</time>
                </span>
                <span className="chat-row-bottom">
                  <span className="chat-preview">
                    {row.sender && <b>{row.sender}: </b>}
                    {row.photo && (
                      <span className="preview-thumb" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                    {row.preview}
                  </span>
                  {unread > 0 ? (
                    <span className="unread-badge" aria-label={`${unread} unread`}>
                      {unread}
                    </span>
                  ) : isBot ? (
                    <span className="pinned" aria-label="Pinned">
                      <Icon name="pin" size={16} />
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          )
        })}
        {!visible.length && <p className="list-empty">No chats match “{query}”.</p>}
      </div>
      {profile && (
        <Sheet onClose={() => setProfile(false)}>
          <div className="profile-sheet">
            <span className="profile-large">MC</span>
            <h2>Maya Chen</h2>
            <p>Master's 2028</p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setProfile(false)
              go({ name: "chat", chat: "bot" })
            }}
          >
            Open Calendar Assistant
          </button>
          <button className="secondary-button" onClick={() => setProfile(false)}>
            Close
          </button>
        </Sheet>
      )}
    </main>
  )
}

// ---------- Chat header and composer ----------

function ChatHeader({
  chat,
  subtitle,
  avatarProps,
}: {
  chat: ChatId
  subtitle: ReactNode
  avatarProps?: Record<string, unknown>
}) {
  const { s, back } = useStore()
  const others = (Object.keys(s.unread) as ChatId[]).filter((c) => c !== chat).reduce((n, c) => n + s.unread[c], 0)
  return (
    <header className="chat-header">
      <button className="header-back" onClick={(e) => animateBack(e.currentTarget, back)} aria-label="Back to chats">
        <Icon name="back" size={23} />
        {others > 0 ? <span className="back-count">{others}</span> : <span>Chats</span>}
      </button>
      <div className="chat-title">
        <h1>{chatMeta[chat].name}</h1>
        <span>{subtitle}</span>
      </div>
      {avatarProps ? (
        <button className="header-avatar" aria-label="Calendar Assistant menu" {...avatarProps}>
          <ChatAvatar chat={chat} size={40} />
        </button>
      ) : (
        <span className="header-avatar">
          <ChatAvatar chat={chat} size={40} />
        </span>
      )}
    </header>
  )
}

function Composer({
  chat,
  replyTo,
  onCancelReply,
  onMenu,
  onAttach,
}: {
  chat: ChatId
  replyTo?: Msg | null
  onCancelReply?: () => void
  onMenu?: () => void
  onAttach?: () => void
}) {
  const { sendText } = useStore()
  const [text, setText] = useState("")
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (replyTo) input.current?.focus()
  }, [replyTo])
  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        sendText(chat, text, replyTo ?? undefined)
        setText("")
        onCancelReply?.()
      }}
    >
      {replyTo && (
        <div className="reply-bar">
          <Icon name="reply" size={18} />
          <span>
            <strong>Reply to {people[replyTo.from]?.name ?? "message"}</strong>
            <span>{replyTo.text ?? "Photo"}</span>
          </span>
          <button type="button" aria-label="Cancel reply" onClick={onCancelReply}>
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      <div className="composer-row">
        {onMenu && (
          <button type="button" className="menu-pill" onClick={onMenu}>
            <Icon name="menu" size={18} />
            Menu
          </button>
        )}
        <input
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          aria-label="Message"
          enterKeyHint="send"
          autoComplete="off"
        />
        {onAttach && (
          <button type="button" className="icon-button" aria-label="Share an email" onClick={onAttach}>
            <Icon name="clip" size={22} />
          </button>
        )}
        <button type="submit" className="send-button" aria-label="Send" disabled={!text.trim()}>
          <Icon name="send" size={20} />
        </button>
      </div>
    </form>
  )
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="day-sep">
      <span>{label}</span>
    </div>
  )
}

// ---------- C2/C3 Chat thread ----------

function useMessageVisibility(root: React.RefObject<HTMLDivElement | null>, chat: ChatId, count: number) {
  useEffect(() => {
    if (chat !== "study" && chat !== "priya") return
    const el = root.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const seen = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.mid!
          if (entry.isIntersecting) {
            if (!seen.has(id)) seen.set(id, performance.now())
          } else if (seen.has(id)) {
            logFootprint("message_visible", { msg: id, chat, ms: Math.round(performance.now() - seen.get(id)!) })
            seen.delete(id)
          }
        }
      },
      { root: el, threshold: 0.6 },
    )
    el.querySelectorAll("[data-mid]").forEach((node) => io.observe(node))
    return () => {
      io.disconnect()
      seen.forEach((t, id) => logFootprint("message_visible", { msg: id, chat, ms: Math.round(performance.now() - t) }))
    }
  }, [root, chat, count])
}

function BubbleBody({ m, chat, first }: { m: Msg; chat: ChatId; first: boolean }) {
  const mine = m.from === "me"
  const group = chatMeta[chat].kind === "group"
  const person = people[m.from]
  return (
    <>
      {first && !mine && group && (
        <b className="sender" style={{ color: person?.color }}>
          {person?.name}
        </b>
      )}
      {m.fwd && (
        <span className="fwd-head">
          Forwarded from <b>{m.fwd.name}</b>
        </span>
      )}
      {m.replyTo && (
        <span className="reply-quote">
          <b>{m.replyTo.name}</b>
          <span>{m.replyTo.text}</span>
        </span>
      )}
      {m.image && (
        <span className="photo" data-photo="">
          <ScreenshotArt />
        </span>
      )}
      {m.text && <span className="msg-text">{m.text}</span>}
      <span className="msg-meta">
        {fmt(m.at)}
        {mine && <Icon name="checks" size={15} />}
      </span>
    </>
  )
}

function MessageRow({
  m,
  chat,
  first,
  last,
  selecting,
  selected,
  onToggle,
  onMenu,
  onPhoto,
  lifted,
}: {
  m: Msg
  chat: ChatId
  first: boolean
  last: boolean
  lifted?: boolean
  selecting: boolean
  selected: boolean
  onToggle: () => void
  onMenu: (rect: DOMRect) => void
  onPhoto: () => void
}) {
  const bubble = useRef<HTMLDivElement>(null)
  const mine = m.from === "me"
  const group = chatMeta[chat].kind === "group"
  const press = usePress(
    (target) => {
      if (target.closest("[data-photo]")) onPhoto()
      else onMenu(bubble.current!.getBoundingClientRect())
    },
    () => onMenu(bubble.current!.getBoundingClientRect()),
  )
  return (
    <div
      className={`msg-row ${mine ? "out" : "in"} ${last ? "last" : ""} ${selecting ? "selecting" : ""} ${selected ? "selected" : ""} ${lifted ? "lifted" : ""}`}
      data-mid={m.id}
      onClick={selecting ? onToggle : undefined}
      role={selecting ? "checkbox" : undefined}
      aria-checked={selecting ? selected : undefined}
      aria-label={selecting ? `Select message from ${people[m.from]?.name ?? "you"}` : undefined}
    >
      {selecting && (
        <span className={`select-dot ${selected ? "on" : ""}`}>
          <Icon name="check" size={15} />
        </span>
      )}
      {!mine && group && (last ? <PersonAvatar id={m.from} size={34} /> : <span className="avatar-gap" />)}
      <div
        ref={bubble}
        className={`bubble ${m.image ? "has-photo" : ""}`}
        role={selecting ? undefined : "button"}
        tabIndex={selecting ? -1 : 0}
        aria-label={selecting ? undefined : `Message from ${people[m.from]?.name ?? "you"}, ${fmt(m.at)}. Tap for options.`}
        {...(selecting ? {} : press)}
      >
        <BubbleBody m={m} chat={chat} first={first} />
      </div>
    </div>
  )
}

function MessageMenu({
  m,
  chat,
  rect,
  onClose,
  onAction,
}: {
  m: Msg
  chat: ChatId
  rect: DOMRect
  onClose: () => void
  onAction: (action: "reply" | "send" | "copy" | "forward" | "select") => void
}) {
  // Overlays are positioned inside the current screen's holder (below the status bar).
  const shell = document.querySelector(".screen-holder")?.getBoundingClientRect() ?? new DOMRect(0, 0, 390, 802)
  type MenuAction = "reply" | "send" | "copy" | "forward" | "select"
  const items: [MenuAction, string, string][] = []
  items.push(["reply", "Reply", "reply"])
  items.push(["send", "Send to Calendar Assistant", "calcheck"])
  if (m.text && !m.image) items.push(["copy", "Copy", "copy"])
  items.push(["forward", "Forward", "forward"])
  items.push(["select", "Select", "select"])
  const menuH = items.length * 50 + 8
  const bubbleH = Math.min(rect.height, m.image ? 240 : 220)
  const top = Math.max(64, Math.min(rect.top - shell.top, shell.height - menuH - bubbleH - 28))
  const left = rect.left - shell.left
  const mine = m.from === "me"
  const menuW = Math.min(282, shell.width - 24)
  const menuLeft = mine ? Math.max(12, left + rect.width - menuW) : Math.min(Math.max(12, left), shell.width - menuW - 12)
  return (
    <div className="menu-layer" role="dialog" aria-label="Message actions" onClick={onClose}>
      <div className={`menu-bubble ${mine ? "out" : "in"}`} style={{ top, left, width: rect.width, maxHeight: bubbleH }}>
        <div className={`bubble ${m.image ? "has-photo" : ""}`}>
          <BubbleBody m={m} chat={chat} first />
        </div>
      </div>
      <div className="msg-menu" style={{ top: top + bubbleH + 10, left: menuLeft, width: menuW }} onClick={(e) => e.stopPropagation()}>
        {items.map(([id, label, icon]) => (
          <button key={id} className={id === "send" ? "accent" : ""} onClick={() => onAction(id)}>
            <span>{label}</span>
            <Icon name={icon} size={20} />
          </button>
        ))}
      </div>
    </div>
  )
}

function ForwardSheet({ from, msgs, onClose }: { from: ChatId; msgs: Msg[]; onClose: () => void }) {
  const { s, forward, setNav } = useStore()
  const targets: ChatId[] = (["bot", "study", "team", "priya", "mom"] as ChatId[]).filter((c) => c !== from)
  return (
    <Sheet onClose={onClose} className="forward-sheet">
      <h2>Forward {msgs.length > 1 ? `${msgs.length} messages` : "message"} to…</h2>
      <div className="forward-list">
        {targets.map((chat) => (
          <button
            key={chat}
            onClick={() => {
              forward(from, msgs, chat, "forward")
              onClose()
              setNav([{ name: "list" }, { name: "chat", chat }])
            }}
          >
            <ChatAvatar chat={chat} size={44} />
            <span>
              <strong>
                {chatMeta[chat].name}
                {chat === "bot" && <span className="bot-badge">bot</span>}
              </strong>
              <small>{chat === "bot" ? "Checks plans against your calendar" : chatMeta[chat].subtitle}</small>
            </span>
            {s.unread[chat] > 0 && <span className="unread-badge">{s.unread[chat]}</span>}
          </button>
        ))}
      </div>
    </Sheet>
  )
}

function PhotoViewer({
  msg,
  name,
  onClose,
  onForward,
  onSend,
}: {
  msg: Msg
  name: string
  onClose: () => void
  onForward?: () => void
  onSend?: () => void
}) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; scale: number } | null>(null)
  const pan = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const lastTap = useRef(0)
  const logged = useRef(false)
  const setScale = (scale: number, x = view.x, y = view.y) => {
    const clamped = Math.min(4, Math.max(1, scale))
    if (clamped > 1.3 && !logged.current) {
      logged.current = true
      logFootprint("source_open", { kind: "screenshot_zoom" })
    }
    setView(clamped === 1 ? { scale: 1, x: 0, y: 0 } : { scale: clamped, x, y })
  }
  const dist = () => {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  useEffect(() => {
    logFootprint("source_open", { kind: "screenshot_full" })
  }, [])
  return (
    <div className="photo-viewer" role="dialog" aria-label="Photo">
      <header>
        <button onClick={onClose} aria-label="Close photo">
          <Icon name="close" size={24} />
        </button>
        <span>
          <strong>{name}</strong>
          <small>{atStamp(msg.at)}</small>
        </span>
        <button onClick={() => setScale(view.scale > 1 ? 1 : 2.5)} aria-label={view.scale > 1 ? "Zoom out" : "Zoom in"}>
          <Icon name="zoom" size={22} />
        </button>
      </header>
      <div
        className="photo-stage"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
          if (pointers.current.size === 2) {
            pinch.current = { dist: dist(), scale: view.scale }
            pan.current = null
          } else if (pointers.current.size === 1) {
            pan.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
            const now = performance.now()
            if (now - lastTap.current < 300) setScale(view.scale > 1 ? 1 : 2.5)
            lastTap.current = now
          }
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) return
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
          if (pointers.current.size === 2 && pinch.current) {
            setScale((pinch.current.scale * dist()) / pinch.current.dist)
          } else if (pan.current && view.scale > 1) {
            setView((v) => ({ ...v, x: pan.current!.vx + e.clientX - pan.current!.x, y: pan.current!.vy + e.clientY - pan.current!.y }))
          }
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId)
          if (pointers.current.size < 2) pinch.current = null
          if (!pointers.current.size) pan.current = null
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId)
          pinch.current = null
          pan.current = null
        }}
        onWheel={(e) => setScale(view.scale * (e.deltaY < 0 ? 1.15 : 0.87))}
      >
        <div className="photo-frame" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          <ScreenshotArt />
        </div>
      </div>
      <p className="photo-hint">{view.scale > 1 ? "Drag to move · double-tap to zoom out" : "Pinch or double-tap to zoom"}</p>
      {(onForward || onSend) && (
        <footer>
          {onForward && (
            <button onClick={onForward}>
              <Icon name="forward" size={20} />
              Forward
            </button>
          )}
          {onSend && (
            <button className="accent" onClick={onSend}>
              <Icon name="calcheck" size={20} />
              Send to Calendar Assistant
            </button>
          )}
        </footer>
      )}
    </div>
  )
}

function ChatThread({ chat, highlight, unreadAtOpen }: { chat: ThreadChat; highlight?: string; unreadAtOpen?: number }) {
  const { s, forward, showToast } = useStore()
  const msgs = s.chats[chat]
  const meta = chatMeta[chat]
  const [menu, setMenu] = useState<{ m: Msg; rect: DOMRect } | null>(null)
  const [selected, setSelected] = useState<string[] | null>(null)
  const [forwarding, setForwarding] = useState<Msg[] | null>(null)
  const [photo, setPhoto] = useState<Msg | null>(null)
  const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const [firstUnread] = useState(() => (unreadAtOpen ? msgs[msgs.length - unreadAtOpen]?.id : undefined))
  useMessageVisibility(scroll, chat, msgs.length)

  useLayoutEffect(() => {
    const el = scroll.current
    if (!el) return
    if (highlight) {
      const target = el.querySelector(`[data-mid="${highlight}"]`) as HTMLElement | null
      if (target) {
        target.scrollIntoView({ block: "center" })
        target.classList.add("flash")
        return
      }
    }
    el.scrollTop = el.scrollHeight
  }, [highlight])

  const count = msgs.length
  const prevCount = useRef(count)
  useEffect(() => {
    const el = scroll.current
    if (el && count > prevCount.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    prevCount.current = count
  }, [count])

  const handleAction = (m: Msg, action: "reply" | "send" | "copy" | "forward" | "select") => {
    logFootprint("menu_action", { msg: m.id, action, chat })
    setMenu(null)
    if (action === "reply") setReplyTo(m)
    if (action === "send") forward(chat, [m], "bot", "shortcut")
    if (action === "copy") copyText(m.text ?? "").then(() => showToast("Copied"))
    if (action === "forward") setForwarding([m])
    if (action === "select") setSelected([m.id])
  }

  const selectedMsgs = selected ? msgs.filter((m) => selected.includes(m.id)) : []
  let lastDay = ""
  return (
    <main className="screen-root chat-screen" data-fp-screen={`Chat · ${meta.name}`}>
      {selected ? (
        <header className="chat-header select-header">
          <button className="header-back text-only" onClick={() => setSelected(null)}>
            Cancel
          </button>
          <div className="chat-title">
            <h1>{selected.length} selected</h1>
            <span>{meta.name}</span>
          </div>
          <span className="header-avatar" />
        </header>
      ) : (
        <ChatHeader chat={chat} subtitle={meta.subtitle} />
      )}
      <div className="chat-scroll chat-bg" ref={scroll}>
        <div className="chat-inner">
          {msgs.map((m, i) => {
            const day = atDayLabel(m.at)
            const showDay = day !== lastDay
            lastDay = day
            const prev = msgs[i - 1]
            const next = msgs[i + 1]
            const first = !prev || prev.from !== m.from || showDay || m.at - prev.at > 10
            const last = !next || next.from !== m.from || atDayLabel(next.at) !== day || next.at - m.at > 10
            return (
              <Fragment key={m.id}>
                {showDay && <DaySeparator label={day} />}
                {firstUnread === m.id && (
                  <div className="unread-divider">
                    <span>
                      {unreadAtOpen} unread {unreadAtOpen === 1 ? "message" : "messages"}
                    </span>
                  </div>
                )}
                <MessageRow
                  m={m}
                  chat={chat}
                  first={first}
                  last={last}
                  selecting={!!selected}
                  selected={!!selected?.includes(m.id)}
                  onToggle={() =>
                    setSelected((cur) => (cur ? (cur.includes(m.id) ? cur.filter((x) => x !== m.id) : [...cur, m.id]) : cur))
                  }
                  onMenu={(rect) => setMenu({ m, rect })}
                  onPhoto={() => setPhoto(m)}
                  lifted={menu?.m.id === m.id}
                />
              </Fragment>
            )
          })}
        </div>
      </div>
      {selected ? (
        <footer className="select-bar">
          <button
            className="select-send"
            disabled={!selected.length}
            onClick={() => {
              forward(chat, selectedMsgs, "bot", "select")
              setSelected(null)
              showToast(`Sent ${selectedMsgs.length > 1 ? `${selectedMsgs.length} messages` : "1 message"} to Calendar Assistant`, {
                label: "Open",
                kind: "open",
                chat: "bot",
              })
            }}
          >
            <Icon name="calcheck" size={19} />
            Send to Calendar Assistant
          </button>
          <button className="select-forward" disabled={!selected.length} onClick={() => setForwarding(selectedMsgs)}>
            <Icon name="forward" size={19} />
            Forward {selected.length || ""}
          </button>
        </footer>
      ) : (
        <Composer chat={chat} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
      )}
      {menu && (
        <MessageMenu m={menu.m} chat={chat} rect={menu.rect} onClose={() => setMenu(null)} onAction={(a) => handleAction(menu.m, a)} />
      )}
      {forwarding && (
        <ForwardSheet
          from={chat}
          msgs={forwarding}
          onClose={() => {
            setForwarding(null)
            setSelected(null)
          }}
        />
      )}
      {photo && (
        <PhotoViewer
          msg={photo}
          name={people[photo.from]?.name ?? "You"}
          onClose={() => setPhoto(null)}
          onForward={() => {
            setForwarding([photo])
            setPhoto(null)
          }}
          onSend={() => {
            logFootprint("menu_action", { msg: photo.id, action: "send", chat, where: "photo_viewer" })
            forward(chat, [photo], "bot", "shortcut")
            setPhoto(null)
          }}
        />
      )}
    </main>
  )
}

// ---------- Calendar Assistant chat ----------

function useActHandler(ui: { openPermissions: () => void; openWatchPick: () => void }) {
  const store = useStore()
  return (itemId: string, quick: Quick) => {
    const a = quick.act
    const s = store.s
    switch (a.t) {
      case "review":
        store.go({ name: "compare", pid: a.pid })
        return
      case "review-anyway":
        store.reopen(a.pid)
        store.go({ name: "compare", pid: a.pid })
        return
      case "compare-sources":
        store.go({ name: "sources" })
        return
      case "open-calendar":
        store.go({ name: "calendar" })
        return
      case "open-settings-find":
        store.go({ name: "settings-find" })
        return
      case "digest-review": {
        if (s.a5.status === "open" || s.a5.choice === 3 || s.a5.choice === 4) {
          store.go({ name: "sources" })
          return
        }
        const open = [...s.order].reverse().map((id) => s.proposals[id]).find((p) => p.status === "open" && !p.practice)
        if (open?.kind === "move") store.go({ name: "compare", pid: open.id })
        else if (open) store.reoffer(open.id)
        else store.go({ name: "history" })
        return
      }
      case "onb-connect":
        ui.openPermissions()
        return
      case "onb-mode":
        if (a.watch) ui.openWatchPick()
        else store.onbMode(false, [])
        return
      case "onb-done":
        store.onbDone()
        return
      default:
        store.act(itemId, quick)
    }
  }
}

function QuickReplies({ item, onAct }: { item: Extract<BotItem, { kind: "text" }>; onAct: (q: Quick) => void }) {
  if (!item.quick?.length) return null
  const answered = !!item.picked
  return (
    <div className={`quick-replies ${item.quick.length > 2 ? "stack" : ""}`}>
      {item.quick.map((q) => {
        const picked = item.picked === q.label
        const disabled = !q.nav && answered && !picked
        return (
          <button
            key={q.id}
            className={`${q.primary && !answered ? "primary" : ""} ${picked ? "picked" : ""} ${q.link ? "link" : ""}`}
            disabled={disabled || (picked && !q.nav)}
            onClick={() => onAct(q)}
          >
            {picked && !q.nav && <Icon name="check" size={16} />}
            {q.label}
          </button>
        )
      })}
    </div>
  )
}

function BotTime({ at }: { at: number }) {
  return <span className="msg-meta">{fmt(at)}</span>
}

function ChangeCard({ p, at }: { p: Proposal; at: number }) {
  const { s, go, apply, notThis } = useStore()
  const before = p.before!
  const edited = editedFields(p)
  const dayChanged = before.date !== p.after.date
  const timeChanged = before.start !== p.after.start || before.end !== p.after.end
  const roomChanged = before.location !== p.after.location
  const undone = entryUndone(s, p)
  const replacement = p.status === "replaced" ? s.order.map((id) => s.proposals[id]).find((x) => x.study && x.status !== "replaced" && s.order.indexOf(x.id) > s.order.indexOf(p.id)) : undefined
  return (
    <div className={`bot-card change-card ${p.status !== "open" ? "settled" : ""}`}>
      <div className="card-head">
        <span className={`card-icon c-${p.color}`}>
          <Icon name="calendar" size={20} />
        </span>
        <span>
          <strong>{p.title}</strong>
          <small>{p.practice ? "Practice event" : "Google Calendar"}</small>
        </span>
      </div>
      <SourceChip label={p.chip.label} tone={p.chip.tone} />
      <div className="change-lines">
        <p>
          <span className="was">
            {weekday(before.date)} {fmt(before.start)}
          </span>
          <Icon name="arrow" size={16} className="change-arrow" />
          <mark className={dayChanged || timeChanged ? "" : "same"}>
            {weekday(p.after.date)} {fmtRange(p.after.start, p.after.end)}
          </mark>
          {p.sameLength && !edited.has("time") && <span className="aside"> · same length</span>}
          {edited.has("time") && <span className="aside"> · edited by you</span>}
        </p>
        <p>
          Room:{" "}
          {roomChanged ? (
            <>
              <mark>{p.after.location}</mark>
              {edited.has("room") && <span className="aside"> · edited by you</span>}
            </>
          ) : p.roomMentioned ? (
            <span>no change ({p.after.location})</span>
          ) : (
            <span>not mentioned (keeping {shortRoom(p.after.location)})</span>
          )}
        </p>
      </div>
      {p.status === "open" ? (
        <div className="card-actions">
          <button className="primary-button" onClick={() => go({ name: "compare", pid: p.id })}>
            Review change
          </button>
          <div className="card-actions-row">
            <button className="secondary-button" onClick={() => apply(p.id, "card")}>
              Update now
            </button>
            <button className="secondary-button" onClick={() => notThis(p.id)}>
              Not this event
            </button>
          </div>
        </div>
      ) : (
        <p className={`card-status status-${p.status}`}>
          <Icon name={p.status === "applied" && !undone ? "check" : p.status === "replaced" ? "refresh" : "info"} size={16} />
          {p.status === "applied" && (undone ? "Updated, then undone" : "Updated")}
          {p.status === "replaced" && (replacement ? "Replaced by the newer suggestion below" : "Replaced by a newer suggestion")}
          {p.status === "not-this" && "You said this isn't the right event"}
          {p.status === "declined" && "You kept your calendar as it was"}
        </p>
      )}
      <BotTime at={at} />
    </div>
  )
}

function DoneMessage({ item }: { item: Extract<BotItem, { kind: "done" }> }) {
  const { s, go, undo } = useStore()
  const entry = s.history.find((e) => e.id === item.entryId)
  const can = !!entry && canUndo(s, entry)
  const eventId = entry?.before ? Object.keys(entry.before)[0] : undefined
  return (
    <div className="bot-bubble done-bubble">
      <p>
        <Rich text={item.text} />
      </p>
      <div className="done-actions">
        <button
          className="secondary-button"
          onClick={() => go({ name: "calendar", focus: eventId })}
        >
          <Icon name="calendar" size={17} />
          Open calendar
        </button>
        <button className="secondary-button undo" disabled={!can} onClick={() => undo(item.entryId, "chat")}>
          <Icon name={entry?.undone ? "check" : "undo"} size={17} />
          {entry?.undone ? "Undone" : "Undo"}
        </button>
      </div>
      {!entry && <p className="card-note">History was deleted, so this can't be undone.</p>}
      {entry && !entry.undone && !can && <p className="card-note">A newer change replaced this one. Undo that first.</p>}
      <BotTime at={item.at} />
    </div>
  )
}

function DisagreeCard({ at }: { at: number }) {
  const { s, go } = useStore()
  const choiceLabels = ["", "Use Mon Nov 16, 9:00 am", "Keep Fri Nov 13 (course site)", "Keep both until confirmed", "Draft a question to the TA"]
  return (
    <div className="bot-card disagree-card">
      <p className="warn-head">
        <Icon name="warning" size={19} />
        <strong>Two sources disagree about Assignment 5.</strong>
      </p>
      <div className="mini-sources">
        <div>
          <SourceChip label="Course site" tone="bcourses" />
          <strong>Fri Nov 13, 11:59 pm</strong>
          <small>Course site · updated Oct 30</small>
        </div>
        <div>
          <SourceChip label="Screenshot from Priya" tone="screenshot" />
          <strong>Mon Nov 16, 9:00 am</strong>
          <small>Alex Rivera (TA) · Nov 9 · newer</small>
        </div>
      </div>
      {s.a5.status === "resolved" ? (
        <>
          <p className="card-status status-applied">
            <Icon name="check" size={16} />
            You chose: {choiceLabels[s.a5.choice ?? 0]}
          </p>
          <button className="secondary-button" onClick={() => go({ name: "sources" })}>
            See sources
          </button>
        </>
      ) : (
        <button className="primary-button" onClick={() => go({ name: "sources" })}>
          Compare sources and choose
        </button>
      )}
      <BotTime at={at} />
    </div>
  )
}

function DraftCard({ text, at }: { text: string; at: number }) {
  const { showToast } = useStore()
  return (
    <div className="bot-card draft-card">
      <span className="card-kicker">DRAFT · NOT SENT</span>
      <strong>To Alex Rivera (TA)</strong>
      <blockquote>{text}</blockquote>
      <button
        className="secondary-button"
        onClick={() =>
          copyText(text).then((ok) => showToast(ok ? "Draft copied" : "Couldn't copy. Select the text instead."))
        }
      >
        <Icon name="copy" size={17} />
        Copy text
      </button>
      <BotTime at={at} />
    </div>
  )
}

function FwdBubble({ item, onPhoto }: { item: Extract<BotItem, { kind: "fwd" }>; onPhoto: () => void }) {
  const m = item.msg
  const name = item.chat === "sample" ? "Sample chat" : people[m.from]?.name ?? "You"
  return (
    <div className="msg-row out">
      <div className={`bubble fwd-bubble ${m.image ? "has-photo" : ""}`}>
        <span className="fwd-head">
          Forwarded from <b>{name}</b> · {item.chat === "sample" ? "practice" : atStamp(m.at)}
        </span>
        {m.image && (
          <button className="photo" onClick={onPhoto} aria-label="Open forwarded photo">
            <ScreenshotArt />
          </button>
        )}
        {m.text && <span className="msg-text">{m.text}</span>}
        <span className="msg-meta">
          {fmt(item.at)}
          <Icon name="checks" size={15} />
        </span>
      </div>
    </div>
  )
}

function EmailSheet({ id, onClose, onForward }: { id: Email["id"]; onClose: () => void; onForward?: () => void }) {
  const email = emails[id]
  return (
    <Sheet onClose={onClose}>
      <span className="sheet-kicker">EMAIL</span>
      <h2>{email.subject}</h2>
      <p className="email-from">
        <strong>{email.from}</strong>
        {email.org ? ` · ${email.org}` : ""}
        <br />
        <span>
          {email.address} · {email.time}
        </span>
      </p>
      <div className="email-body">
        {email.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {onForward ? (
        <button className="primary-button" onClick={onForward}>
          Forward to Calendar Assistant
        </button>
      ) : (
        <button className="secondary-button" onClick={onClose}>
          Close
        </button>
      )}
    </Sheet>
  )
}

function AttachSheet({ onClose, onPick }: { onClose: () => void; onPick: (id: Email["id"]) => void }) {
  return (
    <Sheet onClose={onClose}>
      <h2>Share with Calendar Assistant</h2>
      <p className="sheet-detail">Pick an email to forward. To send a chat message or photo, long-press it in that chat.</p>
      <span className="sheet-section-label">FROM MAIL</span>
      <div className="pick-list">
        {(Object.keys(emails) as Email["id"][]).map((id) => {
          const email = emails[id]
          return (
            <button key={id} onClick={() => onPick(id)}>
              <span className="pick-icon tone-email">
                <Icon name="mail" size={20} />
              </span>
              <span>
                <strong>{email.from}</strong>
                <span>{email.subject}</span>
                <small>{email.time}</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

function BotMenuSheet({ onClose }: { onClose: () => void }) {
  const { go, botHelp } = useStore()
  const rows: [string, string, string, () => void][] = [
    ["calendar", "Calendar", "Your week, with what I changed", () => go({ name: "calendar" })],
    ["history", "History", "Every change, with Undo", () => go({ name: "history" })],
    ["settings", "Settings", "What I can see, confirmations, privacy", () => go({ name: "settings" })],
    ["info", "Help", "What I can do", () => botHelp()],
  ]
  return (
    <Sheet onClose={onClose}>
      <h2>Menu</h2>
      <div className="pick-list menu-list">
        {rows.map(([icon, title, detail, run]) => (
          <button
            key={title}
            onClick={() => {
              onClose()
              run()
            }}
          >
            <span className="pick-icon">
              <Icon name={icon} size={20} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        ))}
      </div>
    </Sheet>
  )
}

function PermissionSheet({ step, onAllow, onClose }: { step: 1 | 2; onAllow: () => void; onClose: () => void }) {
  const google = step === 1
  return (
    <Sheet onClose={onClose}>
      <div className={`sheet-icon ${google ? "tone-calendar" : "tone-bcourses"}`}>
        <Icon name={google ? "calendar" : "book"} size={24} />
      </div>
      <span className="sheet-kicker">STEP {step} OF 2</span>
      <h2>Connect {google ? "Google Calendar" : "Course site"}</h2>
      <p className="permission-intro">Calendar Assistant will be able to:</p>
      <div className="permission-read">
        <Icon name="check" size={16} />
        {google ? "See your events, and change them after you confirm" : "See your courses, assignments and due dates (read-only)"}
      </div>
      <div className="permission-never">
        <strong>It will never:</strong>
        {google ? (
          <>
            <span>Change or delete an event without your OK</span>
            <span>Share your calendar with anyone</span>
          </>
        ) : (
          <>
            <span>Submit or change anything on the course site</span>
            <span>See your grades</span>
          </>
        )}
      </div>
      <button className="primary-button" onClick={onAllow}>
        Allow
      </button>
      <button className="secondary-button" onClick={onClose}>
        Not now
      </button>
    </Sheet>
  )
}

function WatchPickSheet({ onDone, onClose }: { onDone: (chats: ChatId[]) => void; onClose: () => void }) {
  const [picked, setPicked] = useState<ChatId[]>([])
  const options: ChatId[] = ["study", "team", "priya", "mom"]
  return (
    <Sheet onClose={onClose}>
      <h2>Which chats can I read?</h2>
      <p className="sheet-detail">I'll read new messages in the chats you pick and tell you about schedule changes. All are off until you turn them on.</p>
      <div className="check-list">
        {options.map((chat) => {
          const on = picked.includes(chat)
          return (
            <button
              key={chat}
              role="checkbox"
              aria-checked={on}
              className={on ? "on" : ""}
              onClick={() => setPicked((cur) => (on ? cur.filter((c) => c !== chat) : [...cur, chat]))}
            >
              <ChatAvatar chat={chat} size={36} />
              <strong>{chatMeta[chat].name}</strong>
              <span className="check-box">
                <Icon name="check" size={15} />
              </span>
            </button>
          )
        })}
      </div>
      <p className="never-line">
        <Icon name="lock" size={15} />I never read your personal chats unless you pick them.
      </p>
      <button className="primary-button" onClick={() => onDone(picked)}>
        {picked.length ? `Watch ${picked.length} ${picked.length === 1 ? "chat" : "chats"}` : "Continue without chats"}
      </button>
    </Sheet>
  )
}

function BotChat() {
  const store = useStore()
  const { s, forwardEmail, forwardSample, onbStart, onbConnected, onbMode } = store
  const [menuOpen, setMenuOpen] = useState(false)
  const [attach, setAttach] = useState(false)
  const [email, setEmail] = useState<{ id: Email["id"]; forward: boolean } | null>(null)
  const [perm, setPerm] = useState<0 | 1 | 2>(0)
  const [watchPick, setWatchPick] = useState(false)
  const [photo, setPhoto] = useState<Msg | null>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const onAct = useActHandler({ openPermissions: () => setPerm(1), openWatchPick: () => setWatchPick(true) })
  const avatarPress = useModeratorPress(() => setMenuOpen(true))

  useLayoutEffect(() => {
    const el = scroll.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])
  const lastId = s.bot[s.bot.length - 1]?.id
  const first = useRef(true)
  useEffect(() => {
    const el = scroll.current
    if (!el) return
    if (first.current) {
      first.current = false
      return
    }
    // Wait a frame so quick replies and cards are laid out before scrolling.
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }))
  }, [lastId, s.typing])

  const showStart = s.onboarding.active && s.onboarding.step === 0
  let lastDay = ""
  return (
    <main className="screen-root chat-screen bot-screen" data-fp-screen="Chat · Calendar Assistant">
      <ChatHeader chat="bot" subtitle={s.typing ? <em className="typing-preview">typing…</em> : "bot"} avatarProps={avatarPress} />
      <div className="chat-scroll chat-bg" ref={scroll}>
        <div className="chat-inner">
          {showStart && !s.bot.length && (
            <div className="bot-intro">
              <ChatAvatar chat="bot" size={64} />
              <strong>Calendar Assistant</strong>
              <p>Send me any message, email or screenshot about a plan. I'll compare it with your calendar and ask before changing anything.</p>
            </div>
          )}
          {s.bot.map((item) => {
            const day = atDayLabel(item.at)
            const showDay = day !== lastDay
            lastDay = day
            return (
              <Fragment key={item.id}>
                {showDay && <DaySeparator label={day} />}
                <BotItemView item={item} onAct={(q) => onAct(item.id, q)} onPhoto={setPhoto} onEmail={(id) => setEmail({ id, forward: false })} onSample={forwardSample} />
              </Fragment>
            )
          })}
          {s.typing > 0 && (
            <div className="bot-row">
              <div className="bot-bubble typing-bubble" aria-label="Calendar Assistant is typing">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
        </div>
      </div>
      {showStart ? (
        <footer className="start-bar">
          <button className="primary-button" onClick={onbStart}>
            Start
          </button>
        </footer>
      ) : (
        <Composer chat="bot" onMenu={() => setMenuOpen(true)} onAttach={() => setAttach(true)} />
      )}
      {menuOpen && <BotMenuSheet onClose={() => setMenuOpen(false)} />}
      {attach && (
        <AttachSheet
          onClose={() => setAttach(false)}
          onPick={(id) => {
            setAttach(false)
            setEmail({ id, forward: true })
          }}
        />
      )}
      {email && (
        <EmailSheet
          id={email.id}
          onClose={() => setEmail(null)}
          onForward={
            email.forward
              ? () => {
                  forwardEmail(email.id)
                  setEmail(null)
                }
              : undefined
          }
        />
      )}
      {perm > 0 && (
        <PermissionSheet
          key={perm}
          step={perm as 1 | 2}
          onClose={() => setPerm(0)}
          onAllow={() => {
            if (perm === 1) setPerm(2)
            else {
              setPerm(0)
              onbConnected()
            }
          }}
        />
      )}
      {watchPick && (
        <WatchPickSheet
          onClose={() => setWatchPick(false)}
          onDone={(chats) => {
            setWatchPick(false)
            onbMode(true, chats)
          }}
        />
      )}
      {photo && <PhotoViewer msg={photo} name="Priya" onClose={() => setPhoto(null)} />}
    </main>
  )
}

const viewedCards = new Set<string>()

function BotItemView({
  item,
  onAct,
  onPhoto,
  onEmail,
  onSample,
}: {
  item: BotItem
  onAct: (q: Quick) => void
  onPhoto: (m: Msg) => void
  onEmail: (id: Email["id"]) => void
  onSample: () => void
}) {
  const { s } = useStore()
  // bot_card_view: logged once, the first time a card or question is shown in the chat.
  useEffect(() => {
    if (viewedCards.has(item.id)) return
    let data: Record<string, string> | null = null
    if (item.kind === "card") data = { card: s.proposals[item.pid]?.practice ? "practice" : "change", basis: s.proposals[item.pid]?.basis ?? "" }
    else if (item.kind === "disagree") data = { card: "disagree" }
    else if (item.kind === "text" && item.tag) data = { card: item.tag }
    if (!data) return
    viewedCards.add(item.id)
    logFootprint("bot_card_view", data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])
  switch (item.kind) {
    case "text":
      if (item.from === "me") {
        return (
          <div className="msg-row out">
            <div className="bubble">
              <span className="msg-text">{item.text}</span>
              <span className="msg-meta">
                {fmt(item.at)}
                <Icon name="checks" size={15} />
              </span>
            </div>
          </div>
        )
      }
      return (
        <div className="bot-row">
          <div className="bot-bubble">
            <p>
              <Rich text={item.text} />
            </p>
            <BotTime at={item.at} />
          </div>
          <QuickReplies item={item} onAct={onAct} />
        </div>
      )
    case "fwd":
      return <FwdBubble item={item} onPhoto={() => onPhoto(item.msg)} />
    case "fwd-email": {
      const email = emails[item.email]
      return (
        <div className="msg-row out">
          <button className="bubble fwd-bubble email-bubble" onClick={() => onEmail(item.email)}>
            <span className="fwd-head">
              Forwarded email from <b>{email.from}</b>
            </span>
            <strong>{email.subject}</strong>
            <span className="msg-text">{email.preview}</span>
            <span className="msg-meta">
              {fmt(item.at)}
              <Icon name="checks" size={15} />
            </span>
          </button>
        </div>
      )
    }
    case "card": {
      const p = s.proposals[item.pid]
      return p ? (
        <div className="bot-row wide">
          <ChangeCard p={p} at={item.at} />
        </div>
      ) : null
    }
    case "done":
      return (
        <div className="bot-row">
          <DoneMessage item={item} />
        </div>
      )
    case "reading":
      return (
        <div className="bot-row">
          <div className="bot-bubble reading-bubble">
            <p>Reading the image…</p>
            <div className="skeleton-lines">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )
    case "disagree":
      return (
        <div className="bot-row wide">
          <DisagreeCard at={item.at} />
        </div>
      )
    case "draft":
      return (
        <div className="bot-row wide">
          <DraftCard text={item.text} at={item.at} />
        </div>
      )
    case "sample":
      return (
        <div className="bot-row wide">
          <div className="bot-card sample-card">
            <span className="card-kicker">SAMPLE MESSAGE</span>
            <div className="sample-quote">
              <b>Sample chat</b>
              <span>{SAMPLE_MSG.text}</span>
            </div>
            <button className="primary-button" disabled={item.used} onClick={onSample}>
              <Icon name={item.used ? "check" : "forward"} size={17} />
              {item.used ? "Forwarded" : "Forward to Calendar Assistant"}
            </button>
          </div>
        </div>
      )
  }
}

// ---------- R1 Compare and R2 Edit ----------

function QuoteCard({ quote, onView }: { quote: Quote; onView?: () => void }) {
  const person = Object.values(people).find((p) => p.name === quote.who)
  return (
    <div className="quote-card">
      <div className="quote-top">
        {quote.kind === "chat" && person ? (
          <Avatar colors={person.avatar} text={person.name[0]} size={28} />
        ) : (
          <span className={`pick-icon small ${toneClass[quote.kind]}`}>
            <Icon name={quote.kind === "screenshot" ? "image" : quote.kind === "email" ? "mail" : quote.kind === "bcourses" ? "book" : "chat"} size={15} />
          </span>
        )}
        <strong style={quote.kind === "chat" && person ? { color: person.color } : undefined}>{quote.who}</strong>
        <time>{quote.time}</time>
      </div>
      <blockquote>“{quote.text}”</blockquote>
      {onView && (
        <button className="link-button" onClick={onView}>
          {quote.kind === "chat" ? "View in chat" : quote.kind === "screenshot" ? "View screenshot" : "View"}
          <Icon name="chevron" size={16} />
        </button>
      )}
    </div>
  )
}

function conflictInfo(s: State, p: Proposal) {
  if (p.practice) return { ok: true, lines: ["Practice event, so I didn't check your calendar."] }
  const clash = overlaps(s, p.after, p.eventId)
  if (clash.length) {
    return { ok: false, lines: clash.map((c) => `Overlaps ${c.title}, ${fmtRange(c.start, c.end)}.`) }
  }
  const sameDay = s.events.filter((e) => !e.deleted && e.date === p.after.date && e.id !== p.eventId)
  const events = sameDay.filter((e) => e.kind === "event").sort((a, b) => a.start - b.start)
  const next = events.find((e) => e.start >= p.after.end) ?? [...events].reverse().find((e) => e.end <= p.after.start)
  const lines = ["No overlap."]
  if (next) lines.push(`Your ${next.title} is at ${fmt(next.start)} that day.`)
  sameDay
    .filter((e) => e.kind === "deadline")
    .forEach((d) => lines.push(`${d.title} is due ${weekday(d.date)} ${fmt(d.start)} (${d.calendar === "Course site" ? "the course site" : "your calendar"}).`))
  return { ok: true, lines }
}

function CompareScreen({ pid }: { pid: string }) {
  const { s, go, back, apply, reopen } = useStore()
  const p = s.proposals[pid]
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    const t0 = performance.now()
    return () => logFootprint("compare_dwell", { pid, seconds: Math.round((performance.now() - t0) / 1000) })
  }, [pid])
  if (!p || !p.before) {
    return (
      <main className="screen-root flow-screen">
        <FlowHeader title="Review change" />
        <div className="flow-scroll padded">
          <p className="empty-note">This change is no longer available.</p>
        </div>
      </main>
    )
  }
  const before = p.before
  const edited = editedFields(p)
  const rows: [string, string, string, boolean, boolean][] = [
    ["Day", dayLabel(before.date), dayLabel(p.after.date), before.date !== p.after.date, edited.has("day")],
    ["Time", fmtRange(before.start, before.end), fmtRange(p.after.start, p.after.end), before.start !== p.after.start || before.end !== p.after.end, edited.has("time")],
    ["Duration", durationLabel(before.end - before.start), durationLabel(p.after.end - p.after.start), before.end - before.start !== p.after.end - p.after.start, false],
    ["Room", before.location, p.after.location, before.location !== p.after.location, edited.has("room")],
  ]
  const notes = [...p.notes.filter((n) => !edited.has(n.field)), ...editNotes(p).map((n) => ({ ...n, edit: true }))]
  const conflict = conflictInfo(s, p)
  const open = p.status === "open"
  const newer = p.status === "replaced" ? [...s.order].reverse().map((id) => s.proposals[id]).find((x) => x.study && x.status !== "replaced") : undefined
  return (
    <main className="screen-root flow-screen compare-screen" data-fp-screen="Compare change">
      <FlowHeader title="Review change" />
      <div className="flow-scroll compare-scroll">
        {!open && (
          <div className={`state-banner state-${p.status}`}>
            <Icon name={p.status === "applied" ? "check" : "info"} size={18} />
            <span>
              {p.status === "applied" && (entryUndone(s, p) ? "This change was made, then undone." : "This change is on your calendar.")}
              {p.status === "replaced" && "A newer suggestion replaced this one."}
              {p.status === "not-this" && "You said this isn't the right event."}
              {p.status === "declined" && "You chose to keep your calendar as it was."}
            </span>
            {p.status === "replaced" && newer && (
              <button onClick={() => go({ name: "compare", pid: newer.id })}>See newer</button>
            )}
            {(p.status === "not-this" || p.status === "declined") && <button onClick={() => reopen(p.id)}>Review anyway</button>}
          </div>
        )}
        <div className="compare-title">
          <span className={`card-icon c-${p.color}`}>
            <Icon name="calendar" size={20} />
          </span>
          <div>
            <h2>{p.title}</h2>
            <p>{p.practice ? "Practice event" : `Google Calendar${p.eventId === "study" ? " · organizer Hana" : ""}`}</p>
          </div>
        </div>
        <section className="compare-table" aria-label="Current and new values">
          <div className="compare-head">
            <span />
            <span>Current</span>
            <span />
            <span>New</span>
          </div>
          {rows.map(([label, cur, next, changed, byYou]) => (
            <div className={`compare-row ${changed ? "changed" : ""}`} key={label}>
              <span className="compare-label">{label}</span>
              <span className="compare-cur">{cur}</span>
              <span className="compare-arrow">{changed ? <Icon name="arrow" size={15} /> : null}</span>
              <span className="compare-new">
                <span>{next}</span>
                {byYou && <EditedChip />}
              </span>
            </div>
          ))}
          <p className="compare-legend">
            <span className="legend-swatch" /> Changed
          </p>
        </section>

        <section className="detail-section">
          <h3>What I assumed</h3>
          <ul className="notes-list">
            {notes.map((n, i) => (
              <li key={i} className={"edit" in n ? "edit-note" : ""}>
                <Icon name={"edit" in n ? "edit" : "info"} size={17} />
                <span>{n.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-section">
          <h3>Source</h3>
          {p.sources.map((quote, i) => (
            <QuoteCard
              key={i}
              quote={quote}
              onView={
                quote.chat && quote.msgId
                  ? () => {
                      logFootprint("source_open", { kind: "view_in_chat", msg: quote.msgId! })
                      go({ name: "chat", chat: quote.chat!, highlight: quote.msgId })
                    }
                  : undefined
              }
            />
          ))}
        </section>

        <section className="detail-section">
          <h3>Conflict check</h3>
          <div className={`conflict-box ${conflict.ok ? "ok" : "warn"}`}>
            <Icon name={conflict.ok ? "check" : "warning"} size={18} />
            <p>
              {conflict.lines.map((line, i) => (i === 0 ? <strong key={i}>{line} </strong> : <span key={i}>{line} </span>))}
            </p>
          </div>
        </section>
        <p className="control-note">
          <Icon name="lock" size={15} />
          Nothing changes until you tap Update event.
        </p>
      </div>
      <footer className="sticky-actions">
        <button className="secondary-button" disabled={!open} onClick={() => setEditing(true)}>
          <Icon name="edit" size={17} />
          Edit
        </button>
        <button
          className="primary-button"
          disabled={!open}
          onClick={(e) => {
            apply(p.id, "review")
            animateBack(e.currentTarget, back)
          }}
        >
          Update event
        </button>
      </footer>
      {editing && <EditSheet p={p} onClose={() => setEditing(false)} />}
    </main>
  )
}

const TIMES = Array.from({ length: (24 * 60 - 6 * 60) / 15 }, (_, i) => 6 * 60 + i * 15)
const DATES = Array.from({ length: 14 }, (_, i) => 9 + i)

function EditSheet({ p, onClose }: { p: Proposal; onClose: () => void }) {
  const { editProposal } = useStore()
  const [slot, setSlot] = useState<Slot>({ ...p.after })
  const length = slot.end - slot.start
  const setStart = (start: number) => setSlot((cur) => ({ ...cur, start, end: Math.min(start + (cur.end - cur.start), 24 * 60 - 15) }))
  const newer = p.newer
  return (
    <Sheet onClose={onClose} className="edit-sheet">
      <span className="sheet-kicker">EDIT CHANGE</span>
      <h2>{p.title}</h2>
      <label className="edit-field">
        <span>Day</span>
        <select value={slot.date} onChange={(e) => setSlot({ ...slot, date: Number(e.target.value) })}>
          {DATES.map((d) => (
            <option key={d} value={d}>
              {weekdayLong(d)}, Nov {d}
            </option>
          ))}
        </select>
      </label>
      <div className="edit-two">
        <label className="edit-field">
          <span>Starts</span>
          <select value={slot.start} onChange={(e) => setStart(Number(e.target.value))}>
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {fmt(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="edit-field">
          <span>Ends</span>
          <select value={slot.end} onChange={(e) => setSlot({ ...slot, end: Number(e.target.value) })}>
            {TIMES.filter((t) => t > slot.start).map((t) => (
              <option key={t} value={t}>
                {fmt(t)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {newer && (newer.start !== slot.start || newer.end !== slot.end) && (
        <button className="suggestion-chip" onClick={() => setSlot({ ...slot, start: newer.start, end: newer.end })}>
          <Icon name="sparkle" size={15} />
          Use {fmtRange(newer.start, newer.end)} · from {newer.label}
        </button>
      )}
      <label className="edit-field">
        <span>Room</span>
        <input value={slot.location} onChange={(e) => setSlot({ ...slot, location: e.target.value })} aria-label="Room" />
      </label>
      {newer && newer.location !== slot.location && (
        <button className="suggestion-chip" onClick={() => setSlot({ ...slot, location: newer.location })}>
          <Icon name="sparkle" size={15} />
          Use {newer.location} · from {newer.label}
        </button>
      )}
      <p className="edit-summary">
        {dayLabel(slot.date)}, {fmtRange(slot.start, slot.end)} · {durationLabel(length)}
      </p>
      <button
        className="primary-button"
        disabled={!slot.location.trim()}
        onClick={() => {
          editProposal(p.id, { ...slot, location: slot.location.trim() })
          onClose()
        }}
      >
        Save
      </button>
      <button className="secondary-button" onClick={onClose}>
        Cancel
      </button>
    </Sheet>
  )
}

// ---------- S2 Sources disagree (full screen) ----------

const SOURCE_CHOICES = [
  "Use Mon Nov 16, 9:00 am, and remind me to check the course site on Thursday.",
  "Keep Fri Nov 13 (course site).",
  "Keep both on my calendar until it's confirmed.",
  "Draft a question to the TA.",
]

function SourcesScreen() {
  const { s, back, chooseSources, undo } = useStore()
  const [choice, setChoice] = useState<number | null>(null)
  const [shot, setShot] = useState(false)
  const [bcourses, setBcourses] = useState(false)
  const opened = useRef(performance.now())
  const resolved = s.a5.status === "resolved"
  const entry = s.history.find((e) => e.id === s.a5.entryId)
  const picked = resolved ? s.a5.choice! : choice
  return (
    <main className="screen-root flow-screen sources-screen" data-fp-screen="Sources disagree">
      <FlowHeader title="Compare sources" />
      <div className="flow-scroll compare-scroll">
        <div className="warn-title">
          <Icon name="warning" size={22} />
          <h2>Two sources disagree about Assignment 5.</h2>
        </div>
        <section className="sources-table" aria-label="Sources side by side">
          <div className="sources-col">
            <span className="col-kicker">SOURCE A</span>
            <SourceChip label="Course site" tone="bcourses" />
            <dl>
              <dt>Due</dt>
              <dd>
                <strong>Fri Nov 13, 11:59 pm</strong>
              </dd>
              <dt>From</dt>
              <dd>Course site</dd>
              <dt>Last updated</dt>
              <dd>Oct 30</dd>
            </dl>
            <button
              className="link-button"
              onClick={() => {
                logFootprint("source_open", { kind: "bcourses" })
                setBcourses(true)
              }}
            >
              Open the course site
              <Icon name="chevron" size={16} />
            </button>
          </div>
          <div className="sources-col newer">
            <span className="col-kicker">SOURCE B</span>
            <SourceChip label="Screenshot from Priya" tone="screenshot" />
            <dl>
              <dt>Due</dt>
              <dd>
                <strong>Mon Nov 16, 9:00 am</strong>
              </dd>
              <dt>From</dt>
              <dd>Alex Rivera (TA), posted Nov 9</dd>
              <dt>Last updated</dt>
              <dd>
                Nov 9 <span className="newer-tag">newer</span>
              </dd>
            </dl>
            <button className="link-button" onClick={() => setShot(true)}>
              View screenshot
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </section>
        <p className="sources-note">
          <Icon name="info" size={17} />
          The screenshot is newer and comes from the TA. The course site may not be updated yet.
        </p>
        <section className="detail-section">
          <h3>What should your calendar show?</h3>
          <div className="choice-list" role="radiogroup" aria-label="Choose what to do">
            {SOURCE_CHOICES.map((label, i) => {
              const n = i + 1
              const selected = picked === n
              return (
                <button
                  key={n}
                  role="radio"
                  aria-checked={selected}
                  className={selected ? "selected" : ""}
                  disabled={resolved}
                  onClick={() => setChoice(n)}
                >
                  <span className="radio" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </section>
        {resolved && (
          <div className="state-banner state-applied">
            <Icon name="check" size={18} />
            <span>{entry?.undone ? "Undone." : "Done. You can find this in History."}</span>
          </div>
        )}
      </div>
      <footer className="sticky-actions single">
        {resolved ? (
          <>
            <button
              className="secondary-button"
              disabled={!entry || !canUndo(s, entry)}
              onClick={() => entry && undo(entry.id, "sources")}
            >
              <Icon name="undo" size={17} />
              Undo this choice
            </button>
            <button className="primary-button" onClick={(e) => animateBack(e.currentTarget, back)}>
              Done
            </button>
          </>
        ) : (
          <button
            className="primary-button"
            disabled={!choice}
            onClick={(e) => {
              if (!choice) return
              chooseSources(choice, Math.round((performance.now() - opened.current) / 1000))
              animateBack(e.currentTarget, back)
            }}
          >
            Confirm
          </button>
        )}
      </footer>
      {shot && (
        <PhotoViewer
          msg={{ id: "p152", from: "priya", at: DAY + 13 * 60 + 52, image: "a5" }}
          name="Priya"
          onClose={() => setShot(false)}
        />
      )}
      {bcourses && (
        <Sheet onClose={() => setBcourses(false)}>
          <div className="sheet-icon tone-bcourses">
            <Icon name="book" size={24} />
          </div>
          <span className="sheet-kicker">COURSE SITE · STATS 203</span>
          <h2>Assignment 5</h2>
          <div className="fact-rows">
            <p>
              <span>Due</span>
              <strong>Fri Nov 13, 11:59 pm</strong>
            </p>
            <p>
              <span>Points</span>
              <strong>100</strong>
            </p>
            <p>
              <span>Last updated</span>
              <strong>Oct 30</strong>
            </p>
          </div>
          <p className="sheet-detail">This is what the course site shows right now. Announcements from the TA can be newer.</p>
          <button className="secondary-button" onClick={() => setBcourses(false)}>
            Close
          </button>
        </Sheet>
      )}
    </main>
  )
}

// ---------- K1 Calendar and K2 Event detail ----------

function CalendarScreen({ week: initialWeek, focus }: { week?: 0 | 1; focus?: string }) {
  const { s, go, back } = useStore()
  const focusEvent = focus ? s.events.find((e) => e.id === focus) : undefined
  const [week, setWeek] = useState<0 | 1>(initialWeek ?? (focusEvent && focusEvent.date >= 16 ? 1 : 0))
  const scroll = useRef<HTMLDivElement>(null)
  const days = Array.from({ length: 7 }, (_, i) => 9 + week * 7 + i)
  const scrollToDay = (date: number, smooth = true) => {
    const el = scroll.current?.querySelector(`[data-day="${date}"]`) as HTMLElement | null
    if (el && scroll.current) scroll.current.scrollTo({ top: el.offsetTop - 4, behavior: smooth ? "smooth" : "auto" })
  }
  useLayoutEffect(() => {
    const target = focusEvent?.date ?? (week === 0 ? TODAY : days[0])
    if (focusEvent || week === 0) scrollToDay(target, false)
    else if (scroll.current) scroll.current.scrollTop = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])
  return (
    <main className="screen-root flow-screen calendar-screen" data-fp-screen="Calendar">
      <FlowHeader
        title="Calendar"
        closeIcon
        onBack={back}
        right={
          <button
            className="header-text-button"
            onClick={() => {
              if (week !== 0) setWeek(0)
              else scrollToDay(TODAY)
            }}
          >
            Today
          </button>
        }
      />
      <div className="week-nav">
        <button aria-label="Previous week" disabled={week === 0} onClick={() => setWeek(0)}>
          <Icon name="back" />
        </button>
        <div>
          <strong>November {week === 0 ? "9–15" : "16–22"}</strong>
          <span>2026</span>
        </div>
        <button aria-label="Next week" disabled={week === 1} onClick={() => setWeek(1)}>
          <Icon name="chevron" />
        </button>
      </div>
      <div className="day-strip">
        {days.map((d) => {
          const changed = s.events.some((e) => !e.deleted && e.date === d && e.assistant)
          return (
            <button key={d} className={d === TODAY ? "today" : ""} onClick={() => scrollToDay(d)} aria-label={`${weekdayLong(d)}, November ${d}`}>
              <span>{weekday(d).slice(0, 1)}</span>
              <strong>{d}</strong>
              <i className={changed ? "dot" : ""} />
            </button>
          )
        })}
      </div>
      <div className="agenda" ref={scroll}>
        {days.map((d) => {
          const items = s.events
            .filter((e) => !e.deleted && e.date === d)
            .sort((a, b) => a.start - b.start || (a.kind === "deadline" ? 1 : -1))
          return (
            <section key={d} data-day={d} className="agenda-day">
              <h2>
                {weekdayLong(d)}, Nov {d}
                {d === TODAY && <span className="today-tag">Today</span>}
              </h2>
              {!items.length && <p className="agenda-empty">Nothing planned</p>}
              {items.map((e) => (
                <AgendaRow key={e.id} e={e} focused={e.id === focus} onOpen={() => go({ name: "event", id: e.id })} />
              ))}
            </section>
          )
        })}
        <p className="agenda-foot">
          <span className="spark-badge">✦</span> Changed or added by Calendar Assistant
        </p>
      </div>
    </main>
  )
}

function AgendaRow({ e, focused, onOpen }: { e: CalEvent; focused: boolean; onOpen: () => void }) {
  return (
    <button className={`agenda-event c-${e.color} kind-${e.kind} ${focused ? "focused" : ""}`} onClick={onOpen}>
      <span className="agenda-time">
        {e.kind === "deadline" ? (
          <>
            <b>Due</b>
            <small>{fmt(e.start)}</small>
          </>
        ) : e.kind === "reminder" ? (
          <>
            <b>{fmt(e.start)}</b>
            <small>Reminder</small>
          </>
        ) : (
          <>
            <b>{fmt(e.start)}</b>
            <small>{fmt(e.end)}</small>
          </>
        )}
      </span>
      <span className="agenda-bar" />
      <span className="agenda-body">
        <strong>
          {e.assistant && (
            <span className="spark-badge" aria-label="Changed by Calendar Assistant">
              ✦
            </span>
          )}
          {e.kind === "deadline" && <Icon name="flag" size={15} className="inline-icon" />}
          {e.kind === "reminder" && <Icon name="bell" size={15} className="inline-icon" />}
          {e.title}
        </strong>
        {e.location && <small>{e.location}</small>}
        {(e.assistant || e.flag) && (
          <span className="agenda-chips">
            {e.assistant && <SourceChip label={e.assistant.label} tone={e.assistant.tone} />}
            {e.flag && <span className="flag-pill">{e.flag}</span>}
          </span>
        )}
      </span>
    </button>
  )
}

function EventScreen({ id }: { id: string }) {
  const { s, go, back, undo, deleteEvent } = useStore()
  const e = s.events.find((x) => x.id === id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!e || e.deleted) {
    return (
      <main className="screen-root flow-screen" data-fp-screen="Event removed">
        <FlowHeader title="Event" backLabel="Calendar" />
        <div className="flow-scroll padded">
          <div className="empty-card">
            <Icon name="calendar" size={26} />
            <strong>This event isn't on your calendar now.</strong>
            <p>You can bring it back from History if you removed it by mistake.</p>
            <button className="secondary-button" onClick={() => go({ name: "history" })}>
              Open History
            </button>
          </div>
        </div>
      </main>
    )
  }
  const last = s.history.find((x) => x.before && x.before[id] && !x.undone)
  const canUndoLast = !!last && canUndo(s, last)
  const where = e.kind === "deadline" ? `Due ${dayLabel(e.date)}, ${fmt(e.start)}` : e.kind === "reminder" ? `${dayLabel(e.date)}, ${fmt(e.start)}` : `${dayLabel(e.date)}, ${fmtRange(e.start, e.end)}`
  return (
    <main className="screen-root flow-screen event-screen" data-fp-screen="Event detail">
      <FlowHeader title="Event" backLabel="Calendar" />
      <div className="flow-scroll compare-scroll">
        <div className={`event-hero c-${e.color}`}>
          <span className="event-hero-bar" />
          <div>
            <h2>
              {e.assistant && <span className="spark-badge big">✦</span>}
              {e.title}
            </h2>
            <p>
              <Icon name="clock" size={17} />
              {where}
            </p>
            {e.location && (
              <p>
                <Icon name="place" size={17} />
                {e.location}
              </p>
            )}
            <p>
              <Icon name="calendar" size={17} />
              {e.calendar}
              {e.organizer ? ` · organizer ${e.organizer}` : ""}
            </p>
            {e.remind && (
              <p>
                <Icon name="bell" size={17} />
                Reminder {e.remind}
              </p>
            )}
            {(e.assistant || e.flag) && (
              <div className="hero-chips">
                {e.assistant && <SourceChip label={e.assistant.label} tone={e.assistant.tone} />}
                {e.edited && <EditedChip />}
                {e.flag && <span className="flag-pill">{e.flag}</span>}
              </div>
            )}
          </div>
        </div>
        <section className="detail-section">
          <h3>Source</h3>
          {e.sources.length ? (
            e.sources.map((quote, i) => (
              <QuoteCard
                key={i}
                quote={quote}
                onView={
                  quote.chat && quote.msgId
                    ? () => {
                        logFootprint("source_open", { kind: "view_in_chat", msg: quote.msgId!, from: "event" })
                        go({ name: "chat", chat: quote.chat!, highlight: quote.msgId })
                      }
                    : undefined
                }
              />
            ))
          ) : (
            <p className="muted-line">{e.assistant ? "Source deleted with your history." : `From ${e.calendar}. No message attached.`}</p>
          )}
        </section>
        <section className="detail-section">
          <h3>Change history</h3>
          {e.log.length ? (
            <ol className="change-log">
              {e.log.map((line, i) => (
                <li key={i} className={`by-${line.by} ${i === e.log.length - 1 ? "latest" : ""}`}>
                  <span className="log-dot" />
                  <span>
                    <strong>{line.label}</strong>
                    {line.detail && <small>({line.detail})</small>}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted-line">No changes yet.</p>
          )}
        </section>
        <div className="event-actions">
          <button className="secondary-button" disabled={!canUndoLast} onClick={() => last && undo(last.id, "event")}>
            <Icon name="undo" size={17} />
            Undo last change
          </button>
          <button className="danger-outline" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" size={17} />
            Delete event
          </button>
        </div>
      </div>
      {confirmDelete && (
        <Sheet onClose={() => setConfirmDelete(false)}>
          <div className="sheet-icon danger">
            <Icon name="trash" size={24} />
          </div>
          <h2>Delete {e.title}?</h2>
          <p className="sheet-detail">
            {e.calendar === "Course site"
              ? "It will be hidden from your calendar. The course site doesn't change."
              : "It will be removed from your Google Calendar."}{" "}
            You can undo this from History.
          </p>
          <button
            className="danger-button"
            onClick={(ev) => {
              setConfirmDelete(false)
              deleteEvent(e.id)
              animateBack(ev.currentTarget, back)
            }}
          >
            Delete event
          </button>
          <button className="secondary-button" onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
        </Sheet>
      )}
    </main>
  )
}

// ---------- H1 History ----------

function HistoryScreen() {
  const { s, undo } = useStore()
  return (
    <main className="screen-root flow-screen" data-fp-screen="History">
      <FlowHeader title="History" />
      <div className="flow-scroll padded">
        <p className="page-intro">Every change, newest first. Undo works where nothing newer depends on it.</p>
        {!s.history.length && (
          <div className="empty-card">
            <Icon name="history" size={26} />
            <strong>No history</strong>
            <p>Changes you confirm will show up here.</p>
          </div>
        )}
        {s.history.map((entry, index) => {
          const can = canUndo(s, entry)
          return (
            <div className="activity-item" key={entry.id}>
              <div className="timeline">
                <span className={`${index === 0 ? "latest" : ""} ${entry.undone ? "undone" : ""} st-${entry.status}`}>
                  <Icon name={entry.status === "undo" ? "undo" : entry.status === "setting" ? "settings" : entry.undone ? "undo" : "check"} size={16} />
                </span>
                {index < s.history.length - 1 && <i />}
              </div>
              <div className="activity-card">
                <div className="activity-meta">
                  {entry.chip ? <SourceChip label={entry.chip.label} tone={entry.chip.tone} /> : <span className="setting-chip">{entry.status === "undo" ? "Undo" : "Setting"}</span>}
                  <time>{atStamp(entry.at)}</time>
                </div>
                <h3>{entry.title}</h3>
                <p>{entry.detail}</p>
                <div className="activity-foot">
                  {entry.status === "confirmed" && (
                    <span className={entry.undone ? "pill-muted" : "pill-ok"}>
                      {entry.undone ? `Undone · ${fmt(entry.undoneAt ?? entry.at)}` : "Confirmed by you"}
                    </span>
                  )}
                  {entry.status === "setting" && <span className="pill-muted">Your setting</span>}
                  {entry.status === "undo" && <span className="pill-muted">Undone by you</span>}
                  {entry.before && !entry.undone && (
                    <button className="undo-chip" disabled={!can} onClick={() => undo(entry.id, "history")}>
                      <Icon name="undo" size={15} />
                      Undo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

// ---------- ST1–ST5 Settings ----------

function SettingsRoot() {
  const { s, go } = useStore()
  const modeLabel = s.mode.watch && s.mode.chats.length
    ? `Watching ${s.mode.chats.length === 1 ? chatMeta[s.mode.chats[0]].name : `${s.mode.chats.length} chats`}`
    : "Only what you forward"
  const rows: [Screen, string, string, string][] = [
    [{ name: "settings-find" }, "eye", "How I find changes", modeLabel],
    [{ name: "settings-confirm" }, "check", "Confirmations", s.autoApply ? "Apply automatically in some cases" : "Always ask me"],
    [{ name: "settings-cal" }, "calendar", "Calendars & course site", `2 connected · synced ${fmt(s.sync.calendar)}`],
    [{ name: "settings-privacy" }, "lock", "Privacy & data", "Quotes only, deletable anytime"],
  ]
  return (
    <main className="screen-root flow-screen settings-screen" data-fp-screen="Settings">
      <FlowHeader title="Settings" />
      <div className="flow-scroll padded">
        <div className="settings-profile">
          <ChatAvatar chat="bot" size={52} />
          <div>
            <strong>Calendar Assistant</strong>
            <span>Connected for Maya Chen · Master's 2028</span>
          </div>
        </div>
        <div className="settings-list">
          {rows.map(([screen, icon, title, detail]) => (
            <button key={title} onClick={() => go(screen)}>
              <span className="settings-list-icon">
                <Icon name={icon} size={20} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
        <p className="settings-control-note">
          <Icon name="lock" size={14} />
          Nothing changes on your calendar until you confirm.
        </p>
      </div>
    </main>
  )
}

function FindChangesSettings() {
  const { s, setWatch, setWatchChat } = useStore()
  const [confirmChat, setConfirmChat] = useState<ChatId | null>(null)
  const watch = s.mode.watch
  const studyOn = s.mode.chats.includes("study")
  const t = fmt(corrAt(s))
  const options: ChatId[] = ["study", "team", "priya", "mom"]
  return (
    <main className="screen-root flow-screen settings-screen" data-fp-screen="How I find changes">
      <FlowHeader title="How I find changes" backLabel="Settings" />
      <div className="flow-scroll padded">
        <p className="settings-intro">Choose what I can see. You can change this anytime.</p>
        <div className="mode-options" role="radiogroup" aria-label="How I find changes">
          <button role="radio" aria-checked={!watch} className={!watch ? "selected" : ""} onClick={() => setWatch(false)}>
            <span className="radio" />
            <span>
              <strong>
                Only what you forward <em className="default-tag">Default</em>
              </strong>
              <small>I only see messages you send me.</small>
            </span>
          </button>
          <button role="radio" aria-checked={watch} className={watch ? "selected" : ""} onClick={() => setWatch(true)}>
            <span className="radio" />
            <span>
              <strong>Watch chats you choose</strong>
              <small>I read new messages in these chats and tell you about schedule changes.</small>
            </span>
          </button>
        </div>
        {watch && (
          <section className="watch-list">
            <h3>Chats I can read</h3>
            {options.map((chat) => {
              const on = s.mode.chats.includes(chat)
              return (
                <div className="watch-row" key={chat}>
                  <ChatAvatar chat={chat} size={38} />
                  <span>
                    <strong>{chatMeta[chat].name}</strong>
                    <small>{on ? `On since ${fmt(s.mode.since[chat] ?? nowAt(s))}` : "Off"}</small>
                  </span>
                  <Toggle
                    checked={on}
                    label={`Watch ${chatMeta[chat].name}`}
                    onChange={(value) => (value ? setConfirmChat(chat) : setWatchChat(chat, false))}
                  />
                </div>
              )
            })}
            {!s.mode.chats.length && <p className="hint-line">Pick at least one chat. Until then, I only see what you forward.</p>}
          </section>
        )}
        <p className="never-line">
          <Icon name="lock" size={15} />I never read your personal chats unless you pick them.
        </p>
        <section className="preview-box">
          <span className="card-kicker">PREVIEW</span>
          <p>
            {studyOn && watch
              ? `Stats 203 study group is on. I would have caught Sam's 4:30 correction (${t}), even if you forwarded only his 2:14 pm message.`
              : "With Stats 203 study group on, I would have caught Sam's 4:30 correction."}
          </p>
          <div className="preview-bubble">
            <ChatAvatar chat="bot" size={26} />
            <span>Heads up: Sam posted a newer message in this chat 17 min later: 'actually 4:30, sorry!'. Use that instead?</span>
          </div>
        </section>
      </div>
      {confirmChat && (
        <Sheet onClose={() => setConfirmChat(null)}>
          <div className="sheet-icon">
            <Icon name="eye" size={24} />
          </div>
          <h2>Let me read {chatMeta[confirmChat].name}?</h2>
          <ul className="sheet-bullets">
            <li>
              <Icon name="check" size={16} />I read new messages in this chat from now on.
            </li>
            <li>
              <Icon name="check" size={16} />I tell you about schedule changes and still ask before changing anything.
            </li>
            <li>
              <Icon name="check" size={16} />I keep only the quoted part of a message as a source.
            </li>
          </ul>
          <button
            className="primary-button"
            onClick={() => {
              setWatchChat(confirmChat, true)
              setConfirmChat(null)
            }}
          >
            Watch this chat
          </button>
          <button className="secondary-button" onClick={() => setConfirmChat(null)}>
            Cancel
          </button>
        </Sheet>
      )}
    </main>
  )
}

function ConfirmSettings() {
  const { s, setAutoApply } = useStore()
  return (
    <main className="screen-root flow-screen settings-screen" data-fp-screen="Confirmations">
      <FlowHeader title="Confirmations" backLabel="Settings" />
      <div className="flow-scroll padded">
        <p className="settings-intro">When I find a change, should I ask first?</p>
        <div className="mode-options" role="radiogroup" aria-label="Confirmations">
          <button role="radio" aria-checked={!s.autoApply} className={!s.autoApply ? "selected" : ""} onClick={() => s.autoApply && setAutoApply(false)}>
            <span className="radio" />
            <span>
              <strong>
                Always ask me <em className="default-tag">Default</em>
              </strong>
              <small>Nothing changes until you tap Update.</small>
            </span>
          </button>
          <button role="radio" aria-checked={s.autoApply} className={s.autoApply ? "selected" : ""} onClick={() => !s.autoApply && setAutoApply(true)}>
            <span className="radio" />
            <span>
              <strong>Apply automatically when the organizer changes it and nothing conflicts</strong>
              <small>Everything else still asks. You can undo from History.</small>
            </span>
          </button>
        </div>
        <section className="locked-card">
          <div>
            <strong>Deadlines</strong>
            <Icon name="lock" size={17} />
          </div>
          <span className="locked-choice">Always confirmed</span>
          <p>I always ask before changing a due date.</p>
        </section>
        <p className="hint-line">
          Example: Hana organizes Stats 203 study group. Sam isn't the organizer, so I'd still ask about his change.
        </p>
      </div>
    </main>
  )
}

function CalendarSettings() {
  const { s, syncNow, showToast } = useStore()
  const [syncing, setSyncing] = useState(false)
  const rows: [string, string, string, Tone, string][] = [
    ["Google Calendar", "calendar", "Read your events and change them after you confirm", "calendar", fmt(s.sync.calendar)],
    ["Course site", "book", "Read-only: courses, assignments and due dates", "bcourses", fmt(s.sync.bcourses)],
  ]
  return (
    <main className="screen-root flow-screen settings-screen" data-fp-screen="Calendars & course site">
      <FlowHeader title="Calendars & course site" backLabel="Settings" />
      <div className="flow-scroll padded">
        <div className="source-list">
          {rows.map(([name, icon, detail, tone, sync]) => (
            <section key={name}>
              <span className={`pick-icon ${toneClass[tone]}`}>
                <Icon name={icon} size={20} />
              </span>
              <div>
                <strong>{name}</strong>
                <small>
                  <i className="connected-dot" />
                  Connected · last sync {sync}
                </small>
                <span>{detail}</span>
              </div>
            </section>
          ))}
        </div>
        <button
          className="secondary-button"
          disabled={syncing}
          onClick={() => {
            setSyncing(true)
            window.setTimeout(() => {
              syncNow()
              setSyncing(false)
              showToast("Synced")
            }, 1100)
          }}
        >
          <Icon name="refresh" size={17} className={syncing ? "spin" : ""} />
          {syncing ? "Syncing…" : "Sync now"}
        </button>
        <p className="hint-line">I check both every few minutes. Chats aren't connected here. See How I find changes.</p>
      </div>
    </main>
  )
}

function PrivacySettings() {
  const { s, go, deleteHistory } = useStore()
  const [confirm, setConfirm] = useState(false)
  return (
    <main className="screen-root flow-screen settings-screen" data-fp-screen="Privacy & data">
      <FlowHeader title="Privacy & data" backLabel="Settings" />
      <div className="flow-scroll padded">
        <section className="data-promise">
          <Icon name="shield" size={22} />
          <p>I keep only the quoted part of a message as the source. I delete the rest after reading it.</p>
        </section>
        <div className="settings-list">
          <button onClick={() => go({ name: "settings-find" })}>
            <span className="settings-list-icon">
              <Icon name="eye" size={20} />
            </span>
            <span>
              <strong>Chats I can read</strong>
              <small>{s.mode.watch && s.mode.chats.length ? s.mode.chats.map((c) => chatMeta[c].name).join(", ") : "None. Only what you forward."}</small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
          <button onClick={() => go({ name: "settings-kept" })}>
            <span className="settings-list-icon">
              <Icon name="book" size={20} />
            </span>
            <span>
              <strong>See what I've kept</strong>
              <small>
                {s.kept.length} {s.kept.length === 1 ? "quote" : "quotes"}
              </small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        </div>
        <button className="danger-outline wide" onClick={() => setConfirm(true)}>
          <Icon name="trash" size={17} />
          Delete history
        </button>
      </div>
      {confirm && (
        <Sheet onClose={() => setConfirm(false)}>
          <div className="sheet-icon danger">
            <Icon name="trash" size={24} />
          </div>
          <h2>Delete your history?</h2>
          <p className="sheet-detail">
            I'll delete the change history and every quote I kept. Your calendar events stay as they are, but you won't be able to undo past changes.
          </p>
          <button
            className="danger-button"
            onClick={() => {
              deleteHistory()
              setConfirm(false)
            }}
          >
            Delete history
          </button>
          <button className="secondary-button" onClick={() => setConfirm(false)}>
            Cancel
          </button>
        </Sheet>
      )}
    </main>
  )
}

function KeptScreen() {
  const { s } = useStore()
  return (
    <main className="screen-root flow-screen settings-screen" data-fp-screen="What I've kept">
      <FlowHeader title="What I've kept" backLabel="Privacy" />
      <div className="flow-scroll padded">
        <p className="settings-intro">Only these quotes. Everything else was deleted after I read it.</p>
        {!s.kept.length && (
          <div className="empty-card">
            <Icon name="book" size={26} />
            <strong>Nothing kept</strong>
            <p>When you forward something, I keep only the quoted part as a source.</p>
          </div>
        )}
        {s.kept.map((quote, i) => (
          <QuoteCard key={i} quote={quote} />
        ))}
      </div>
    </main>
  )
}

// ---------- Moderator panel ----------

function ModeratorPanel({ onClose }: { onClose: () => void }) {
  const { s, reset, jump, setConfig, sendCorrectionNow, triggerEmail, triggerDigest } = useStore()
  const study = studyEvent(s)
  const correct = isCorrectStudy(study)
  const jumps: [Jump, string, string][] = [
    ["t1", "Lock screen", "Task 1 start"],
    ["t2", "Priya chat", "Task 2 start"],
    ["t3", "Assistant chat", "Task 3 start"],
    ["t4", "After Task 1", "Task 4 · event moved"],
    ["settings", "Settings", "Task 3 alternative"],
    ["history", "History", "After Task 1"],
    ["list", "Chat list", "Start state"],
    ["onboarding", "Onboarding", "First run (/start)"],
  ]
  const close = () => {
    if (window.location.hash === "#mod") history.replaceState(null, "", window.location.pathname + window.location.search)
    onClose()
  }
  return (
    <div
      className="moderator-layer"
      data-fp-moderator=""
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <section className="moderator-sheet">
        <div className="grabber" />
        <header>
          <div>
            <span>DEMO CONTROLS</span>
            <h2>Moderator</h2>
          </div>
          <b>{BUILD_VERSION}</b>
        </header>
        <div className="moderator-status">
          <span className={correct ? "ok" : ""}>{correct ? "T1 correct" : "T1 not correct yet"}</span>
          <p>
            Study group: {study.deleted ? "deleted" : slotText({ date: study.date, start: study.start, end: study.end, location: study.location ?? "" })}
          </p>
          <p>
            Mode: {s.mode.watch && s.mode.chats.length ? `watching ${s.mode.chats.join(", ")}` : "forward-only"} · correction{" "}
            {s.correction.arrived ? `in chat (${fmt(corrAt(s))})` : s.correction.timerStarted ? "arriving in under 30 s" : "not sent yet"}
            {s.a5.status === "resolved" ? ` · T2 choice ${s.a5.choice}` : ""}
          </p>
        </div>
        <button
          className="moderator-reset"
          onClick={() => {
            reset([{ name: "list" }])
            close()
          }}
        >
          <Icon name="refresh" size={18} />
          Reset demo
        </button>
        <h3>JUMP TO</h3>
        <div className="moderator-jumps">
          {jumps.map(([id, label, detail]) => (
            <button
              key={id}
              onClick={() => {
                jump(id)
                close()
              }}
            >
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <Icon name="chevron" size={17} />
            </button>
          ))}
        </div>
        <h3>START STATE (CHANGING RESETS THE DEMO)</h3>
        <div className="moderator-toggles">
          <label>
            <span>
              <strong>Correction already in chat</strong>
              <small>{s.config.correction === "present" ? "Sam's 2:31 pm message is there" : "Arrives 30 s after the group opens"}</small>
            </span>
            <Toggle
              checked={s.config.correction === "present"}
              label="Correction already in chat"
              onChange={(on) => setConfig({ ...s.config, correction: on ? "present" : "late" })}
            />
          </label>
          <label>
            <span>
              <strong>Watch mode at start</strong>
              <small>{s.config.watchAtStart ? "Watching Stats 203 study group" : "Forward-only (default)"}</small>
            </span>
            <Toggle
              checked={s.config.watchAtStart}
              label="Watch mode at start"
              onChange={(on) => setConfig({ ...s.config, watchAtStart: on })}
            />
          </label>
        </div>
        <h3>TRIGGERS</h3>
        <div className="moderator-triggers">
          <button disabled={s.correction.arrived} onClick={() => sendCorrectionNow()}>
            <strong>Send Sam's correction now</strong>
            <small>{s.correction.arrived ? "Already in the chat" : "For the arrives-later variant"}</small>
          </button>
          <button
            onClick={() => {
              triggerEmail("jordan")
              jump2Bot()
            }}
          >
            <strong>Forward recruiter email</strong>
            <small>Ambiguous "Thursday at 4" (A1)</small>
          </button>
          <button
            onClick={() => {
              triggerEmail("career")
              jump2Bot()
            }}
          >
            <strong>Forward Career Center email</strong>
            <small>New event (E1)</small>
          </button>
          <button
            onClick={() => {
              triggerDigest()
              jump2Bot()
            }}
          >
            <strong>Send 8:00 pm digest</strong>
            <small>Daily digest (D1)</small>
          </button>
        </div>
        <FootprintsPanel prototype="chat" />
        <button className="moderator-close" onClick={close}>
          Close
        </button>
      </section>
    </div>
  )
  function jump2Bot() {
    window.dispatchEvent(new CustomEvent("moderator-open-bot"))
    close()
  }
}

// ---------- App shell ----------

function renderScreen(screen: Screen) {
  switch (screen.name) {
    case "lock":
      return <LockScreen />
    case "list":
      return <ChatList />
    case "chat":
      return screen.chat === "bot" ? <BotChat /> : <ChatThread chat={screen.chat} highlight={screen.highlight} unreadAtOpen={screen.unread} />
    case "compare":
      return <CompareScreen pid={screen.pid} />
    case "sources":
      return <SourcesScreen />
    case "calendar":
      return <CalendarScreen week={screen.week} focus={screen.focus} />
    case "event":
      return <EventScreen id={screen.id} />
    case "history":
      return <HistoryScreen />
    case "settings":
      return <SettingsRoot />
    case "settings-find":
      return <FindChangesSettings />
    case "settings-confirm":
      return <ConfirmSettings />
    case "settings-cal":
      return <CalendarSettings />
    case "settings-privacy":
      return <PrivacySettings />
    case "settings-kept":
      return <KeptScreen />
  }
}

function screenKey(screen: Screen, depth: number) {
  const extra =
    screen.name === "chat" ? `${screen.chat}-${screen.highlight ?? ""}` : screen.name === "compare" ? screen.pid : screen.name === "event" ? screen.id : ""
  return `${depth}-${screen.name}-${extra}`
}

function AppContent() {
  const store = useStore()
  const { s } = store
  const [mod, setMod] = useState(() => window.location.hash === "#mod")
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#mod") setMod(true)
    }
    const open = () => setMod(true)
    window.addEventListener("hashchange", onHash)
    window.addEventListener("open-moderator", open)
    return () => {
      window.removeEventListener("hashchange", onHash)
      window.removeEventListener("open-moderator", open)
    }
  }, [])
  const setNavRef = useRef(store.setNav)
  setNavRef.current = store.setNav
  useEffect(() => {
    const openBot = () => setNavRef.current([{ name: "list" }, { name: "chat", chat: "bot" }])
    window.addEventListener("moderator-open-bot", openBot)
    return () => window.removeEventListener("moderator-open-bot", openBot)
  }, [])

  const screen = top(s)
  const key = screenKey(screen, s.nav.length)
  if (screen.name === "lock") {
    return (
      <div className="device-shell lock-shell">
        <LockScreen key={key} />
        <ToastView />
        {mod && <ModeratorPanel onClose={() => setMod(false)} />}
      </div>
    )
  }
  return (
    <div className="device-shell">
      <StatusBar />
      <div className="app-body">
        <div className="screen-holder" key={key}>
          {renderScreen(screen)}
        </div>
      </div>
      <BannerView />
      <ToastView />
      {mod && <ModeratorPanel onClose={() => setMod(false)} />}
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
