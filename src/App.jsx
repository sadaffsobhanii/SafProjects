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
  const [connected, setConnected] = useState(false)
  const [selectedId, setSelectedId] = useState('gym')
  const [modes, setModes] = useState({
    class: 'drive',
    coffee: 'transit',
    gym: 'drive',
  })

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

  if (!connected) {
    return (
      <div className="shell">
        <Header />
        <main className="connect">
          <h1>Know when to leave for what’s on your calendar.</h1>
          <p>
            LeaveBy reads your Google Calendar events and tells you what time to
            walk out the door — walk, drive, or transit — so you are not guessing
            around traffic.
          </p>
          <button type="button" className="primary" onClick={() => setConnected(true)}>
            Connect Google Calendar
          </button>
          <p className="hint">
            Prototype: this loads a sample day of events. It does not open a real
            Google login.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="shell">
      <Header
        extra={
          <button type="button" className="ghost" onClick={() => setConnected(false)}>
            Disconnect
          </button>
        }
      />
      <main className="app">
        <section>
          <p className="label">Google Calendar · sample day</p>
          <h2>{formatDate(selected.arriveAt)}</h2>
          <ul className="events">
            {events.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className={event.id === selectedId ? 'event on' : 'event'}
                  onClick={() => setSelectedId(event.id)}
                >
                  <span className="when">{formatTime(event.arriveAt)}</span>
                  <span>
                    <strong>{event.title}</strong>
                    <em>{event.location}</em>
                  </span>
                  <span className="leave">
                    {event.plan.impossible
                      ? '—'
                      : `Leave ${formatTime(event.plan.leaveAt)}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail">
          <p className="label">Leave advice</p>
          <h2>{selected.title}</h2>
          <p className="place">
            {selected.origin} → {selected.location}
          </p>
          <p className="arrive">Calendar time: {formatTime(selected.arriveAt)}</p>

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
            <p className="clock-note">Walking this far is not practical. Try drive or transit.</p>
          ) : (
            <>
              <p className="clock">{formatTime(selected.plan.leaveAt)}</p>
              <p className="clock-note">Leave by this time to arrive on time</p>
              <ul className="stats">
                <li>
                  Travel <b>{selected.plan.travel} min</b>
                </li>
                <li>
                  Buffer <b>{selected.plan.buffer} min</b>
                </li>
                <li>
                  Roads{' '}
                  <b>{trafficLabel(selected.plan.multiplier).text}</b>
                </li>
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function Header({ extra }) {
  return (
    <header>
      <span className="brand">LeaveBy</span>
      {extra}
    </header>
  )
}
