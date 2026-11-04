import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"
import {
  appData,
  sourceStyles,
  type CalendarEvent,
  type InboxItem,
  type ItemStatus,
  type RegistrationField,
  type Source,
} from "./data"
import { StoreProvider, useStore } from "./store"
import { FootprintsPanel } from "@/shared/FootprintsPanel"

type Tab = "home" | "inbox" | "calendar" | "activity"
type CareerStep = "detail" | "preparing" | "form" | "employers-only" | "review" | "team-message" | "submitting" | "confirmation"
type FlowHeaderProps = {
  title: string
  onBack: () => void
}

const icons: Record<string, ReactNode> = {
  home: (
    <>
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M4 14h4l2 3h4l2-3h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  activity: (
    <>
      <path d="M12 8v5l3 2" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  back: <path d="m15 18-6-6 6-6" />,
  close: (
    <>
      <path d="m7 7 10 10M17 7 7 17" />
    </>
  ),
  event: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <path d="M8 14h3" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="14" height="12" rx="2" />
      <path d="m17 10 4-2v8l-4-2" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3.2-.2 5 1.5 5.5 4" />
    </>
  ),
  checklist: (
    <>
      <path d="m4 7 2 2 3-4M11 7h9M4 15l2 2 3-4M11 15h9" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5a3.5 3.5 0 0 1 3.5 3z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
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
}

function Icon({
  name,
  size = 22,
  className = "",
}: {
  name: string
  size?: number
  className?: string
}) {
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
      {icons[name]}
    </svg>
  )
}

function SourceChip({ source }: { source: Source }) {
  return <span className={`source-chip ${sourceStyles[source]}`}>{source}</span>
}

function Header({
  eyebrow,
  title,
  onAvatar,
}: {
  eyebrow?: string
  title: string
  onAvatar: () => void
}) {
  const moderatorTimer = useRef<number | null>(null)
  const openedModerator = useRef(false)
  const startModeratorPress = () => {
    openedModerator.current = false
    moderatorTimer.current = window.setTimeout(() => {
      openedModerator.current = true
      window.dispatchEvent(new CustomEvent("open-moderator"))
    }, 3000)
  }
  const stopModeratorPress = () => {
    if (moderatorTimer.current !== null) {
      window.clearTimeout(moderatorTimer.current)
      moderatorTimer.current = null
    }
  }
  return (
    <header className="app-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      <button
        className="avatar"
        onPointerDown={startModeratorPress}
        onPointerUp={stopModeratorPress}
        onPointerCancel={stopModeratorPress}
        onPointerLeave={stopModeratorPress}
        onClick={() => {
          if (!openedModerator.current) onAvatar()
          openedModerator.current = false
        }}
        aria-label="Open settings"
      >
        {appData.user.initials}
      </button>
    </header>
  )
}

function Home({
  onReview,
  onAvatar,
}: {
  onReview: (item: InboxItem) => void
  onAvatar: () => void
}) {
  const { inbox, activity, assistantPaused, setAssistantPaused } = useStore()
  const pending = inbox.filter((item) => item.status === "needs-ok")
  const featured = pending[0]
  return (
    <main className="screen home-screen">
      <Header
        eyebrow="Tue Nov 10"
        title={`Good morning, ${appData.user.firstName}`}
        onAvatar={onAvatar}
      />
      {assistantPaused && (
        <div className="paused-banner">
          <Icon name="activity" size={18} />
          <p>
            <strong>Assistant paused.</strong>I won’t read or suggest anything.
          </p>
          <button onClick={() => setAssistantPaused(false)}>Resume</button>
        </div>
      )}
      {featured ? (
        <section className="approval-card">
          <div className="section-heading">
            <div className="approval-title">
              <span className="sparkle">
                <Icon name="sparkle" size={17} />
              </span>
              <h2>Needs your OK</h2>
              <span className="count">{pending.length}</span>
            </div>
            <SourceChip source={featured.source} />
          </div>
          <h3>{featured.title}</h3>
          <p>{featured.detail}</p>
          <p className="subtle">{featured.meta}</p>
          <button
            className="primary-button"
            disabled={assistantPaused}
            onClick={() => onReview(featured)}
          >
            Review
          </button>
        </section>
      ) : (
        <section className="all-clear card">
          <span className="success-circle">
            <Icon name="check" size={18} />
          </span>
          <div>
            <h3>Nothing needs you right now</h3>
            <p>You’re all caught up.</p>
          </div>
        </section>
      )}

      <section className="content-section">
        <div className="section-title-row">
          <h2>Today</h2>
          <span>3 events</span>
        </div>
        <div className="card today-card">
          {appData.today.map((item) => (
            <div className="today-row" key={item.id}>
              <span className={`event-dot ${item.color}`} />
              <span className="today-title">{item.title}</span>
              <time>{item.time}</time>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-title-row">
          <h2>This week</h2>
          <SourceChip source="bCourses" />
        </div>
        <div className="card deadline-card">
          {appData.deadlines.map((item) => (
            <div className="deadline-row" key={item.id}>
              <div>
                <span>{item.course}</span>
                <strong>{item.title}</strong>
              </div>
              <time>{item.due}</time>
            </div>
          ))}
        </div>
      </section>

      <div className="handled">
        <span className="success-circle">
          <Icon name="check" size={15} />
        </span>
        <div>
          <strong>Handled this week</strong>
          <p>
            {activity.length}{" "}
            {activity.length === 1 ? "deadline added" : "actions completed"}
          </p>
        </div>
      </div>
    </main>
  )
}

const segmentLabels: Record<ItemStatus, string> = {
  "needs-ok": "Needs your OK",
  "in-progress": "In progress",
  done: "Done",
}

function Inbox({
  onReview,
  onAvatar,
}: {
  onReview: (item: InboxItem) => void
  onAvatar: () => void
}) {
  const { inbox, assistantPaused, setAssistantPaused } = useStore()
  const [status, setStatus] = useState<ItemStatus>("needs-ok")
  const visible = inbox.filter((item) => item.status === status)
  return (
    <main className="screen inbox-screen">
      <Header title="Inbox" onAvatar={onAvatar} />
      {assistantPaused && (
        <div className="paused-banner inbox-paused">
          <Icon name="activity" size={18} />
          <p>
            <strong>Assistant paused.</strong>I won’t read or suggest anything.
          </p>
          <button onClick={() => setAssistantPaused(false)}>Resume</button>
        </div>
      )}
      <div className="segments" role="tablist">
        {(Object.keys(segmentLabels) as ItemStatus[]).map((key) => {
          const count = inbox.filter((item) => item.status === key).length
          return (
            <button
              role="tab"
              aria-selected={status === key}
              className={status === key ? "active" : ""}
              onClick={() => setStatus(key)}
              key={key}
            >
              {segmentLabels[key]} <span>{count}</span>
            </button>
          )
        })}
      </div>
      <div className="inbox-list">
        {visible.length === 0 && (
          <div className="segment-empty">
            <span className="success-circle">
              <Icon name="check" size={17} />
            </span>
            <strong>You’re all caught up</strong>
            <p>Nothing in this section right now.</p>
          </div>
        )}
        {visible.map((item) => (
          <button
            className="inbox-row"
            key={item.id}
            disabled={assistantPaused}
            onClick={() => onReview(item)}
          >
            <span className={`row-icon ${item.source.toLowerCase()}`}>
              <Icon name={item.icon} size={21} />
            </span>
            <span className="row-content">
              <span className="row-top">
                <strong>{item.title}</strong>
                <time>{item.age}</time>
              </span>
              <span className="row-detail">{item.detail}</span>
              {item.meta && <span className="row-meta">{item.meta}</span>}
              <span
                className={`proposal ${
                  item.proposal === "Reminder set" ? "reminder-set-chip" : ""
                }`}
              >
                <Icon
                  name={status === "done" ? "check" : "sparkle"}
                  size={14}
                />
                {item.proposal}
              </span>
              <span className="row-source">
                <SourceChip source={item.source} />
                <Icon name="chevron" size={17} />
              </span>
            </span>
          </button>
        ))}
      </div>
    </main>
  )
}

const weekDays = [
  ["M", "9"],
  ["T", "10"],
  ["W", "11"],
  ["T", "12"],
  ["F", "13"],
  ["S", "14"],
  ["S", "15"],
]

function Calendar({
  onEvent,
  onAvatar,
}: {
  onEvent: (event: CalendarEvent) => void
  onAvatar: () => void
}) {
  const { calendar } = useStore()
  const [week, setWeek] = useState<0 | 1>(0)
  const visible = calendar.filter((event) => event.week === week)
  const labels =
    week === 0
      ? weekDays
      : [
          ["M", "16"],
          ["T", "17"],
          ["W", "18"],
          ["T", "19"],
          ["F", "20"],
          ["S", "21"],
          ["S", "22"],
        ]
  return (
    <main className="screen calendar-screen">
      <Header title="Calendar" onAvatar={onAvatar} />
      <div className="week-nav">
        <button
          aria-label="Previous week"
          disabled={week === 0}
          onClick={() => setWeek(0)}
        >
          <Icon name="back" />
        </button>
        <div>
          <strong>November {week === 0 ? "9-15" : "16-22"}</strong>
          <span>2026</span>
        </div>
        <button
          aria-label="Next week"
          disabled={week === 1}
          onClick={() => setWeek(1)}
        >
          <Icon name="chevron" />
        </button>
      </div>
      <div className="day-strip">
        {labels.map(([day, date], index) => (
          <div
            className={week === 0 && index === 1 ? "selected" : ""}
            key={`${day}-${date}`}
          >
            <span>{day}</span>
            <strong>{date}</strong>
          </div>
        ))}
      </div>
      <div className="calendar-scroll">
        <div className="calendar-grid">
          {Array.from({ length: 18 }, (_, i) => i + 7).map((hour, index) => (
            <div className="hour-line" style={{ top: index * 53 }} key={hour}>
              <span>
                {hour > 12 ? hour - 12 : hour}
                {hour >= 12 ? "p" : "a"}
              </span>
            </div>
          ))}
          {visible.map((event) => {
            const top = (event.start - 7) * 53
            if (event.kind === "deadline") {
              return (
                <button
                  className="deadline-flag"
                  style={{
                    top: Math.min(top, 890),
                    left: `calc(45px + ${event.day} * (100% - 45px) / 7)`,
                    width: "calc((100% - 51px) / 7)",
                  }}
                  onClick={() => onEvent(event)}
                  key={event.id}
                  aria-label={`${event.title}, due ${formatHour(event.start)}`}
                >
                  <span />
                  <strong>{event.title}</strong>
                </button>
              )
            }
            const height = Math.max((event.end - event.start) * 53 - 3, 31)
            const hasCareerNightClash =
              event.id === "sync-thu-w2" || event.id === "career-cal"
            const isCareerNight = event.id === "career-cal"
            return (
              <button
                className={`cal-event ${event.color}`}
                style={{
                  top,
                  height,
                  left: isCareerNight
                    ? `calc(45px + ${event.day} * (100% - 45px) / 7 + (100% - 45px) / 14)`
                    : `calc(45px + ${event.day} * (100% - 45px) / 7)`,
                  width: hasCareerNightClash
                    ? "calc((100% - 58px) / 14)"
                    : "calc((100% - 51px) / 7)",
                }}
                onClick={() => onEvent(event)}
                key={event.id}
              >
                {event.assistantAdded && (
                  <i className="assistant-event-badge">
                    <Icon name="sparkle" size={9} />
                  </i>
                )}
                <strong>{event.title}</strong>
                <span>{formatHour(event.start)}</span>
              </button>
            )
          })}
          {week === 0 && (
            <div className="now-line" style={{ top: (10.7 - 7) * 53 }}>
              <span />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function formatHour(hour: number) {
  const whole = Math.floor(hour)
  const minuteValue = Math.round((hour - whole) * 60)
  const minutes = `:${String(minuteValue).padStart(2, "0")}`
  return `${whole > 12 ? whole - 12 : whole}${minutes}${
    whole >= 12 ? "pm" : "am"
  }`
}

function Activity({ onAvatar }: { onAvatar: () => void }) {
  const { activity, registrationStatus } = useStore()
  const [showCareerDetails, setShowCareerDetails] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [filter, setFilter] = useState<"all" | "sent" | "calendar" | "undone">(
    "all",
  )
  const matchesFilter = (item: typeof activity[number]) => {
    if (filter === "all") return true
    if (filter === "undone")
      return (
        item.kind === "career-cancellation" ||
        /cancelled|undone/i.test(item.title)
      )
    if (filter === "calendar")
      return (
        Boolean(item.automatic) ||
        item.kind === "career-registration" ||
        /added|booked/i.test(item.title)
      )
    return /sent|registered|joined/i.test(item.title)
  }
  const filteredActivity = activity.filter(matchesFilter)
  return (
    <main className="screen activity-screen">
      <Header title="Activity" onAvatar={onAvatar} />
      <p className="page-intro">
        A clear record of what your assistant handled.
      </p>
      <div
        className="activity-filters"
        role="tablist"
        aria-label="Activity filters"
      >
        {[
          ["all", "All"],
          ["sent", "Sent for you"],
          ["calendar", "Added to calendar"],
          ["undone", "Undone"],
        ].map(([id, label]) => (
          <button
            role="tab"
            aria-selected={filter === id}
            className={filter === id ? "selected" : ""}
            onClick={() => setFilter(id as typeof filter)}
            key={id}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="activity-list">
        {filteredActivity.length === 0 && (
          <div className="activity-empty">
            <span className="success-circle">
              <Icon name="activity" size={17} />
            </span>
            <strong>No activity here yet</strong>
            <p>Actions matching this filter will appear here.</p>
          </div>
        )}
        {filteredActivity.map((item, index) => (
          <div className="activity-item" key={item.id}>
            <div className="timeline">
              <span className={index === 0 ? "latest" : ""}>
                <Icon name={item.automatic ? "sparkle" : "check"} size={17} />
              </span>
              {index < filteredActivity.length - 1 && <i />}
            </div>
            <div className="activity-card">
              <div className="activity-meta">
                <SourceChip source={item.source} />
                <time>{item.time}</time>
              </div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <span
                className={
                  item.kind === "career-cancellation"
                    ? "cancelled"
                    : item.automatic
                      ? "automatic"
                      : "approved"
                }
              >
                {item.kind === "career-cancellation"
                  ? "Cancelled by you"
                  : item.automatic
                    ? "Automatic"
                    : "Approved by you"}
              </span>
              {item.kind === "career-registration" && (
                <div className="activity-actions">
                  <button onClick={() => setShowCareerDetails(true)}>
                    View details
                  </button>
                  {registrationStatus === "registered" && (
                    <button onClick={() => setShowCancel(true)}>
                      Cancel registration
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="privacy-note">
        <Icon name="lock" size={17} />
        <span>
          <strong>You’re always in control</strong>
          <br />
          Nothing is sent without your OK.
        </span>
      </div>
      {showCareerDetails && (
        <ActivityDetailSheet onClose={() => setShowCareerDetails(false)} />
      )}
      {showCancel && (
        <CancelRegistrationSheet onClose={() => setShowCancel(false)} />
      )}
    </main>
  )
}

function LockScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <main className="lock-screen" data-fp-screen="Lock screen">
      <div className="lock-status">
        <span>10:42</span>
        <div className="status-icons">
          <span className="signal" />
          <span className="wifi">◒</span>
          <span className="battery" />
        </div>
      </div>
      <div className="lock-heading">
        <Icon name="lock" size={17} />
        <p>Tuesday, November 10</p>
        <h1>10:42</h1>
      </div>
      <button className="lock-notification" onClick={onOpen}>
        <span className="notification-icon">
          <Icon name="sparkle" size={19} />
        </span>
        <span className="notification-copy">
          <span>
            <strong>Personal Assistant</strong>
            <time>now</time>
          </span>
          <b>Career Center: Product Design Career Night (Thu Nov 19).</b>
          <span>Registration closes Mon. Want me to handle it?</span>
        </span>
      </button>
      <div className="lock-footer">
        <span />
        <span />
        <i />
      </div>
    </main>
  )
}

function FlowHeader({ title, onBack }: FlowHeaderProps) {
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
      <span />
    </header>
  )
}

function SimulatedBrowserCard({
  title,
  onClose,
  onContinue,
}: {
  title: string
  onClose: () => void
  onContinue?: () => void
}) {
  return (
    <div className="browser-layer">
      <section className="browser-card">
        <div className="browser-bar">
          <span />
          <span />
          <span />
          <div>berkeley.example/secure</div>
        </div>
        <div className="browser-content">
          <span className="browser-logo">B</span>
          <h2>{title}</h2>
          <p>Secure Berkeley sign-in required</p>
          <div className="browser-placeholder" />
          <div className="browser-placeholder short" />
        </div>
        {onContinue && (
          <button className="primary-button" onClick={onContinue}>
            Continue
          </button>
        )}
        <button className="secondary-button" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  )
}

function WaitlistFlow({ onDone }: { onDone: () => void }) {
  const { joinWaitlist, autonomy } = useStore()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [policy, setPolicy] = useState<"ask" | "automatic">(() =>
    autonomy.eventRegistrations === "doAndTell" ? "automatic" : "ask",
  )
  const finish = () => {
    joinWaitlist(policy)
    setStep(3)
  }
  return (
    <main className="flow-screen waitlist-screen">
      <FlowHeader title="Google UX Research" onBack={onDone} />
      <div className="flow-scroll waitlist-scroll">
        <div className="waitlist-event-icon">
          <Icon name="video" size={26} />
        </div>
        <SourceChip source="Email" />
        {step === 1 && (
          <>
            <h1>This session is full.</h1>
            <p>Want me to join the waitlist?</p>
            <section className="waitlist-event-card">
              <strong>Google UX Research Info Session</strong>
              <span>Wed Nov 18 · 5:00-6:00pm</span>
              <span>Zoom</span>
            </section>
            <button className="primary-button" onClick={() => setStep(2)}>
              Join waitlist
            </button>
            <button className="secondary-button" onClick={onDone}>
              Not now
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h1>If a spot opens, should I take it?</h1>
            <p>You can choose how much I do automatically.</p>
            <div className="waitlist-options">
              <label>
                <input
                  type="radio"
                  checked={policy === "ask"}
                  onChange={() => setPolicy("ask")}
                />
                <span />
                <div>
                  <strong>Ask me first</strong>
                  <small>I’ll notify you before accepting a spot</small>
                </div>
              </label>
              <label>
                <input
                  type="radio"
                  checked={policy === "automatic"}
                  onChange={() => setPolicy("automatic")}
                />
                <span />
                <div>
                  <strong>Take it if it doesn’t clash</strong>
                  <small>I’ll check your calendar and tell you</small>
                </div>
              </label>
            </div>
            <button className="primary-button" onClick={finish}>
              Confirm
            </button>
            <button className="secondary-button" onClick={() => setStep(1)}>
              Back
            </button>
          </>
        )}
        {step === 3 && (
          <div className="waitlist-success">
            <span className="success-circle">
              <Icon name="check" size={21} />
            </span>
            <h1>On the waitlist, #7</h1>
            <p>
              {policy === "ask"
                ? "I’ll ask you first if a spot opens."
                : "I’ll take a spot automatically if it doesn’t clash."}
            </p>
            <div className="control-note">
              <Icon name="activity" size={15} />
              Added to Activity and moved to In progress
            </div>
            <button className="primary-button" onClick={onDone}>
              Done
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function PaperworkFlow({ onDone }: { onDone: () => void }) {
  const { paperworkChecks, togglePaperworkCheck, completePaperwork } =
    useStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [showPortal, setShowPortal] = useState(false)
  const tasks = [
    "Log in to the student portal",
    "Update your US address",
    "Save the confirmation",
  ]
  const completed = paperworkChecks.filter(Boolean).length
  return (
    <main className="flow-screen paperwork-screen">
      <FlowHeader title="US address update" onBack={onDone} />
      <div className="flow-scroll paperwork-scroll">
        {step === 1 ? (
          <>
            <div className="paperwork-shield">
              <Icon name="lock" size={27} />
            </div>
            <SourceChip source="Email" />
            <h1>This needs you</h1>
            <p>
              This is an immigration-related form, so I won’t submit it for you.
              Here’s a checklist instead.
            </p>
            <div className="paperwork-deadline">
              <Icon name="calendar" size={19} />
              <span>
                <strong>Deadline · Fri Nov 20</strong>
                Reminders 3 days and 1 day before
              </span>
            </div>
            <button className="primary-button" onClick={() => setStep(2)}>
              View checklist
            </button>
            <button className="secondary-button" onClick={onDone}>
              Back
            </button>
          </>
        ) : (
          <>
            <h1>Your address update checklist</h1>
            <p>Complete these steps in the Berkeley student portal.</p>
            <div className="checklist-progress">
              <span>
                {completed} of {tasks.length} complete
              </span>
              <div>
                <i style={{ width: `${(completed / tasks.length) * 100}%` }} />
              </div>
            </div>
            <div className="paperwork-checklist">
              {tasks.map((task, index) => (
                <button
                  className={paperworkChecks[index] ? "complete" : ""}
                  onClick={() => togglePaperworkCheck(index)}
                  key={task}
                >
                  <span>
                    {paperworkChecks[index] && <Icon name="check" size={15} />}
                  </span>
                  {task}
                </button>
              ))}
            </div>
            <div className="paperwork-reminders">
              <Icon name="activity" size={17} />
              Reminders set for Nov 17 and Nov 19
            </div>
            <button
              className="primary-button"
              onClick={() => setShowPortal(true)}
            >
              Open portal
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                completePaperwork()
                onDone()
              }}
            >
              Mark done
            </button>
          </>
        )}
      </div>
      {showPortal && (
        <SimulatedBrowserCard
          title="CalCentral Student Portal"
          onClose={() => setShowPortal(false)}
        />
      )}
    </main>
  )
}

function MeetingFlow({ onDone }: { onDone: () => void }) {
  const { autonomy, sendMeetingPoll, undoMeetingPoll, bookMeeting } = useStore()
  const [step, setStep] =
    useState<"message" | "checking" | "slots" | "draft" | "sent" | "booked">(
      "message",
    )
  const [selectedSlots, setSelectedSlots] = useState([0, 1, 2])
  const [editingDraft, setEditingDraft] = useState(false)
  const [automatic, setAutomatic] = useState(false)
  const slots = [
    { title: "Thu Nov 12", time: "1:30-2:30pm", short: "Thu 1:30pm" },
    { title: "Fri Nov 13", time: "10:00-11:00am", short: "Fri 10:00am" },
    { title: "Sat Nov 14", time: "2:00-3:00pm", short: "Sat 2:00pm" },
  ]
  const [draft, setDraft] = useState(
    "Hi team, which works for the M3 deck? Thu 1:30pm, Fri 10:00am, Sat 2:00pm",
  )

  useEffect(() => {
    if (step !== "checking") return
    const timer = window.setTimeout(() => setStep("slots"), 2000)
    return () => window.clearTimeout(timer)
  }, [step])

  const continueFromSlots = () => {
    setDraft(
      `Hi team, which works for the M3 deck? ${selectedSlots
        .map((index) => slots[index].short)
        .join(", ")}`,
    )
    if (autonomy.meetingScheduling === "doAndTell") {
      setAutomatic(true)
      sendMeetingPoll(true)
      setStep("sent")
    } else {
      setStep("draft")
    }
  }

  return (
    <main className="flow-screen meeting-screen">
      <FlowHeader title="INFO 213 team" onBack={onDone} />
      <div className="flow-scroll meeting-scroll">
        {step === "message" && (
          <>
            <div className="forwarded-label">FORWARDED MESSAGE</div>
            <div className="chat-bubble">
              <strong>Kai</strong>
              <p>Can we meet this week to finish the M3 deck?</p>
            </div>
            <div className="meeting-source">
              <SourceChip source="WhatsApp" />
              <span>INFO 213 team - 8:15am</span>
            </div>
            <div className="meeting-proposal">
              <Icon name="sparkle" size={19} />
              <p>
                <strong>I can find a time for all four of you</strong>
                I’ll check the calendars I can see.
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => setStep("checking")}
            >
              Find a time
            </button>
          </>
        )}
        {step === "checking" && (
          <div className="meeting-checking">
            <div className="preparing-orbit">
              <span>
                <Icon name="calendar" size={26} />
              </span>
              <i />
            </div>
            <h1>Checking availability…</h1>
            <p>Comparing the team’s shared calendars.</p>
            <div className="skeleton-lines meeting-skeleton" aria-hidden="true">
              <span />
              <span />
            </div>
            <div>
              <span className="success-circle">
                <Icon name="check" size={15} />
              </span>
              <p>
                <strong>3 of 4 teammates share calendars</strong>
                Ravi’s availability is unknown.
              </p>
            </div>
          </div>
        )}
        {step === "slots" && (
          <>
            <h1>Here are three good options</h1>
            <p>Pick which times to offer the team.</p>
            <div className="meeting-slots">
              {slots.map((slot, index) => {
                const selected = selectedSlots.includes(index)
                return (
                  <button
                    className={selected ? "selected" : ""}
                    onClick={() =>
                      setSelectedSlots((current) =>
                        current.includes(index)
                          ? current.filter((candidate) => candidate !== index)
                          : [...current, index].sort(),
                      )
                    }
                    key={slot.title}
                  >
                    <span>{selected && <Icon name="check" size={15} />}</span>
                    <div>
                      <strong>{slot.title}</strong>
                      <b>{slot.time}</b>
                      <small>Fits everyone I can see</small>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              className="primary-button"
              disabled={selectedSlots.length === 0}
              onClick={continueFromSlots}
            >
              Continue
            </button>
          </>
        )}
        {step === "draft" && (
          <>
            <h1>Check the poll before I send it</h1>
            <div className="message-to">
              <span>To</span>
              <strong>INFO 213 team</strong>
              <SourceChip source="WhatsApp" />
            </div>
            {editingDraft ? (
              <label className="message-draft">
                <span>Poll message</span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
            ) : (
              <div className="poll-preview">{draft}</div>
            )}
            <button
              className="primary-button"
              onClick={() => {
                sendMeetingPoll(false)
                setAutomatic(false)
                setStep("sent")
              }}
            >
              Send
            </button>
            <button
              className="secondary-button"
              onClick={() => setEditingDraft((current) => !current)}
            >
              {editingDraft ? "Done editing" : "Edit"}
            </button>
          </>
        )}
        {step === "sent" && (
          <div className="meeting-sent">
            <span className="success-circle">
              <Icon name="check" size={20} />
            </span>
            <h1>{automatic ? "I sent the poll for you" : "Poll sent"}</h1>
            <p>I’ll book the winning slot when everyone answers.</p>
            {automatic && (
              <button
                className="undo-button"
                onClick={() => {
                  undoMeetingPoll()
                  setStep("slots")
                }}
              >
                Undo
              </button>
            )}
            <button
              className="later-link"
              onClick={() => {
                bookMeeting()
                setStep("booked")
              }}
            >
              (2 hours later)
            </button>
          </div>
        )}
        {step === "booked" && (
          <div className="meeting-sent booked">
            <span className="success-circle">
              <Icon name="calendar" size={21} />
            </span>
            <h1>Fri 10:00am won. Booked.</h1>
            <p>
              INFO 213 · M3 deck
              <br />
              Fri Nov 13 · 10:00-11:00am
            </p>
            <div className="assistant-added-chip">
              <Icon name="sparkle" size={14} />
              Added by Personal Assistant
            </div>
            <button className="primary-button" onClick={onDone}>
              Done
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

type ModeratorJump = "lock" | "home" | "registered" | "settings" | "meeting" | "waitlist" | "onboarding"

function ModeratorPanel({
  onClose,
  onJump,
}: {
  onClose: () => void
  onJump: (target: ModeratorJump) => void
}) {
  const {
    resetDemo,
    plantedError,
    formChangedError,
    cantReachFormError,
    setPlantedError,
    setFormChangedError,
    setCantReachFormError,
  } = useStore()
  const jumps: [ModeratorJump, string, string][] = [
    ["lock", "Lock screen", "Task 1"],
    ["home", "Home", "Start state"],
    ["registered", "Activity after registering", "Task 2 start"],
    ["settings", "Settings", "Task 3"],
    ["meeting", "Meeting flow", "Inbox item 3"],
    ["waitlist", "Waitlist", "Inbox item 2"],
    ["onboarding", "Onboarding", "First-run flow"],
  ]
  return (
    <div
      className="moderator-layer"
      data-fp-moderator=""
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="moderator-sheet">
        <div className="grabber" />
        <header>
          <div>
            <span>DEMO CONTROLS</span>
            <h2>Moderator</h2>
          </div>
          <b>v2.5</b>
        </header>
        <button
          className="moderator-reset"
          onClick={() => {
            resetDemo()
            onJump("home")
          }}
        >
          <Icon name="activity" size={18} />
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
              <strong>Planted error</strong>
              <small>
                {plantedError
                  ? "MIMS 2027 · Aug resume"
                  : "MIMS 2028 · Profile"}
              </small>
            </span>
            <Toggle
              checked={plantedError}
              onChange={setPlantedError}
              label="Planted error"
            />
          </label>
          <label>
            <span>
              <strong>“Form changed” error</strong>
              <small>Show during preparation</small>
            </span>
            <Toggle
              checked={formChangedError}
              onChange={setFormChangedError}
              label="Form changed error"
            />
          </label>
          <label>
            <span>
              <strong>“Can’t reach form” error</strong>
              <small>Show during submission</small>
            </span>
            <Toggle
              checked={cantReachFormError}
              onChange={setCantReachFormError}
              label="Can't reach form error"
            />
          </label>
        </div>
        <FootprintsPanel prototype="assistant" />
        <button className="moderator-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  )
}

function EmailSourceSheet({ onClose }: { onClose: () => void }) {
  const email = appData.careerNight.email
  return (
    <Sheet onClose={onClose}>
      <div className="email-sheet-heading">
        <div className="sheet-icon">
          <Icon name="inbox" size={24} />
        </div>
        <div>
          <span>ORIGINAL EMAIL</span>
          <strong>{email.sender}</strong>
          <small>
            {email.address} · {email.received}
          </small>
        </div>
      </div>
      <div className="original-email">
        <h3>{email.subject}</h3>
        <p>{email.greeting}</p>
        <p>{email.intro}</p>
        <mark>
          Thu Nov 19 · 6:00-8:00pm
          <br />
          Career Center Rm 110
        </mark>
        <p>
          Meet product design teams from{" "}
          <mark>Figma, Adobe, Notion, Airbnb, and LinkedIn</mark>.
        </p>
        <mark>Register by Mon Nov 16. Bring 3 printed resumes.</mark>
        <p className="email-closing">{email.closing}</p>
      </div>
      <button className="secondary-button" onClick={onClose}>
        Close
      </button>
    </Sheet>
  )
}

function ReminderChoiceSheet({
  onClose,
  onChoose,
}: {
  onClose: () => void
  onChoose: (label: string) => void
}) {
  const options = [
    { display: "Tonight 8:00pm", label: "Tonight 8:00pm" },
    { display: "Tomorrow 9:00am", label: "Tomorrow 9:00am" },
    {
      display: "Mon Nov 16 9:00am",
      detail: "Before registration closes",
      label: "Mon 9:00am",
    },
  ]
  return (
    <Sheet onClose={onClose}>
      <div className="sheet-icon event-amber">
        <Icon name="activity" size={24} />
      </div>
      <h2>When should I remind you?</h2>
      <div className="reminder-options">
        {options.map((option) => (
          <button onClick={() => onChoose(option.label)} key={option.display}>
            <span>
              <strong>{option.display}</strong>
              {option.detail && <small>{option.detail}</small>}
            </span>
            <Icon name="chevron" size={18} />
          </button>
        ))}
      </div>
      <button className="secondary-button" onClick={onClose}>
        Cancel
      </button>
    </Sheet>
  )
}

function CareerDetail({
  onBack,
  onRegister,
}: {
  onBack: () => void
  onRegister: () => void
}) {
  const [showEmail, setShowEmail] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const { autonomy, remindCareerNight, dismissCareerNight } = useStore()
  const event = appData.careerNight
  return (
    <main className="flow-screen">
      <FlowHeader title="Request details" onBack={onBack} />
      <div className="flow-scroll career-detail">
        <div className="request-label">
          <span className="sparkle">
            <Icon name="sparkle" size={17} />
          </span>
          <span>
            <strong>I found an event for you</strong>
            <small>Review before anything happens</small>
          </span>
        </div>
        <h1>Product Design Career Night</h1>
        <section className="event-detail-card">
          <div className="event-date-block">
            <span>NOV</span>
            <strong>19</strong>
            <small>THU</small>
          </div>
          <div className="event-facts">
            <strong>{event.date}</strong>
            <span>{event.time}</span>
            <span>{event.location}</span>
          </div>
          <div className="event-deadline">
            Registration closes {event.registrationDeadline}
          </div>
          <div className="employer-list">
            <small>EMPLOYERS ATTENDING</small>
            <p>{event.employers.slice(0, 5).join(" · ")}</p>
          </div>
          <div className="bring-note">
            <Icon name="checklist" size={18} />
            <span>{event.note}</span>
          </div>
        </section>
        <div className="flag-reason">
          <Icon name="sparkle" size={18} />
          <p>
            <strong>Why I flagged this</strong>
            {event.reason}
          </p>
        </div>
        <button
          className="email-source-button"
          onClick={() => setShowEmail(true)}
        >
          <span>
            <SourceChip source="Email" />
            <strong>Career Center email - 9:58am</strong>
          </span>
          <Icon name="chevron" size={18} />
        </button>
        <div className="flow-actions">
          <button className="primary-button" onClick={onRegister}>
            Register me
          </button>
          <button
            className="secondary-button"
            onClick={() => setShowReminder(true)}
          >
            Remind me later
          </button>
          <button
            className="text-button"
            onClick={() => {
              dismissCareerNight()
              onBack()
            }}
          >
            Not interested
          </button>
          <p>
            <Icon name="lock" size={14} />
            {autonomy.eventRegistrations === "doAndTell"
              ? "I’ll only ask for the missing employer choice."
              : "Nothing will be submitted without your review."}
          </p>
        </div>
      </div>
      {showEmail && <EmailSourceSheet onClose={() => setShowEmail(false)} />}
      {showReminder && (
        <ReminderChoiceSheet
          onClose={() => setShowReminder(false)}
          onChoose={(label) => {
            remindCareerNight(label)
            setShowReminder(false)
            onBack()
          }}
        />
      )}
    </main>
  )
}

function PreparingRegistration({ onDone }: { onDone: () => void }) {
  const { formChangedError } = useStore()
  const [completed, setCompleted] = useState(0)
  const steps = [
    "Opening the RSVP form",
    "Reading 7 fields",
    "Filling what I know",
  ]

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setCompleted(1), 350),
      window.setTimeout(() => setCompleted(2), 800),
      window.setTimeout(() => setCompleted(3), 1250),
    ]
    if (!formChangedError) timers.push(window.setTimeout(onDone, 2100))
    return () => timers.forEach(window.clearTimeout)
  }, [formChangedError, onDone])

  return (
    <main className="preparing-screen">
      <div className="preparing-orbit">
        <span>
          <Icon name="sparkle" size={27} />
        </span>
        <i />
      </div>
      <h1>Preparing your registration</h1>
      <p>I’ll fill what I can, then ask you for anything missing.</p>
      <div className={`preparing-steps ${completed < 3 ? "is-loading" : ""}`}>
        {steps.map((step, index) => (
          <div className={completed > index ? "complete" : ""} key={step}>
            <span>
              {completed > index ? <Icon name="check" size={16} /> : <i />}
            </span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
      {completed < 3 && (
        <div className="skeleton-lines" aria-hidden="true">
          <span />
          <span />
        </div>
      )}
      {completed === 3 && !formChangedError && (
        <div className="preparing-result">
          <strong>I filled 6 of 7.</strong>
          <span>I need you for one.</span>
        </div>
      )}
      {completed === 3 && formChangedError && (
        <div className="flow-error-card">
          <span className="error-symbol">!</span>
          <div>
            <strong>The form changed</strong>
            <p>A new required field: Expected graduation month</p>
            <span className="suggestion-chip">
              May 2028 <small>from your profile</small>
            </span>
          </div>
          <button onClick={onDone}>Use this & continue</button>
        </div>
      )}
    </main>
  )
}

function FieldSourceChip({ field }: { field: RegistrationField }) {
  const edited = field.sourceLabel === "Edited by you"
  return (
    <span
      className={`field-source ${
        edited ? "field-source-edited" : sourceStyles[field.source]
      }`}
    >
      {field.sourceLabel}
    </span>
  )
}

function EditFieldSheet({
  field,
  onClose,
}: {
  field: RegistrationField
  onClose: () => void
}) {
  const { updateRegistrationField } = useStore()
  const [value, setValue] = useState(field.value)
  return (
    <Sheet onClose={onClose}>
      <span className="sheet-kicker">EDIT FIELD</span>
      <h2>{field.label}</h2>
      <div className="edit-source-row">
        <span>Current source</span>
        <FieldSourceChip field={field} />
      </div>
      {field.id === "program" && (
        <div className="source-context">
          <p>
            <strong>Your profile says</strong>
            MIMS 2028
          </p>
          <p>
            <strong>Your Oct resume says</strong>
            MIMS 2028
          </p>
        </div>
      )}
      <label className="edit-field-input">
        <span>Value</span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <button
        className="primary-button"
        disabled={!value.trim()}
        onClick={() => {
          updateRegistrationField(field.id, value.trim())
          onClose()
        }}
      >
        Save
      </button>
    </Sheet>
  )
}

function EmployerOnlyQuestion({ onContinue }: { onContinue: () => void }) {
  const { selectedEmployers, toggleEmployer } = useStore()
  return (
    <main className="flow-screen employer-only-screen">
      <div className="flow-scroll employer-only-scroll">
        <span className="needs-you-label">NEEDS YOU</span>
        <h1>Which employers do you want to meet?</h1>
        <p>I filled everything else using your saved profile and documents.</p>
        <div className="employer-options employer-only-options">
          {appData.careerNight.employers.map((employer) => (
            <button
              className={selectedEmployers.includes(employer) ? "selected" : ""}
              onClick={() => toggleEmployer(employer)}
              key={employer}
            >
              {selectedEmployers.includes(employer) && (
                <Icon name="check" size={14} />
              )}
              {employer}
            </button>
          ))}
        </div>
        <div className="automatic-summary">
          <Icon name="sparkle" size={18} />
          <span>
            <strong>Everything else is ready</strong>
            I’ll submit after you answer this one question.
          </span>
        </div>
        <button
          className="primary-button"
          disabled={selectedEmployers.length === 0}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </main>
  )
}

function RegistrationForm({
  onBack,
  onReview,
}: {
  onBack: () => void
  onReview: () => void
}) {
  const { registrationFields, selectedEmployers, toggleEmployer } = useStore()
  const [editing, setEditing] = useState<RegistrationField | null>(null)
  const event = appData.careerNight
  return (
    <main className="flow-screen registration-screen">
      <FlowHeader title="Registration" onBack={onBack} />
      <div className="registration-summary">
        <span className="summary-date">NOV 19</span>
        <span>
          <strong>Product Design Career Night</strong>
          <small>6:00-8:00pm · Career Center</small>
        </span>
      </div>
      <div className="flow-scroll registration-scroll">
        <div className="form-intro">
          <span className="success-circle">
            <Icon name="check" size={17} />
          </span>
          <div>
            <h1>Here’s what I’ll fill in</h1>
            <p>Check any value and complete the one missing field.</p>
          </div>
        </div>
        <div className="registration-fields">
          {registrationFields.slice(0, 5).map((field) => (
            <button
              className="registration-field"
              onClick={() => setEditing(field)}
              key={field.id}
            >
              <span>
                <small>{field.label}</small>
                <strong>{field.value}</strong>
                <FieldSourceChip field={field} />
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
          <section className="employer-field">
            <div>
              <span>
                <small>Which employers do you want to meet?</small>
                {selectedEmployers.length === 0 && <b>Needs you</b>}
              </span>
              {selectedEmployers.length > 0 && (
                <strong>{selectedEmployers.join(", ")}</strong>
              )}
            </div>
            <div className="employer-options">
              {event.employers.map((employer) => (
                <button
                  className={
                    selectedEmployers.includes(employer) ? "selected" : ""
                  }
                  onClick={() => toggleEmployer(employer)}
                  key={employer}
                >
                  {selectedEmployers.includes(employer) && (
                    <Icon name="check" size={13} />
                  )}
                  {employer}
                </button>
              ))}
            </div>
          </section>
          {registrationFields.slice(5).map((field) => (
            <button
              className="registration-field"
              onClick={() => setEditing(field)}
              key={field.id}
            >
              <span>
                <small>{field.label}</small>
                <strong>{field.value}</strong>
                <FieldSourceChip field={field} />
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
        <button
          className="primary-button form-review-button"
          disabled={selectedEmployers.length === 0}
          onClick={onReview}
        >
          Review
        </button>
        {selectedEmployers.length === 0 && (
          <p className="form-help">Pick at least one employer to continue.</p>
        )}
      </div>
      {editing && (
        <EditFieldSheet field={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}

function EmployerEditSheet({ onClose }: { onClose: () => void }) {
  const { selectedEmployers, toggleEmployer } = useStore()
  return (
    <Sheet onClose={onClose}>
      <span className="sheet-kicker">EDIT FIELD</span>
      <h2>Employers to meet</h2>
      <div className="employer-options employer-edit-options">
        {appData.careerNight.employers.map((employer) => (
          <button
            className={selectedEmployers.includes(employer) ? "selected" : ""}
            onClick={() => toggleEmployer(employer)}
            key={employer}
          >
            {selectedEmployers.includes(employer) && (
              <Icon name="check" size={13} />
            )}
            {employer}
          </button>
        ))}
      </div>
      <button
        className="primary-button"
        disabled={selectedEmployers.length === 0}
        onClick={onClose}
      >
        Save
      </button>
    </Sheet>
  )
}

function HoldToApproveButton({
  onComplete,
  label = "Approve & send",
}: {
  onComplete: () => void
  label?: string
}) {
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

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  return (
    <button
      className={`hold-button ${holding ? "holding" : ""}`}
      aria-label="Approve and send, press and hold"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault()
          start()
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault()
          stop()
        }
      }}
    >
      <span className="hold-ring">
        <Icon name="check" size={15} />
      </span>
      <span>
        <strong>{label}</strong>
        <small>Press and hold for 1 second</small>
      </span>
    </button>
  )
}

type ConflictChoice = "message-team" | "arrive-late" | "skip"

function ReviewRegistration({
  onBack,
  onProceed,
  onSkipped,
}: {
  onBack: () => void
  onProceed: (choice: Exclude<ConflictChoice, "skip">) => void
  onSkipped: () => void
}) {
  const {
    registrationFields,
    selectedEmployers,
    skipCareerRegistration,
    autonomy,
  } = useStore()
  const [choice, setChoice] = useState<ConflictChoice>("message-team")
  const [editing, setEditing] = useState<RegistrationField | null>(null)
  const [editingEmployers, setEditingEmployers] = useState(false)
  const about = registrationFields.slice(0, 5)
  const dietary = registrationFields.find((field) => field.id === "dietary")!

  const approve = () => {
    if (choice === "skip") {
      skipCareerRegistration()
      onSkipped()
    } else {
      onProceed(choice)
    }
  }

  const ReviewRow = ({ field }: { field: RegistrationField }) => (
    <div className="review-data-row">
      <span>
        <small>{field.label}</small>
        <strong>{field.value}</strong>
        <FieldSourceChip field={field} />
      </span>
      <button onClick={() => setEditing(field)}>Edit</button>
    </div>
  )

  return (
    <main className="flow-screen review-screen">
      <FlowHeader title="Review" onBack={onBack} />
      <div className="flow-scroll review-scroll">
        <h1>Here’s exactly what I’ll send to the Career Center</h1>
        {autonomy.eventRegistrations === "askIfPersonal" && (
          <div className="setting-explanation">
            <Icon name="lock" size={16} />
            Asking because this sends your personal info (your setting)
          </div>
        )}
        <section className="review-group">
          <h2>About you</h2>
          {about.map((field) => (
            <ReviewRow field={field} key={field.id} />
          ))}
        </section>
        <section className="review-group">
          <h2>For this event</h2>
          <div className="review-data-row">
            <span>
              <small>Employers to meet</small>
              <strong>{selectedEmployers.join(", ")}</strong>
              <span className="field-source field-source-edited">
                Selected by you
              </span>
            </span>
            <button onClick={() => setEditingEmployers(true)}>Edit</button>
          </div>
          <ReviewRow field={dietary} />
          {choice === "arrive-late" && (
            <div className="review-data-row">
              <span>
                <small>Note to organizer</small>
                <strong>Arriving at 7:00pm</strong>
                <span className="field-source field-source-edited">
                  Added by you
                </span>
              </span>
            </div>
          )}
        </section>
        <section className="also-do">
          <h2>What I’ll also do</h2>
          <div>
            <span className="also-icon calendar">
              <Icon name="calendar" size={18} />
            </span>
            <p>
              <strong>Add to calendar</strong>
              Thu Nov 19 · 6:00-8:00pm
            </p>
          </div>
          <div>
            <span className="also-icon reminder">
              <Icon name="checklist" size={18} />
            </span>
            <p>
              <strong>Set a reminder · Thu 5:15pm</strong>
              Bring 3 printed resumes
            </p>
          </div>
          <p className="nothing-else">
            <Icon name="lock" size={14} />
            Nothing else is shared.
          </p>
        </section>
        <section className="conflict-card">
          <div className="conflict-heading">
            <Icon name="calendar" size={19} />
            <p>
              <strong>Overlaps INFO 213 team sync</strong>
              Thu 6:00-7:00pm <span>(Calendar)</span>
            </p>
          </div>
          <div className="radio-options">
            {[
              ["message-team", "Register, and draft a message to my team"],
              ["arrive-late", "Register, and note I’ll arrive at 7:00pm"],
              ["skip", "Don’t register"],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="conflict"
                  checked={choice === value}
                  onChange={() => setChoice(value as ConflictChoice)}
                />
                <span />
                {label}
              </label>
            ))}
          </div>
        </section>
        {choice === "skip" ? (
          <button
            className="primary-button skip-event-button"
            onClick={approve}
          >
            Skip this event
          </button>
        ) : (
          <HoldToApproveButton onComplete={approve} />
        )}
        <button className="secondary-button review-back" onClick={onBack}>
          Back
        </button>
      </div>
      {editing && (
        <EditFieldSheet field={editing} onClose={() => setEditing(null)} />
      )}
      {editingEmployers && (
        <EmployerEditSheet onClose={() => setEditingEmployers(false)} />
      )}
    </main>
  )
}

function TeamMessageSheet({
  onSend,
  onSkip,
}: {
  onSend: (message: string) => void
  onSkip: (message: string) => void
}) {
  const [message, setMessage] = useState(
    "Hi team! I've got Career Night Thu 6:00-8:00pm. Could we move our sync to Thu 5:00pm or Fri morning?",
  )
  return (
    <Sheet onClose={() => onSkip(message)}>
      <span className="sheet-kicker">DRAFT MESSAGE</span>
      <h2>Check the note to your team</h2>
      <div className="message-to">
        <span>To</span>
        <strong>INFO 213 team</strong>
        <SourceChip source="WhatsApp" />
      </div>
      <label className="message-draft">
        <span>Message</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <button className="primary-button" onClick={() => onSend(message)}>
        Send
      </button>
      <button className="text-button" onClick={() => onSkip(message)}>
        Skip, I’ll tell them myself
      </button>
    </Sheet>
  )
}

function SubmittingRegistration({ onDone }: { onDone: () => void }) {
  const { cantReachFormError } = useStore()
  const [completed, setCompleted] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [showBrowser, setShowBrowser] = useState(false)
  const steps = ["Submitting", "Adding to your calendar", "Setting a reminder"]
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setCompleted(1), 350),
      window.setTimeout(() => setCompleted(2), 850),
      window.setTimeout(() => setCompleted(3), 1350),
    ]
    if (!cantReachFormError) timers.push(window.setTimeout(onDone, 2050))
    return () => timers.forEach(window.clearTimeout)
  }, [cantReachFormError, onDone])
  return (
    <main className="preparing-screen submitting-screen">
      <div className="preparing-orbit">
        <span>
          <Icon name="sparkle" size={27} />
        </span>
        <i />
      </div>
      <h1>Registering you</h1>
      <p>I’m completing only the actions you just approved.</p>
      <div className={`preparing-steps ${completed < 3 ? "is-loading" : ""}`}>
        {steps.map((step, index) => (
          <div className={completed > index ? "complete" : ""} key={step}>
            <span>
              {completed > index ? <Icon name="check" size={16} /> : <i />}
            </span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
      {completed < 3 && (
        <div className="skeleton-lines" aria-hidden="true">
          <span />
          <span />
        </div>
      )}
      {completed === 3 && cantReachFormError && (
        <div className="flow-error-card reach-error">
          <span className="error-symbol">!</span>
          <div>
            <strong>I couldn’t reach the form.</strong>
            <p>The Career Center page may be temporarily unavailable.</p>
          </div>
          <button
            onClick={() => {
              setRetrying(true)
              window.setTimeout(onDone, 700)
            }}
          >
            {retrying ? "Trying again…" : "Try again"}
          </button>
          <button
            className="error-secondary"
            onClick={() => setShowBrowser(true)}
          >
            Open the form myself
          </button>
        </div>
      )}
      {showBrowser && (
        <SimulatedBrowserCard
          title="Career Center RSVP"
          onClose={() => setShowBrowser(false)}
          onContinue={onDone}
        />
      )}
    </main>
  )
}

function CancelRegistrationSheet({
  onClose,
  onCancelled,
}: {
  onClose: () => void
  onCancelled?: () => void
}) {
  const { cancelCareerRegistration } = useStore()
  return (
    <Sheet onClose={onClose}>
      <div className="sheet-icon cancel-icon">
        <Icon name="calendar" size={24} />
      </div>
      <h2>Cancel your Career Night registration?</h2>
      <p className="sheet-detail">
        I’ll send a cancellation and remove the calendar event and reminder.
      </p>
      <button
        className="danger-button"
        onClick={() => {
          cancelCareerRegistration()
          onClose()
          onCancelled?.()
        }}
      >
        Cancel registration
      </button>
      <button className="secondary-button" onClick={onClose}>
        Keep it
      </button>
    </Sheet>
  )
}

function ActivityDetailSheet({ onClose }: { onClose: () => void }) {
  const { submission } = useStore()
  if (!submission) return null
  return (
    <Sheet onClose={onClose}>
      <span className="sheet-kicker">ACTIVITY DETAILS</span>
      <h2>Career Center RSVP form</h2>
      <div className="confirmation-number compact">
        <span>CONFIRMATION</span>
        <strong>{submission.confirmationNumber}</strong>
      </div>
      <div className="submitted-data">
        {submission.fields.map((field) => (
          <div key={field.id}>
            <span>
              <small>{field.label}</small>
              <strong>{field.value}</strong>
            </span>
            <FieldSourceChip field={field} />
          </div>
        ))}
        <div>
          <span>
            <small>Employers to meet</small>
            <strong>{submission.employers.join(", ")}</strong>
          </span>
          <span className="field-source field-source-edited">
            Selected by you
          </span>
        </div>
        {submission.organizerNote && (
          <div>
            <span>
              <small>Note to organizer</small>
              <strong>{submission.organizerNote}</strong>
            </span>
            <span className="field-source field-source-edited">
              Added by you
            </span>
          </div>
        )}
      </div>
      <p className="submitted-footer">
        Sent to Career Center RSVP form · {submission.submittedAt}
      </p>
      <button className="secondary-button" onClick={onClose}>
        Close
      </button>
    </Sheet>
  )
}

function RegistrationConfirmation({
  onDone,
  onSeeActivity,
}: {
  onDone: () => void
  onSeeActivity: () => void
}) {
  const { submission, registrationStatus, cancelCareerRegistration } =
    useStore()
  const [showEmail, setShowEmail] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showSentValues, setShowSentValues] = useState(false)
  if (!submission) return null
  const automatic = submission.conflictChoice === "automatic"
  return (
    <main className="flow-screen">
      <div className="flow-scroll confirmation-screen">
        <div className="confirmation-check">
          <Icon name="check" size={28} />
        </div>
        <h1>
          {automatic ? "Done. Here's exactly what I sent" : "You’re registered"}
        </h1>
        <p>Product Design Career Night</p>
        <div className="confirmation-number">
          <span>CONFIRMATION NUMBER</span>
          <strong>{submission.confirmationNumber}</strong>
        </div>
        {automatic && (
          <div className="sent-values-disclosure">
            <button
              aria-expanded={showSentValues}
              onClick={() => setShowSentValues((current) => !current)}
            >
              <span>Every value sent</span>
              <Icon
                name="chevron"
                size={18}
                className={showSentValues ? "rotated" : ""}
              />
            </button>
            {showSentValues && (
              <div className="submitted-data automatic-sent-data">
                {submission.fields.map((field) => (
                  <div key={field.id}>
                    <span>
                      <small>{field.label}</small>
                      <strong>{field.value}</strong>
                    </span>
                    <FieldSourceChip field={field} />
                  </div>
                ))}
                <div>
                  <span>
                    <small>Employers to meet</small>
                    <strong>{submission.employers.join(", ")}</strong>
                  </span>
                  <span className="field-source field-source-edited">
                    Selected by you
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="confirmation-cards">
          <div>
            <Icon name="calendar" size={20} />
            <p>
              <strong>Added to calendar</strong>
              Thu Nov 19 · 6:00-8:00pm
            </p>
          </div>
          <div>
            <Icon name="checklist" size={20} />
            <p>
              <strong>Reminder · Thu 5:15pm</strong>
              Bring 3 printed resumes
            </p>
          </div>
          {submission.teamMessageSent && (
            <div>
              <Icon name="people" size={20} />
              <p>
                <strong>Team message sent</strong>
                INFO 213 team · WhatsApp
              </p>
            </div>
          )}
          {submission.organizerNote && (
            <div>
              <Icon name="checklist" size={20} />
              <p>
                <strong>Note to organizer</strong>
                {submission.organizerNote}
              </p>
            </div>
          )}
        </div>
        <div className="confirmation-links">
          <button onClick={() => setShowEmail(true)}>
            Original announcement <Icon name="chevron" size={17} />
          </button>
          <button onClick={onSeeActivity}>
            See it in Activity <Icon name="chevron" size={17} />
          </button>
        </div>
        {registrationStatus === "registered" && !automatic && (
          <>
            <p className="cancel-until">You can cancel until Wed Nov 18</p>
            <button className="cancel-link" onClick={() => setShowCancel(true)}>
              Cancel registration
            </button>
          </>
        )}
        {automatic && registrationStatus === "registered" && (
          <button
            className="undo-registration-button"
            onClick={() => {
              cancelCareerRegistration()
              onDone()
            }}
          >
            Undo
          </button>
        )}
        <button className="primary-button confirmation-done" onClick={onDone}>
          Done
        </button>
      </div>
      {showEmail && <EmailSourceSheet onClose={() => setShowEmail(false)} />}
      {showCancel && (
        <CancelRegistrationSheet
          onClose={() => setShowCancel(false)}
          onCancelled={onDone}
        />
      )}
    </main>
  )
}

function Sheet({
  children,
  onClose,
}: {
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="sheet-layer"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section className="sheet" role="dialog" aria-modal="true">
        <div className="grabber" />
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={21} />
        </button>
        {children}
      </section>
    </div>
  )
}

function ReviewSheet({
  item,
  onClose,
}: {
  item: InboxItem
  onClose: () => void
}) {
  const { approve } = useStore()
  const isPending = item.status === "needs-ok"
  return (
    <Sheet onClose={onClose}>
      <div className="sheet-icon">
        <Icon name={item.icon} size={25} />
      </div>
      <SourceChip source={item.source} />
      <h2>{item.title}</h2>
      <p className="sheet-detail">{item.detail}</p>
      {item.meta && <p className="sheet-meta">{item.meta}</p>}
      <div className="action-preview">
        <span>
          <Icon name="sparkle" size={18} />
        </span>
        <div>
          <small>PROPOSED ACTION</small>
          <strong>{item.proposal}</strong>
        </div>
      </div>
      <div className="control-note">
        <Icon name="lock" size={15} />
        Nothing happens until you approve.
      </div>
      {isPending ? (
        <button
          className="primary-button"
          onClick={() => {
            approve(item.id)
            onClose()
          }}
        >
          Approve action
        </button>
      ) : (
        <button className="secondary-button" onClick={onClose}>
          Done
        </button>
      )}
    </Sheet>
  )
}

function EventSheet({
  event,
  onClose,
}: {
  event: CalendarEvent
  onClose: () => void
}) {
  const { registrationStatus } = useStore()
  const [showCancel, setShowCancel] = useState(false)
  const canCancel =
    event.id === "career-cal" && registrationStatus === "registered"
  return (
    <>
      <Sheet onClose={onClose}>
        <div className={`sheet-icon event-${event.color}`}>
          <Icon
            name={event.kind === "deadline" ? "book" : "calendar"}
            size={25}
          />
        </div>
        <SourceChip source={event.source} />
        <h2>{event.title}</h2>
        <p className="sheet-detail">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][event.day]} Nov{" "}
          {event.week ? event.day + 16 : event.day + 9} ·{" "}
          {event.kind === "deadline"
            ? `Due ${formatHour(event.start)}`
            : `${formatHour(event.start)}-${formatHour(event.end)}`}
        </p>
        {event.detail && <p className="sheet-meta">{event.detail}</p>}
        {event.approvalLabel && (
          <div className="assistant-added-chip">
            <Icon name="sparkle" size={14} />
            {event.approvalLabel}
          </div>
        )}
        {canCancel && (
          <button
            className="cancel-link event-cancel"
            onClick={() => setShowCancel(true)}
          >
            Cancel registration
          </button>
        )}
        <button className="secondary-button" onClick={onClose}>
          Close
        </button>
      </Sheet>
      {showCancel && (
        <CancelRegistrationSheet
          onClose={() => setShowCancel(false)}
          onCancelled={onClose}
        />
      )}
    </>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
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

type SettingsRoute = "root" | "autonomy" | "sources" | "profile" | "privacy" | "notifications"

function SettingsRoot({
  onBack,
  onNavigate,
}: {
  onBack: () => void
  onNavigate: (route: SettingsRoute) => void
}) {
  const { assistantPaused, connectedSources, setAssistantPaused } = useStore()
  const rows: {
    id: SettingsRoute
    title: string
    detail: string
    icon: string
  }[] = [
    {
      id: "autonomy",
      title: "How much I do on my own",
      detail: "Choose when I should ask",
      icon: "sparkle",
    },
    {
      id: "sources",
      title: "Connected sources",
      detail: `${connectedSources.filter((source) => source.connected).length} sources connected`,
      icon: "inbox",
    },
    {
      id: "profile",
      title: "Profile & documents",
      detail: "Personal details and resumes",
      icon: "people",
    },
    {
      id: "privacy",
      title: "Privacy & data",
      detail: "See and manage what I read",
      icon: "lock",
    },
    {
      id: "notifications",
      title: "Notifications",
      detail: "Control alerts and updates",
      icon: "activity",
    },
  ]
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Settings" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <div className="settings-profile">
          <div className="profile-large">{appData.user.initials}</div>
          <div>
            <strong>{appData.user.name}</strong>
            <span>{appData.user.program}</span>
          </div>
        </div>
        <section className="pause-card">
          <div>
            <strong>Pause the assistant</strong>
            <span>
              {assistantPaused
                ? "I won’t read or suggest anything"
                : "I’m actively looking for ways to help"}
            </span>
          </div>
          <Toggle
            checked={assistantPaused}
            onChange={setAssistantPaused}
            label="Pause the assistant"
          />
        </section>
        <div className="settings-list">
          {rows.map((row) => (
            <button onClick={() => onNavigate(row.id)} key={row.id}>
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
          Nothing is sent without the permission level you choose.
        </p>
      </div>
    </main>
  )
}

function AutonomySettings({ onBack }: { onBack: () => void }) {
  const { autonomy, setAutonomyChoice } = useStore()
  const cards = [
    {
      id: "eventRegistrations" as const,
      title: "Event registrations",
      choices: [
        ["alwaysAsk", "Always ask"],
        ["askIfPersonal", "Ask if it sends personal info"],
        ["doAndTell", "Do it and tell me"],
      ] as const,
      previews: {
        alwaysAsk: "Career Night: I’d ask you before sending",
        askIfPersonal: "I’d ask when a registration shares personal info",
        doAndTell: "I’d register, then tell you exactly what I sent",
      },
    },
    {
      id: "meetingScheduling" as const,
      title: "Meeting scheduling",
      choices: [
        ["alwaysAsk", "Always ask"],
        ["doAndTell", "Do it and tell me"],
      ] as const,
      previews: {
        alwaysAsk: "Team meeting: I’d ask before confirming a time",
        askIfPersonal: "",
        doAndTell: "I’d choose an open time and tell you",
      },
    },
    {
      id: "calendarEntries" as const,
      title: "Calendar entries & reminders",
      choices: [
        ["alwaysAsk", "Always ask"],
        ["doAndTell", "Do it and tell me"],
      ] as const,
      previews: {
        alwaysAsk: "Deadline found: I’d ask before adding it",
        askIfPersonal: "",
        doAndTell: "Deadline found: I’d add it and tell you",
      },
    },
  ]
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="How much I do on my own" onBack={onBack} />
      <div className="flow-scroll settings-scroll autonomy-scroll">
        <p className="settings-intro">
          Set a default for each kind of task. You can still change your mind
          every time.
        </p>
        {cards.map((card) => (
          <section className="autonomy-card" key={card.id}>
            <h2>{card.title}</h2>
            <div className="autonomy-options">
              {card.choices.map(([value, label]) => (
                <button
                  className={autonomy[card.id] === value ? "selected" : ""}
                  onClick={() => setAutonomyChoice(card.id, value)}
                  key={value}
                >
                  <span />
                  <strong>{label}</strong>
                </button>
              ))}
            </div>
            <p>
              <Icon name="sparkle" size={14} />
              {card.previews[autonomy[card.id]]}
            </p>
          </section>
        ))}
        <section className="autonomy-card locked-autonomy">
          <div>
            <h2>Forms with personal or financial info</h2>
            <Icon name="lock" size={17} />
          </div>
          <div className="locked-choice">Always ask</div>
          <p>
            <Icon name="lock" size={14} />
            I’ll always ask for these
          </p>
        </section>
      </div>
    </main>
  )
}

function DisconnectSourceSheet({
  name,
  onClose,
  onConfirm,
}: {
  name: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="sheet-icon cancel-icon">
        <Icon name="inbox" size={24} />
      </div>
      <h2>Disconnect {name}?</h2>
      <p className="sheet-detail">
        I’ll stop reading new information from this source. Existing activity
        stays in your history.
      </p>
      <button className="danger-button" onClick={onConfirm}>
        Disconnect
      </button>
      <button className="secondary-button" onClick={onClose}>
        Keep connected
      </button>
    </Sheet>
  )
}

function ConnectedSourcesSettings({ onBack }: { onBack: () => void }) {
  const { connectedSources, disconnectSource, connectSource } = useStore()
  const [disconnecting, setDisconnecting] =
    useState<typeof connectedSources[number] | null>(null)
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Connected sources" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <p className="settings-intro">
          Sources are read-only unless you explicitly approve an action.
        </p>
        <div className="source-settings-list">
          {connectedSources.map((source) => (
            <section key={source.id}>
              <div className={`source-logo ${sourceStyles[source.source]}`}>
                <Icon
                  name={source.id === "calendar" ? "calendar" : "inbox"}
                  size={20}
                />
              </div>
              <div>
                <strong>{source.name}</strong>
                {source.detail && <small>{source.detail}</small>}
                <span>
                  <i className={source.connected ? "connected" : ""} />
                  {source.connected ? "Connected" : "Disconnected"} · Last read{" "}
                  {source.lastRead}
                </span>
              </div>
              {source.connected ? (
                <button onClick={() => setDisconnecting(source)}>
                  Disconnect
                </button>
              ) : (
                <button
                  className="reconnect-button"
                  onClick={() => connectSource(source.id)}
                >
                  Reconnect
                </button>
              )}
            </section>
          ))}
        </div>
      </div>
      {disconnecting && (
        <DisconnectSourceSheet
          name={disconnecting.name}
          onClose={() => setDisconnecting(null)}
          onConfirm={() => {
            disconnectSource(disconnecting.id)
            setDisconnecting(null)
          }}
        />
      )}
    </main>
  )
}

function ProfileSettings({ onBack }: { onBack: () => void }) {
  const { currentResume, setCurrentResume } = useStore()
  const profile = appData.settings.profile
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Profile & documents" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <section className="profile-settings-card">
          <div className="profile-large">{appData.user.initials}</div>
          {[
            ["Name", profile.name],
            ["Email", profile.email],
            ["Program", profile.program],
            ["LinkedIn", profile.linkedin],
          ].map(([label, value]) => (
            <div className="profile-data" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <div className="profile-data interests-data">
            <span>Interests</span>
            <div>
              {profile.interests.map((interest) => (
                <b key={interest}>{interest}</b>
              ))}
            </div>
          </div>
        </section>
        <h2 className="settings-section-title">Resumes</h2>
        <div className="resume-list">
          {profile.resumes.map((resume) => {
            const current = currentResume === resume.id
            return (
              <section key={resume.id}>
                <span className="resume-icon">
                  <Icon name="book" size={20} />
                </span>
                <div>
                  <strong>{resume.name}</strong>
                  <small>
                    {resume.id === "oct"
                      ? `(newer${current ? ", current" : ""})`
                      : `(older${
                          current ? ", current" : ""
                        }, says ${resume.detail})`}
                  </small>
                </div>
                {current ? (
                  <span className="current-label">Current</span>
                ) : (
                  <button onClick={() => setCurrentResume(resume.id)}>
                    Set as current
                  </button>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}

function DeleteDataSheet({ onClose }: { onClose: () => void }) {
  const { deleteAssistantData } = useStore()
  return (
    <Sheet onClose={onClose}>
      <div className="sheet-icon cancel-icon">
        <Icon name="lock" size={23} />
      </div>
      <h2>Delete your assistant data?</h2>
      <p className="sheet-detail">
        I’ll delete connected data, history and preferences. This can’t be
        undone.
      </p>
      <button
        className="danger-button"
        onClick={() => {
          deleteAssistantData()
          onClose()
        }}
      >
        Delete my data
      </button>
      <button className="secondary-button" onClick={onClose}>
        Keep my data
      </button>
    </Sheet>
  )
}

function PrivacySettings({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Privacy & data" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <section className="privacy-summary-card">
          <button
            className="privacy-summary-toggle"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
          >
            <span className="settings-list-icon">
              <Icon name="book" size={20} />
            </span>
            <div>
              <strong>What I read this week</strong>
              <p>12 emails, 3 bCourses items</p>
            </div>
            <Icon
              name="chevron"
              size={18}
              className={expanded ? "rotated" : ""}
            />
          </button>
          {expanded && (
            <div className="read-list">
              {appData.settings.privacyReads.map((item) => (
                <div className="read-item" key={item.title}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.time}</small>
                  </span>
                  <SourceChip source={item.source} />
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="data-promise">
          <Icon name="lock" size={22} />
          <div>
            <h2>Your data is used only to do things for you</h2>
            <p>
              It isn’t used for advertising, sold, or shared beyond actions you
              approve.
            </p>
          </div>
        </section>
        <button
          className="delete-data-button"
          onClick={() => setShowDelete(true)}
        >
          Delete my data
        </button>
      </div>
      {showDelete && <DeleteDataSheet onClose={() => setShowDelete(false)} />}
    </main>
  )
}

function NotificationSettings({ onBack }: { onBack: () => void }) {
  const { notifications, setNotification } = useStore()
  const rows = [
    {
      id: "requestReminders",
      title: "Requests needing your OK",
      detail: "Remind me when an action is waiting",
    },
    {
      id: "actionConfirmations",
      title: "Action confirmations",
      detail: "Tell me when an approved action finishes",
    },
    {
      id: "deadlineAlerts",
      title: "Deadline alerts",
      detail: "Notify me about new and upcoming deadlines",
    },
    {
      id: "weeklySummary",
      title: "Weekly summary",
      detail: "A Sunday recap of what was handled",
    },
  ]
  return (
    <main className="flow-screen settings-screen">
      <FlowHeader title="Notifications" onBack={onBack} />
      <div className="flow-scroll settings-scroll">
        <div className="notification-settings-list">
          {rows.map((row) => (
            <section key={row.id}>
              <div>
                <strong>{row.title}</strong>
                <span>{row.detail}</span>
              </div>
              <Toggle
                checked={notifications[row.id]}
                onChange={(enabled) => setNotification(row.id, enabled)}
                label={row.title}
              />
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

function SettingsPage({ onClose }: { onClose: () => void }) {
  const [route, setRoute] = useState<SettingsRoute>("root")
  if (route === "autonomy")
    return <AutonomySettings onBack={() => setRoute("root")} />
  if (route === "sources")
    return <ConnectedSourcesSettings onBack={() => setRoute("root")} />
  if (route === "profile")
    return <ProfileSettings onBack={() => setRoute("root")} />
  if (route === "privacy")
    return <PrivacySettings onBack={() => setRoute("root")} />
  if (route === "notifications")
    return <NotificationSettings onBack={() => setRoute("root")} />
  return <SettingsRoot onBack={onClose} onNavigate={setRoute} />
}

function SourcePermissionSheet({
  source,
  onClose,
  onAllow,
}: {
  source: typeof appData.settings.connectedSources[number]
  onClose: () => void
  onAllow: () => void
}) {
  const reads: Record<string, string> = {
    bcourses: "course announcements, assignments, and due dates",
    gmail: "messages sent to your Berkeley email",
    calendar: "event titles, times, and availability",
    career: "Career Center announcements and registration details",
    whatsapp: "only the messages you forward to Personal Assistant",
  }
  return (
    <Sheet onClose={onClose}>
      <div className={`sheet-icon ${sourceStyles[source.source]}`}>
        <Icon
          name={source.id === "calendar" ? "calendar" : "inbox"}
          size={23}
        />
      </div>
      <h2>Connect {source.name}</h2>
      <p className="permission-intro">
        Personal Assistant will be able to read:
      </p>
      <div className="permission-read">
        <Icon name="check" size={16} />
        {reads[source.id]}
      </div>
      <div className="permission-never">
        <strong>It will never:</strong>
        <span>Send email as you</span>
        <span>Change grades</span>
        <span>Submit forms without your OK</span>
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

function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const {
    connectedSources,
    connectSource,
    setAutonomyPreset,
    setOnboardingComplete,
    updateRegistrationField,
  } = useStore()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [connected, setConnected] = useState<string[]>([])
  const [permissionSource, setPermissionSource] =
    useState<typeof connectedSources[number] | null>(null)
  const [readScope, setReadScope] = useState<"forwarded" | "berkeley">(
    "forwarded",
  )
  const [preset, setPreset] =
    useState<"alwaysAsk" | "personalOnly" | "routine">("alwaysAsk")
  const [profileValues, setProfileValues] = useState({
    name: "Maya Chen",
    email: "maya.chen@berkeley.example",
    program: "MIMS 2028",
    linkedin: "linkedin.com/in/mayachen-example",
  })
  const [editingProfile, setEditingProfile] =
    useState<keyof typeof profileValues | null>(null)
  const [editValue, setEditValue] = useState("")

  const next = () =>
    setStep((current) => Math.min(current + 1, 6) as typeof step)
  const finish = () => {
    setOnboardingComplete(true)
    onDone()
  }

  if (step === 1) {
    return (
      <main className="onboarding-screen onboarding-welcome">
        <div className="onboarding-brand">
          <Icon name="sparkle" size={30} />
        </div>
        <span className="onboarding-kicker">PERSONAL ASSISTANT</span>
        <h1>Your admin, handled.</h1>
        <h2>You approve everything.</h2>
        <div className="onboarding-promises">
          {[
            ["check", "Approve first", "Nothing is sent without your OK"],
            ["inbox", "See sources", "Know where every detail came from"],
            ["activity", "Undo anytime", "Stay in control after an action"],
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

  return (
    <main className="flow-screen onboarding-flow">
      <header className="onboarding-header">
        <span>{step - 1} of 5</span>
        <div>
          <i style={{ width: `${((step - 1) / 5) * 100}%` }} />
        </div>
      </header>
      <div className="flow-scroll onboarding-scroll">
        {step === 2 && (
          <>
            <h1>Connect your sources</h1>
            <p>I’ll use these to find admin work and turn it into actions.</p>
            <div className="onboarding-sources">
              {connectedSources.map((source) => {
                const isConnected = connected.includes(source.id)
                return (
                  <section key={source.id}>
                    <span
                      className={`source-logo ${sourceStyles[source.source]}`}
                    >
                      <Icon
                        name={source.id === "calendar" ? "calendar" : "inbox"}
                        size={19}
                      />
                    </span>
                    <div>
                      <strong>{source.name}</strong>
                      {source.detail && <small>{source.detail}</small>}
                    </div>
                    {isConnected ? (
                      <span className="onboarding-connected">
                        <Icon name="check" size={13} />
                        Connected
                      </span>
                    ) : (
                      <button onClick={() => setPermissionSource(source)}>
                        Connect
                      </button>
                    )}
                  </section>
                )
              })}
            </div>
            <button
              className="primary-button"
              disabled={connected.length !== connectedSources.length}
              onClick={next}
            >
              Continue
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h1>What can I read?</h1>
            <p>Choose which email messages I can use to suggest actions.</p>
            <div className="scope-options">
              <button
                className={readScope === "forwarded" ? "selected" : ""}
                onClick={() => setReadScope("forwarded")}
              >
                <span />
                <div>
                  <strong>Only messages I forward</strong>
                  <small>
                    Example: forward a Career Center email to Personal Assistant
                  </small>
                </div>
              </button>
              <button
                className={readScope === "berkeley" ? "selected" : ""}
                onClick={() => setReadScope("berkeley")}
              >
                <span />
                <div>
                  <strong>Emails from Berkeley senders</strong>
                  <small>
                    Example: automatically notice a deadline from @berkeley.edu
                  </small>
                </div>
              </button>
            </div>
            <button className="primary-button" onClick={next}>
              Continue
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <h1>Your profile</h1>
            <p>I built this from the sources you just connected.</p>
            <div className="onboarding-profile">
              {[
                ["name", "Full name", "Berkeley directory"],
                ["email", "Email", "Berkeley directory"],
                ["program", "Program & year", "Resume - Oct"],
                ["linkedin", "LinkedIn", "You"],
              ].map(([id, label, source]) => (
                <div key={id}>
                  <span>
                    <small>{label}</small>
                    <strong>
                      {profileValues[(id as keyof typeof profileValues)]}
                    </strong>
                    <b>{source}</b>
                  </span>
                  <button
                    onClick={() => {
                      const key = id as keyof typeof profileValues
                      setEditingProfile(key)
                      setEditValue(profileValues[key])
                    }}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
            <button className="primary-button" onClick={next}>
              Looks right
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setEditingProfile("name")
                setEditValue(profileValues.name)
              }}
            >
              Edit
            </button>
          </>
        )}
        {step === 5 && (
          <>
            <h1>How much should I do on my own?</h1>
            <p>You can fine-tune this later in Settings.</p>
            <div className="onboarding-autonomy">
              {[
                {
                  id: "alwaysAsk" as const,
                  title: "Always ask me first",
                  examples: [
                    "Ask before registering for an event",
                    "Ask before sending a meeting poll",
                  ],
                },
                {
                  id: "personalOnly" as const,
                  title: "Ask only when sending personal info",
                  examples: [
                    "Add routine deadlines automatically",
                    "Ask before sharing profile details",
                  ],
                },
                {
                  id: "routine" as const,
                  title: "Handle routine things, tell me after",
                  examples: [
                    "Send scheduling polls automatically",
                    "Add deadlines and reminders",
                  ],
                },
              ].map((option) => (
                <button
                  className={preset === option.id ? "selected" : ""}
                  onClick={() => {
                    setPreset(option.id)
                    setAutonomyPreset(option.id)
                  }}
                  key={option.id}
                >
                  <span />
                  <div>
                    <strong>{option.title}</strong>
                    {option.examples.map((example) => (
                      <small key={example}>
                        <Icon name="check" size={12} />
                        {example}
                      </small>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <button
              className="primary-button"
              onClick={() => {
                setAutonomyPreset(preset)
                next()
              }}
            >
              Continue
            </button>
          </>
        )}
        {step === 6 && (
          <div className="onboarding-privacy">
            <span>
              <Icon name="lock" size={28} />
            </span>
            <h1>Only you see your data.</h1>
            <p>You can see everything I read and delete it anytime.</p>
            <div>
              <Icon name="check" size={16} />
              Sources stay under your control
            </div>
            <div>
              <Icon name="check" size={16} />
              Every action appears in Activity
            </div>
            <button className="primary-button" onClick={finish}>
              Go to Home
            </button>
          </div>
        )}
      </div>
      {permissionSource && (
        <SourcePermissionSheet
          source={permissionSource}
          onClose={() => setPermissionSource(null)}
          onAllow={() => {
            connectSource(permissionSource.id)
            setConnected((current) => [...current, permissionSource.id])
            setPermissionSource(null)
          }}
        />
      )}
      {editingProfile && (
        <Sheet onClose={() => setEditingProfile(null)}>
          <span className="sheet-kicker">EDIT PROFILE</span>
          <h2>
            {editingProfile === "program"
              ? "Program & year"
              : editingProfile[0].toUpperCase() + editingProfile.slice(1)}
          </h2>
          <label className="edit-field-input">
            <span>Value</span>
            <input
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
            />
          </label>
          <button
            className="primary-button"
            onClick={() => {
              setProfileValues((current) => ({
                ...current,
                [editingProfile]: editValue,
              }))
              const registrationField = {
                name: "fullName",
                email: "email",
                program: "program",
                linkedin: "linkedin",
              }[editingProfile]
              if (registrationField) {
                updateRegistrationField(
                  registrationField as RegistrationField["id"],
                  editValue,
                )
              }
              setEditingProfile(null)
            }}
          >
            Save
          </button>
        </Sheet>
      )}
    </main>
  )
}

function Navigation({
  tab,
  onChange,
  count,
}: {
  tab: Tab
  onChange: (tab: Tab) => void
  count: number
}) {
  return (
    <nav className="tab-bar">
      {(["home", "inbox", "calendar", "activity"] as Tab[]).map((key) => (
        <button
          className={tab === key ? "active" : ""}
          onClick={() => onChange(key)}
          key={key}
        >
          <span className="nav-icon">
            <Icon name={key} size={22} />
            {key === "inbox" && count > 0 && <i>{count}</i>}
          </span>
          <span>{key[0].toUpperCase() + key.slice(1)}</span>
        </button>
      ))}
    </nav>
  )
}

function AppContent() {
  const {
    inbox,
    completeCareerRegistration,
    loadRegisteredDemo,
    resetDemo,
    onboardingComplete,
    setOnboardingComplete,
    autonomy,
    canUndoDismiss,
    undoDismissCareerNight,
    toast,
    clearToast,
  } = useStore()
  const [tab, setTab] = useState<Tab>("home")
  const [review, setReview] = useState<InboxItem | null>(null)
  const [event, setEvent] = useState<CalendarEvent | null>(null)
  const [settings, setSettings] = useState(false)
  const [showModerator, setShowModerator] = useState(
    () => window.location.hash === "#mod",
  )
  const [waitlistFlow, setWaitlistFlow] = useState(false)
  const [paperworkFlow, setPaperworkFlow] = useState(false)
  const [meetingFlow, setMeetingFlow] = useState(false)
  const [showLock, setShowLock] = useState(
    () => window.location.hash === "#lock",
  )
  const [careerStep, setCareerStep] = useState<CareerStep | null>(null)
  const [careerOrigin, setCareerOrigin] = useState<"app" | "lock">("app")
  const [conflictChoice, setConflictChoice] =
    useState<"message-team" | "arrive-late" | "automatic">("message-team")
  const [teamMessage, setTeamMessage] = useState(
    "Hi team! I've got Career Night Thu 6:00-8:00pm. Could we move our sync to Thu 5:00pm or Fri morning?",
  )
  const [teamMessageSent, setTeamMessageSent] = useState(false)
  const pendingCount = inbox.filter((item) => item.status === "needs-ok").length

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#lock") {
        setCareerStep(null)
        setShowLock(true)
        setShowModerator(false)
      } else if (window.location.hash === "#mod") {
        setShowLock(false)
        setShowModerator(true)
      } else if (window.location.hash === "#onboarding") {
        setShowLock(false)
        setShowModerator(false)
        setOnboardingComplete(false)
      } else {
        setShowLock(false)
      }
    }
    const openModerator = () => setShowModerator(true)
    window.addEventListener("hashchange", handleHash)
    window.addEventListener("open-moderator", openModerator)
    return () => {
      window.removeEventListener("hashchange", handleHash)
      window.removeEventListener("open-moderator", openModerator)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(clearToast, 3000)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])

  const openCareerNight = (origin: "app" | "lock") => {
    setOnboardingComplete(true)
    setCareerOrigin(origin)
    setReview(null)
    setShowLock(false)
    setCareerStep("detail")
  }

  const openReview = (item: InboxItem) => {
    if (item.id === "career-night" && item.status === "needs-ok") {
      openCareerNight("app")
    } else if (item.id === "google-ux" && item.status === "needs-ok") {
      setWaitlistFlow(true)
    } else if (item.id === "address" && item.status === "in-progress") {
      setPaperworkFlow(true)
    } else if (item.id === "kai-meeting" && item.status === "needs-ok") {
      setMeetingFlow(true)
    } else {
      setReview(item)
    }
  }

  const jumpFromModerator = (target: ModeratorJump) => {
    if (target === "registered") {
      loadRegisteredDemo()
    } else {
      resetDemo()
    }
    setShowModerator(false)
    setShowLock(false)
    setSettings(false)
    setWaitlistFlow(false)
    setPaperworkFlow(false)
    setMeetingFlow(false)
    setCareerStep(null)
    setReview(null)
    setEvent(null)
    setOnboardingComplete(target === "onboarding" ? false : true)
    if (target === "lock") {
      setShowLock(true)
    } else if (target === "home") {
      setTab("home")
    } else if (target === "registered") {
      setTab("home")
    } else if (target === "settings") {
      setSettings(true)
    } else if (target === "meeting") {
      setMeetingFlow(true)
    } else if (target === "waitlist") {
      setWaitlistFlow(true)
    } else if (target === "onboarding") {
      setTab("home")
    }
  }

  const closeCareerNight = () => {
    setCareerStep(null)
    if (careerOrigin === "lock") setShowLock(true)
  }

  if (showLock) {
    return (
      <div className="device-shell">
        <LockScreen onOpen={() => openCareerNight("lock")} />
        {toast && (
          <div className="app-toast" role="status">
            <Icon name="check" size={17} />
            {toast}
            {canUndoDismiss && (
              <button onClick={undoDismissCareerNight}>Undo</button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="device-shell">
      <div className="status-bar">
        <span>10:42</span>
        <div className="status-icons">
          <span className="signal" />
          <span className="wifi">◒</span>
          <span className="battery" />
        </div>
      </div>
      <div className="app-body">
        {!onboardingComplete &&
          !waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !careerStep && (
            <OnboardingFlow
              onDone={() => {
                setOnboardingComplete(true)
                setTab("home")
              }}
            />
          )}
        {onboardingComplete && waitlistFlow && (
          <WaitlistFlow
            onDone={() => {
              setWaitlistFlow(false)
              setTab("inbox")
            }}
          />
        )}
        {onboardingComplete && paperworkFlow && (
          <PaperworkFlow
            onDone={() => {
              setPaperworkFlow(false)
              setTab("inbox")
            }}
          />
        )}
        {onboardingComplete && meetingFlow && (
          <MeetingFlow
            onDone={() => {
              setMeetingFlow(false)
              setTab("home")
            }}
          />
        )}
        {onboardingComplete &&
          !waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          settings && <SettingsPage onClose={() => setSettings(false)} />}
        {onboardingComplete &&
          !waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          careerStep === "detail" && (
            <CareerDetail
              onBack={closeCareerNight}
              onRegister={() => setCareerStep("preparing")}
            />
          )}
        {!waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          careerStep === "preparing" && (
            <PreparingRegistration
              onDone={() =>
                setCareerStep(
                  autonomy.eventRegistrations === "doAndTell"
                    ? "employers-only"
                    : "form",
                )
              }
            />
          )}
        {!waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          careerStep === "employers-only" && (
            <EmployerOnlyQuestion
              onContinue={() => {
                setConflictChoice("automatic")
                setTeamMessageSent(false)
                setCareerStep("submitting")
              }}
            />
          )}
        {!waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          careerStep === "form" && (
            <RegistrationForm
              onBack={() => setCareerStep("detail")}
              onReview={() => setCareerStep("review")}
            />
          )}
        {!waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          careerStep === "review" && (
            <ReviewRegistration
              onBack={() => setCareerStep("form")}
              onProceed={(choice) => {
                setConflictChoice(choice)
                setTeamMessageSent(false)
                setCareerStep(
                  choice === "message-team" ? "team-message" : "submitting",
                )
              }}
              onSkipped={() => {
                setCareerStep(null)
                setTab("home")
              }}
            />
          )}
        {!waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          careerStep === "team-message" && (
            <>
              <ReviewRegistration
                onBack={() => setCareerStep("form")}
                onProceed={(choice) => {
                  setConflictChoice(choice)
                  if (choice === "arrive-late") setCareerStep("submitting")
                }}
                onSkipped={() => {
                  setCareerStep(null)
                  setTab("home")
                }}
              />
              <TeamMessageSheet
                onSend={(message) => {
                  setTeamMessage(message)
                  setTeamMessageSent(true)
                  setCareerStep("submitting")
                }}
                onSkip={(message) => {
                  setTeamMessage(message)
                  setTeamMessageSent(false)
                  setCareerStep("submitting")
                }}
              />
            </>
          )}
        {!waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          careerStep === "submitting" && (
            <SubmittingRegistration
              onDone={() => {
                completeCareerRegistration({
                  conflictChoice,
                  teamMessageSent,
                  teamMessage,
                })
                setCareerStep("confirmation")
              }}
            />
          )}
        {!waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          careerStep === "confirmation" && (
            <RegistrationConfirmation
              onDone={() => {
                setCareerStep(null)
                setTab("home")
              }}
              onSeeActivity={() => {
                setCareerStep(null)
                setTab("activity")
              }}
            />
          )}
        {!waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          !careerStep &&
          tab === "home" && (
            <Home onReview={openReview} onAvatar={() => setSettings(true)} />
          )}
        {onboardingComplete &&
          !waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          !careerStep &&
          tab === "inbox" && (
            <Inbox onReview={openReview} onAvatar={() => setSettings(true)} />
          )}
        {onboardingComplete &&
          !waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          !careerStep &&
          tab === "calendar" && (
            <Calendar onEvent={setEvent} onAvatar={() => setSettings(true)} />
          )}
        {onboardingComplete &&
          !waitlistFlow &&
          !paperworkFlow &&
          !meetingFlow &&
          !settings &&
          !careerStep &&
          tab === "activity" && <Activity onAvatar={() => setSettings(true)} />}
      </div>
      {onboardingComplete &&
        !waitlistFlow &&
        !paperworkFlow &&
        !meetingFlow &&
        !settings &&
        !careerStep && (
          <Navigation tab={tab} onChange={setTab} count={pendingCount} />
        )}
      {review && <ReviewSheet item={review} onClose={() => setReview(null)} />}
      {event && <EventSheet event={event} onClose={() => setEvent(null)} />}
      {showModerator && (
        <ModeratorPanel
          onClose={() => setShowModerator(false)}
          onJump={jumpFromModerator}
        />
      )}
      {toast && (
        <div className="app-toast" role="status">
          <Icon name="check" size={17} />
          {toast}
          {canUndoDismiss && (
            <button onClick={undoDismissCareerNight}>Undo</button>
          )}
        </div>
      )}
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
