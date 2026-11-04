import { useEffect, useState } from 'react'
import {
  clearLog,
  endSession,
  getEvents,
  getSession,
  isStandalone,
  startSession,
  summarize,
  toCSV,
} from './footprints'

// Moderator controls for the activity log. Each prototype puts this inside its own
// moderator panel. Styles are inline so it looks the same in all three prototypes.

const css = `
.fp-panel { margin: 14px 0 6px; padding: 14px; border-radius: 14px; background: #f3f4f6; color: #111827; font: 14px/1.4 'Inter Variable', Inter, ui-sans-serif, -apple-system, sans-serif; text-align: left; }
.fp-panel h3 { margin: 0 0 2px; font-size: 12px; letter-spacing: .06em; color: #6b7280; font-weight: 700; }
.fp-panel p { margin: 4px 0; color: #374151; font-size: 13px; }
.fp-row { display: flex; gap: 8px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
.fp-panel input { flex: 1 1 90px; min-width: 0; font-size: 16px; padding: 9px 10px; border-radius: 10px; border: 1px solid #d1d5db; background: #fff; color: #111827; text-transform: uppercase; }
.fp-panel button { font: inherit; font-size: 14px; font-weight: 600; padding: 9px 12px; border-radius: 10px; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; }
.fp-panel button.fp-primary { background: #111827; border-color: #111827; color: #fff; }
.fp-panel button.fp-danger { color: #b91c1c; }
.fp-panel button:disabled { opacity: .45; cursor: default; }
.fp-status { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; }
.fp-dot { width: 8px; height: 8px; border-radius: 99px; background: #9ca3af; }
.fp-dot.on { background: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, .18); }
.fp-error { color: #b91c1c !important; }
`

function minutes(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

async function saveFile(name: string, type: string, text: string) {
  const file = new File([text], name, { type })
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  // On a phone, the share sheet is the reliable way to save (Files, AirDrop to a laptop).
  if (nav.canShare?.({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: [file], title: name })
      return
    } catch {
      // The moderator closed the share sheet; fall back to a download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function FootprintsPanel({ prototype }: { prototype: string }) {
  const [, setTick] = useState(0)
  const [pid, setPid] = useState(() => getSession()?.participantId ?? '')
  const [error, setError] = useState('')
  const refresh = () => setTick((n) => n + 1)

  useEffect(() => {
    const timer = window.setInterval(refresh, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const session = getSession()
  const events = getEvents()
  const summary = summarize(events)
  const date = new Date().toLocaleDateString('en-CA') // local YYYY-MM-DD
  const base = `${summary.pid ?? 'P00'}-footprints-${prototype}-${date}`

  return (
    <section className="fp-panel" data-fp-moderator="">
      <style>{css}</style>
      <h3>ACTIVITY LOG</h3>
      <div className="fp-status">
        <span className={session ? 'fp-dot on' : 'fp-dot'} />
        {session ? `Recording ${session.participantId}` : 'Not recording'}
      </div>
      <p>
        {summary.count} events · {summary.taps} taps · {summary.screens} screens · {minutes(summary.durationMs)}
        {summary.pid && !session ? ` · from ${summary.pid}` : ''}
      </p>
      <p>
        Stays on this phone only. No typed text is saved.
        {isStandalone() ? ' Home-screen apps keep separate logs: start it in each prototype.' : ''}
      </p>

      {!session ? (
        <div className="fp-row">
          <input
            value={pid}
            onChange={(e) => {
              setPid(e.target.value)
              setError('')
            }}
            placeholder="P03"
            aria-label="Participant ID"
            maxLength={3}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="fp-primary"
            onClick={() => {
              const result = startSession(pid)
              setError(result.ok ? '' : result.reason)
              refresh()
            }}
          >
            Start log
          </button>
        </div>
      ) : (
        <div className="fp-row">
          <button
            className="fp-primary"
            onClick={() => {
              endSession()
              refresh()
            }}
          >
            Stop log
          </button>
        </div>
      )}
      {error && <p className="fp-error">{error}</p>}

      <div className="fp-row">
        <button
          disabled={!events.length}
          onClick={() => saveFile(`${base}.json`, 'application/json', JSON.stringify(events, null, 2))}
        >
          Save JSON
        </button>
        <button disabled={!events.length} onClick={() => saveFile(`${base}.csv`, 'text/csv', toCSV(events))}>
          Save CSV
        </button>
        <button
          className="fp-danger"
          disabled={!events.length && !session}
          onClick={() => {
            if (window.confirm(`Delete ${events.length} events from this phone? Save them to Berkeley Drive first.`)) {
              clearLog()
              setPid('')
              refresh()
            }
          }}
        >
          Clear
        </button>
      </div>
    </section>
  )
}
