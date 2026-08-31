import { useState } from 'react'
import {
  defaultArriveAt,
  formatDate,
  formatTime,
  MODES,
  planTrip,
  SAMPLE_CALENDAR,
  trafficLabel,
} from './travel.js'

export default function App() {
  const [calendarOn, setCalendarOn] = useState(false)
  const [mapsOn, setMapsOn] = useState(false)
  const [selectedId, setSelectedId] = useState('gym')
  const [modes, setModes] = useState({
    class: 'drive',
    coffee: 'transit',
    gym: 'drive',
  })

  const connected = calendarOn || mapsOn

  const events = SAMPLE_CALENDAR.map((event) => {
    const arriveAt = defaultArriveAt(event.arriveHour, event.arriveMinute)
    const mode = modes[event.id] || 'drive'
    const plan = planTrip({
      arriveAt,
      mode,
      baseMinutes: event.baseMinutes,
      bufferMinutes: event.buffer,
    })
    return { ...event, arriveAt, mode, plan }
  })

  const selected = events.find((event) => event.id === selectedId) || events[0]

  function disconnect() {
    setCalendarOn(false)
    setMapsOn(false)
  }

  if (!connected) {
    return (
      <div className="page">
        <TopBar />
        <main className="connect">
          <h1>Leave on time for what’s on your calendar.</h1>
          <p>
            Connect Google Calendar for your events, and Apple Maps for walk,
            drive, and traffic times. This prototype uses sample data — it does
            not open a real Google or Apple login.
          </p>
          <div className="connect-actions">
            <button
              type="button"
              className="btn google"
              onClick={() => setCalendarOn(true)}
            >
              <GoogleMark />
              Connect Google Calendar
            </button>
            <button
              type="button"
              className="btn maps"
              onClick={() => setMapsOn(true)}
            >
              <MapsPin />
              Connect Apple Maps
            </button>
          </div>
        </main>
      </div>
    )
  }

  const condition = selected.plan.impossible
    ? null
    : trafficLabel(selected.plan.multiplier)

  return (
    <div className="page">
      <TopBar
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
            <button type="button" className="link" onClick={disconnect}>
              Disconnect
            </button>
          </>
        }
      />

      <main className="workspace">
        <section className="agenda" aria-label="Calendar events">
          <p className="kicker">{calendarOn ? 'Google Calendar' : 'Sample schedule'}</p>
          <h2>{formatDate(selected.arriveAt)}</h2>
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className={event.id === selectedId ? 'event on' : 'event'}
                  onClick={() => setSelectedId(event.id)}
                >
                  <span className="when">{formatTime(event.arriveAt)}</span>
                  <span className="bar" style={{ background: event.color }} />
                  <span className="copy">
                    <strong>{event.title}</strong>
                    <em>{event.location}</em>
                  </span>
                  <span className="leave">
                    {event.plan.impossible ? '—' : formatTime(event.plan.leaveAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="directions" aria-label="Maps leave time">
          <div className="map-art" aria-hidden="true">
            <span className="park" />
            <span className="road" />
            <span className="route" />
            <span className="dot start" />
            <span className="dot end" />
          </div>
          <div className="sheet">
            <p className="kicker">{mapsOn ? 'Apple Maps' : 'Travel estimate'}</p>
            <h2>{selected.title}</h2>
            <p className="route-text">
              {selected.origin}
              <span> to </span>
              {selected.location}
            </p>
            <p className="arrive">Arrives {formatTime(selected.arriveAt)}</p>

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
                <p className="note">Leave by</p>
                <div className="meta">
                  <span>{selected.plan.travel} min</span>
                  <span>{selected.plan.buffer} min buffer</span>
                  <span>{condition.text}</span>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function TopBar({ extra }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo" aria-hidden="true">
          <i className="b" />
          <i className="r" />
          <i className="y" />
          <i className="g" />
        </span>
        LeaveBy
      </div>
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
