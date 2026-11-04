// Footprints: a privacy-safe activity log for usability sessions.
//
// It records only while a session is active (started on the /footprints/ page with a
// participant ID like P03). It stores events in this browser's localStorage only:
// no network requests. It never records typed text, only how many characters a
// field holds. The moderator exports the log as JSON/CSV after the session.

const SESSION_KEY = 'fp.session'
const EVENTS_KEY = 'fp.events'
const MAX_EVENTS = 20000

export type FootprintSession = {
  participantId: string
  startedAt: string
  endedAt?: string
}

export type FootprintEvent = {
  at: string // ISO timestamp
  t: number // ms since session start
  pid: string
  proto: string
  screen: string
  hash: string
  type: string
  data?: Record<string, string | number | boolean>
}

function readSession(): FootprintSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as FootprintSession | null
    return s && !s.endedAt ? s : null
  } catch {
    return null
  }
}

function readEvents(): FootprintEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') as FootprintEvent[]
  } catch {
    return []
  }
}

let proto = 'unknown'
let currentScreen = ''

function clean(text: string | null | undefined, max = 60): string {
  return (text ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

// Screen name, in order of preference:
// 1. the moderator panel, if open
// 2. the top open dialog/sheet ("Sheet · <its heading>")
// 3. the last element marked data-fp-screen="…" (prototypes can name screens explicitly)
// 4. the page's first h1
function screenTitle(): string {
  if (document.querySelector('[data-fp-moderator]')) return 'Moderator panel'
  const dialogs = document.querySelectorAll('[role="dialog"]')
  if (dialogs.length) {
    const top = dialogs[dialogs.length - 1]
    return clean('Sheet · ' + (top.querySelector('h1, h2, h3')?.textContent ?? top.getAttribute('aria-label') ?? ''))
  }
  const named = document.querySelectorAll('[data-fp-screen]')
  if (named.length) return clean(named[named.length - 1].getAttribute('data-fp-screen'))
  return clean(document.querySelector('h1')?.textContent)
}

export function logFootprint(type: string, data?: FootprintEvent['data']) {
  const session = readSession()
  if (!session) return
  try {
    const events = readEvents()
    if (events.length >= MAX_EVENTS) return
    const now = new Date()
    events.push({
      at: now.toISOString(),
      t: now.getTime() - new Date(session.startedAt).getTime(),
      pid: session.participantId,
      proto,
      screen: screenTitle(),
      hash: location.hash,
      type,
      data,
    })
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  } catch {
    // Storage can be full or blocked; never break the app because of logging.
  }
}

const CONTROL_SELECTOR =
  'button, a, [role="button"], [role="radio"], [role="switch"], [role="tab"], [role="checkbox"], label, input[type="checkbox"], input[type="radio"]'

function describe(el: Element): Record<string, string> {
  const aria = el.getAttribute('aria-label')
  // innerText keeps line breaks between blocks, so "Lock screen" + "Task 1" stays readable.
  const visible = el instanceof HTMLElement ? el.innerText : el.textContent
  const text = (visible ?? '').split('\n').map((part) => part.trim()).filter(Boolean).join(' / ')
  const out: Record<string, string> = {
    tag: el.tagName.toLowerCase(),
    label: (aria || text).slice(0, 60),
  }
  // Short labels like "Edit" or "Undo": add the row's first label so we know which one.
  if (out.label.split(' ').length <= 2) {
    let parent = el.parentElement
    for (let i = 0; i < 3 && parent; i++, parent = parent.parentElement) {
      const others = parent.innerText
        .split('\n')
        .map((part) => part.trim())
        .filter((part) => part && part !== out.label)
      if (others.length >= 1 && others.length <= 4) {
        out.context = others[0].slice(0, 60)
        break
      }
    }
  }
  const role = el.getAttribute('role')
  if (role) out.role = role
  if (el.closest('[data-fp-moderator]')) out.by = 'moderator'
  const cls = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).slice(0, 2).join(' ')
  if (cls) out.cls = cls
  const checked = el.getAttribute('aria-checked') ?? el.getAttribute('aria-pressed') ?? el.getAttribute('aria-expanded')
  if (checked !== null) out.state = checked
  return out
}

function fieldName(el: HTMLInputElement | HTMLTextAreaElement): string {
  const label = el.labels?.[0]?.textContent ?? ''
  return clean(el.getAttribute('aria-label') || label || el.name || el.placeholder || el.id || el.tagName)
}

export function initFootprints(prototypeName: string) {
  proto = prototypeName
  logFootprint('page_open', {
    width: window.innerWidth,
    height: window.innerHeight,
    standalone: isStandalone(),
  })

  window.addEventListener('hashchange', () => logFootprint('hash_change'))

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element | null
      if (target?.closest('input:not([type="checkbox"]):not([type="radio"]), textarea')) return
      const el = target?.closest(CONTROL_SELECTOR)
      // A label around a text field is just a tap into the field; field_focus covers it.
      if (el?.tagName === 'LABEL' && el.querySelector('input:not([type="checkbox"]):not([type="radio"]), textarea')) return
      if (el) logFootprint('tap', describe(el))
    },
    true,
  )

  // Press-and-hold (e.g. "Approve & send") and long-presses: log how long the press lasted.
  let pressStart = 0
  let pressEl: Element | null = null
  document.addEventListener(
    'pointerdown',
    (event) => {
      pressEl = (event.target as Element | null)?.closest(CONTROL_SELECTOR) ?? null
      pressStart = performance.now()
    },
    true,
  )
  document.addEventListener(
    'pointerup',
    () => {
      if (!pressEl) return
      const ms = Math.round(performance.now() - pressStart)
      if (ms >= 400) logFootprint('press', { ...describe(pressEl), ms })
      pressEl = null
    },
    true,
  )

  // Text fields: only the field name and the number of characters, never the text itself.
  document.addEventListener(
    'focusin',
    (event) => {
      const el = event.target
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (el.type === 'checkbox' || el.type === 'radio') return
        logFootprint('field_focus', { field: fieldName(el), length: el.value.length })
      }
    },
    true,
  )
  document.addEventListener(
    'focusout',
    (event) => {
      const el = event.target
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (el.type === 'checkbox' || el.type === 'radio') return
        logFootprint('field_edit', { field: fieldName(el), length: el.value.length })
      }
    },
    true,
  )

  // Screen changes: watch the main heading.
  let pending = 0
  const observer = new MutationObserver(() => {
    window.clearTimeout(pending)
    pending = window.setTimeout(() => {
      const title = screenTitle()
      if (title && title !== currentScreen) {
        currentScreen = title
        logFootprint('screen', { title })
      }
    }, 250)
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })

  document.addEventListener('visibilitychange', () => logFootprint('visibility', { state: document.visibilityState }))
}

// ---- Moderator API (used by FootprintsPanel) ----

export function getSession(): FootprintSession | null {
  return readSession()
}

export function getEvents(): FootprintEvent[] {
  return readEvents()
}

export function startSession(participantId: string): { ok: true } | { ok: false; reason: string } {
  const pid = participantId.trim().toUpperCase()
  if (!/^P\d{2}$/.test(pid)) return { ok: false, reason: 'Use a participant ID like P03 (never a name).' }
  const leftover = readEvents()
  if (leftover.length && leftover[0].pid !== pid) {
    return { ok: false, reason: `The log still has ${leftover.length} events from ${leftover[0].pid}. Export and clear it first.` }
  }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ participantId: pid, startedAt: new Date().toISOString() }))
  } catch {
    return { ok: false, reason: 'This browser is blocking storage (private mode?). The log can’t be kept here.' }
  }
  logFootprint('session_start', { width: window.innerWidth, height: window.innerHeight, standalone: isStandalone() })
  return { ok: true }
}

export function endSession() {
  const session = readSession()
  if (!session) return
  logFootprint('session_end')
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, endedAt: new Date().toISOString() }))
  } catch {
    // ignore
  }
}

export function clearLog() {
  try {
    localStorage.removeItem(EVENTS_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function toCSV(events: FootprintEvent[]): string {
  const dataKeys = Array.from(new Set(events.flatMap((e) => Object.keys(e.data ?? {})))).sort()
  const header = ['at', 't_ms', 'pid', 'proto', 'type', 'screen', 'hash', ...dataKeys]
  const esc = (v: unknown) => {
    const text = v === undefined || v === null ? '' : String(v)
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
  }
  const rows = events.map((e) =>
    [e.at, e.t, e.pid, e.proto, e.type, e.screen, e.hash, ...dataKeys.map((k) => e.data?.[k])].map(esc).join(','),
  )
  return [header.join(','), ...rows].join('\n')
}

export function summarize(events: FootprintEvent[]) {
  const taps = events.filter((e) => e.type === 'tap' && e.data?.by !== 'moderator').length
  const screens = new Set(events.filter((e) => e.type === 'screen').map((e) => e.screen)).size
  const last = events[events.length - 1]
  return { count: events.length, taps, screens, durationMs: last ? last.t : 0, pid: events[0]?.pid }
}
