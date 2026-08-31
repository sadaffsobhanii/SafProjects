import { useMemo, useState } from 'react'
import {
  compareModes,
  defaultArriveAt,
  estimateBases,
  EVENT_COLORS,
  formatDate,
  formatTime,
  leaveStatus,
  MODES,
  planTrip,
  SAMPLE_CALENDAR,
  toDatetimeLocal,
  trafficLabel,
} from './travel.js'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [calendarOn, setCalendarOn] = useState(false)
  const [mapsOn, setMapsOn] = useState(false)
  const [selectedId, setSelectedId] = useState('gym')
  const [home, setHome] = useState('Apartment, Koreatown')
  const [extras, setExtras] = useState([])
  const [reminders, setReminders] = useState({})
  const [modes, setModes] = useState({
    class: 'drive',
    coffee: 'transit',
    gym: 'drive',
    dinner: 'walk',
  })
  const [draft, setDraft] = useState(emptyDraft)

  const rawEvents = useMemo(
    () => [...SAMPLE_CALENDAR, ...extras],
    [extras],
  )

  const events = rawEvents
    .map((event) => {
      const arriveAt =
        event.arriveAt instanceof Date
          ? event.arriveAt
          : defaultArriveAt(event.arriveHour, event.arriveMinute)
      const origin = event.origin || home
      const mode = modes[event.id] || 'drive'
      const plan = planTrip({
        arriveAt,
        mode,
        baseMinutes: event.baseMinutes,
        bufferMinutes: event.buffer,
      })
      return { ...event, origin, arriveAt, mode, plan }
    })
    .sort((a, b) => a.arriveAt - b.arriveAt)

  const selected = events.find((event) => event.id === selectedId) || events[0]
  const next = events.find((event) => !event.plan.missed) || selected

  function openApp({ calendar = true, maps = true } = {}) {
    setCalendarOn(calendar)
    setMapsOn(maps)
    setScreen('app')
  }

  function addEvent(event) {
    event.preventDefault()
    if (!draft.title.trim() || !draft.location.trim()) return
    const arriveAt = new Date(draft.when)
    const id = `e-${Date.now()}`
    setExtras((list) => [
      ...list,
      {
        id,
        title: draft.title.trim(),
        location: draft.location.trim(),
        origin: home,
        color: EVENT_COLORS[list.length % EVENT_COLORS.length],
        arriveAt,
        baseMinutes: estimateBases(draft.driveMinutes),
        buffer: Number(draft.buffer) || 8,
      },
    ])
    setModes((current) => ({ ...current, [id]: 'drive' }))
    setSelectedId(id)
    setDraft(emptyDraft())
  }

  if (screen === 'home') {
    return <Landing onStart={() => setScreen('connect')} onDemo={() => openApp()} />
  }

  if (screen === 'connect') {
    return (
      <div className="page">
        <TopBar onLogo={() => setScreen('home')} />
        <main className="connect">
          <p className="kicker">Set up in 10 seconds</p>
          <h1>Connect the apps you already use.</h1>
          <p>
            Calendar brings the events. Maps brings walk, drive, and traffic.
            This demo uses a sample day so you can try it without logging in.
          </p>
          <div className="connect-actions">
            <button type="button" className="btn google" onClick={() => openApp()}>
              <GoogleMark />
              Continue with Calendar & Maps
            </button>
            <button
              type="button"
              className="btn maps"
              onClick={() => openApp({ calendar: true, maps: false })}
            >
              <GoogleMark />
              Google Calendar only
            </button>
            <button
              type="button"
              className="btn maps"
              onClick={() => openApp({ calendar: false, maps: true })}
            >
              <MapsPin />
              Apple Maps only
            </button>
          </div>
          <button type="button" className="link" onClick={() => setScreen('home')}>
            Back
          </button>
        </main>
      </div>
    )
  }

  if (!selected) return null

  const alts = compareModes({
    arriveAt: selected.arriveAt,
    baseMinutes: selected.baseMinutes,
    bufferMinutes: selected.buffer,
  })
  const condition = selected.plan.impossible
    ? null
    : trafficLabel(selected.plan.multiplier)
  const status = leaveStatus(selected.plan)
  const nextStatus = leaveStatus(next.plan)

  return (
    <div className="page app-page">
      <TopBar
        onLogo={() => setScreen('home')}
        extra={
          <>
            <span className="chips">
              {calendarOn ? <span className="chip cal">Calendar</span> : null}
              {mapsOn ? <span className="chip map">Maps</span> : null}
            </span>
            {!calendarOn ? (
              <button type="button" className="link" onClick={() => setCalendarOn(true)}>
                Add Calendar
              </button>
            ) : null}
            {!mapsOn ? (
              <button type="button" className="link" onClick={() => setMapsOn(true)}>
                Add Maps
              </button>
            ) : null}
            <button
              type="button"
              className="link"
              onClick={() => {
                setCalendarOn(false)
                setMapsOn(false)
                setScreen('home')
              }}
            >
              Sign out
            </button>
          </>
        }
      />

      <div className={`banner ${nextStatus.tone}`}>
        Next: <b>{next.title}</b> · {nextStatus.text} · Leave by{' '}
        {next.plan.impossible ? '—' : formatTime(next.plan.leaveAt)}
      </div>

      <main className="workspace">
        <section className="agenda">
          <p className="kicker">{calendarOn ? 'Google Calendar' : 'Sample schedule'}</p>
          <h2>{formatDate(selected.arriveAt)}</h2>
          <label className="home-field">
            Starting from
            <input
              value={home}
              onChange={(e) => setHome(e.target.value)}
              aria-label="Home or starting location"
            />
          </label>
          <ul>
            {events.map((event) => {
              const row = leaveStatus(event.plan)
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    className={event.id === selected.id ? 'event on' : 'event'}
                    onClick={() => setSelectedId(event.id)}
                  >
                    <span className="when">{formatTime(event.arriveAt)}</span>
                    <span className="bar" style={{ background: event.color }} />
                    <span className="copy">
                      <strong>{event.title}</strong>
                      <em>{event.location}</em>
                    </span>
                    <span className={`leave ${row.tone}`}>
                      {event.plan.impossible ? '—' : formatTime(event.plan.leaveAt)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <form className="add" onSubmit={addEvent}>
            <p className="kicker">Add to calendar</p>
            <input
              placeholder="Event"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <input
              placeholder="Where"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
            <div className="add-row">
              <input
                type="datetime-local"
                value={draft.when}
                onChange={(e) => setDraft({ ...draft, when: e.target.value })}
              />
              <input
                type="number"
                min="1"
                max="180"
                value={draft.driveMinutes}
                onChange={(e) => setDraft({ ...draft, driveMinutes: e.target.value })}
                aria-label="Drive minutes with no traffic"
                title="Minutes if you drove with no traffic"
              />
            </div>
            <button type="submit" className="btn google">
              Add event
            </button>
          </form>
        </section>

        <section className="directions">
          <div className="map-art" aria-hidden="true">
            <span className="park" />
            <span className="water" />
            <span className="road" />
            <span className="route" />
            <span className="dot start" />
            <span className="dot end" />
            <span className="map-label">{mapsOn ? 'Apple Maps' : 'Preview map'}</span>
          </div>
          <div className="sheet">
            <p className="kicker">{mapsOn ? 'Directions' : 'Travel estimate'}</p>
            <h2>{selected.title}</h2>
            <p className="route-text">
              {selected.origin}
              <span> to </span>
              {selected.location}
            </p>
            <p className="arrive">Calendar: {formatTime(selected.arriveAt)}</p>

            <div className="modes" role="group" aria-label="Travel mode">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selected.mode === item.id ? 'on' : ''}
                  onClick={() =>
                    setModes((current) => ({ ...current, [selected.id]: item.id }))
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            {selected.plan.impossible ? (
              <p className="note">Too far to walk. Choose Drive or Transit.</p>
            ) : (
              <>
                <p className="eta">{formatTime(selected.plan.leaveAt)}</p>
                <p className={`note status ${status.tone}`}>{status.text} · Leave by</p>
                <div className="meta">
                  <span>{selected.plan.travel} min</span>
                  <span>{selected.plan.buffer} min buffer</span>
                  <span>{condition.text}</span>
                </div>
              </>
            )}

            <div className="alts">
              {alts.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  className={alt.id === selected.mode ? 'on' : ''}
                  disabled={alt.plan.impossible}
                  onClick={() =>
                    setModes((current) => ({ ...current, [selected.id]: alt.id }))
                  }
                >
                  {alt.label}
                  <b>
                    {alt.plan.impossible ? '—' : formatTime(alt.plan.leaveAt)}
                  </b>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={reminders[selected.id] ? 'btn maps on' : 'btn maps'}
              onClick={() =>
                setReminders((current) => ({
                  ...current,
                  [selected.id]: !current[selected.id],
                }))
              }
            >
              {reminders[selected.id]
                ? 'Reminder on for leave time'
                : 'Remind me when to leave'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function emptyDraft() {
  const when = defaultArriveAt(18, 0)
  return {
    title: '',
    location: '',
    when: toDatetimeLocal(when),
    driveMinutes: 15,
    buffer: 8,
  }
}

function Landing({ onStart, onDemo }) {
  return (
    <div className="page landing">
      <TopBar
        extra={
          <>
            <a href="#how">How it works</a>
            <button type="button" className="btn google compact" onClick={onStart}>
              Get started
            </button>
          </>
        }
      />
      <main>
        <section className="hero">
          <p className="kicker">Calendar + Maps, in one glance</p>
          <h1>Your calendar says 8:00. LeaveBy says leave at 7:22.</h1>
          <p className="lede">
            Stop guessing traffic. LeaveBy reads what’s on Google Calendar and
            uses Maps-style travel times so you actually arrive on time — gym,
            class, or dinner.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn google" onClick={onStart}>
              Connect Calendar & Maps
            </button>
            <button type="button" className="btn maps" onClick={onDemo}>
              Open sample day
            </button>
          </div>
        </section>

        <section id="how" className="steps">
          <article>
            <span>1</span>
            <h3>Pull your events</h3>
            <p>Gym at 8, class at 9 — whatever is already on the calendar.</p>
          </article>
          <article>
            <span>2</span>
            <h3>Check the route</h3>
            <p>Walk, drive, or transit, with a simple traffic estimate.</p>
          </article>
          <article>
            <span>3</span>
            <h3>Get a leave-by time</h3>
            <p>A clock time you can set as a reminder, not a vague ETA.</p>
          </article>
        </section>
      </main>
    </div>
  )
}

function TopBar({ extra, onLogo }) {
  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={onLogo}>
        <span className="logo" aria-hidden="true">
          <i className="b" />
          <i className="r" />
          <i className="y" />
          <i className="g" />
        </span>
        LeaveBy
      </button>
      <div className="top-extra">{extra}</div>
    </header>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.9 2-1.8 2.6v2.2h3c1.7-1.6 2.6-4 2.6-6.4z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2c-.8.6-1.9.9-3 .9-2.3 0-4.3-1.6-5-3.7H1v2.3C2.4 15.9 5.5 18 9 18z" />
      <path fill="#FBBC05" d="M4 10.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V4.9H1C.4 6.2 0 7.6 0 9s.4 2.8 1 4.1l3-2.3z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.5-2.5C13.5.9 11.4 0 9 0 5.5 0 2.4 2.1 1 4.9l3 2.3C4.7 5.1 6.7 3.6 9 3.6z" />
    </svg>
  )
}

function MapsPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#007AFF"
        d="M9 1.5a6 6 0 0 0-6 6c0 4.5 6 9 6 9s6-4.5 6-9a6 6 0 0 0-6-6zm0 8.1A2.1 2.1 0 1 1 9 5.4a2.1 2.1 0 0 1 0 4.2z"
      />
    </svg>
  )
}
