import { useMemo, useState } from 'react'
import ChatWidget from './ChatWidget.jsx'
import {
  compareModes,
  defaultArriveAt,
  estimateBases,
  EVENT_COLORS,
  formatDate,
  formatTime,
  MODES,
  planTrip,
  SAMPLE_CALENDAR,
  toDatetimeLocal,
  trafficLabel,
} from './travel.js'

const SERVICES = [
  { id: 'googleCalendar', label: 'Connect to Google Calendar' },
  { id: 'outlook', label: 'Connect to Outlook' },
  { id: 'googleMaps', label: 'Connect to Google Maps' },
  { id: 'appleMaps', label: 'Connect to Apple Maps' },
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [linked, setLinked] = useState({
    googleCalendar: false,
    outlook: false,
    googleMaps: false,
    appleMaps: false,
  })
  const [selectedId, setSelectedId] = useState('gym')
  const [home, setHome] = useState('Apartment, Koreatown')
  const [extras, setExtras] = useState([])
  const [reminders, setReminders] = useState({})
  const [remindOpen, setRemindOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [modes, setModes] = useState({
    class: 'drive',
    coffee: 'transit',
    gym: 'drive',
    dinner: 'walk',
  })
  const [draft, setDraft] = useState(emptyDraft)

  const events = useMemo(
    () =>
      [...SAMPLE_CALENDAR, ...extras]
        .map((event) => {
          const arriveAt =
            event.arriveAt instanceof Date
              ? event.arriveAt
              : defaultArriveAt(event.arriveHour, event.arriveMinute)
          const mode = modes[event.id] || 'drive'
          return {
            ...event,
            origin: event.origin || home,
            arriveAt,
            mode,
            plan: planTrip({
              arriveAt,
              mode,
              baseMinutes: event.baseMinutes,
              bufferMinutes: event.buffer,
            }),
          }
        })
        .sort((a, b) => a.arriveAt - b.arriveAt),
    [extras, home, modes],
  )

  const selected = events.find((event) => event.id === selectedId) || events[0]
  const mapsOn = linked.googleMaps || linked.appleMaps
  const calendarOn = linked.googleCalendar || linked.outlook

  function addEvent(event) {
    event.preventDefault()
    if (!draft.title.trim() || !draft.location.trim()) return
    const id = `e-${Date.now()}`
    setExtras((list) => [
      ...list,
      {
        id,
        title: draft.title.trim(),
        location: draft.location.trim(),
        origin: home,
        color: EVENT_COLORS[list.length % EVENT_COLORS.length],
        arriveAt: new Date(draft.when),
        baseMinutes: estimateBases(draft.driveMinutes),
        buffer: Number(draft.buffer) || 8,
      },
    ])
    setModes((current) => ({ ...current, [id]: 'drive' }))
    setSelectedId(id)
    setDraft(emptyDraft())
  }

  if (!selected) {
    return <ChatWidget events={events} home={home} />
  }

  const alts = compareModes({
    arriveAt: selected.arriveAt,
    baseMinutes: selected.baseMinutes,
    bufferMinutes: selected.buffer,
  })
  const condition = selected.plan.impossible
    ? null
    : trafficLabel(selected.plan.multiplier)

  return (
    <>
      <div className="page app-page">
        <header className="topbar">
          <div className="top-left">
            <button
              type="button"
              className="hamburger"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <span className="brand">
              <ClockMark />
              LeaveBy
            </span>
          </div>
        </header>

        {menuOpen ? (
          <button
            type="button"
            className="menu-scrim"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <aside className={menuOpen ? 'drawer open' : 'drawer'} aria-hidden={!menuOpen}>
          <p className="kicker">Connect apps</p>
          {SERVICES.map((service) => (
            <button
              key={service.id}
              type="button"
              className={linked[service.id] ? 'drawer-item on' : 'drawer-item'}
              onClick={() =>
                setLinked((current) => ({
                  ...current,
                  [service.id]: !current[service.id],
                }))
              }
            >
              {service.label}
              <span>{linked[service.id] ? 'On' : 'Off'}</span>
            </button>
          ))}
          <p className="drawer-note">Prototype toggles — no real login.</p>
        </aside>

        <main className="workspace">
          <section className="agenda">
            <p className="kicker">{calendarOn ? 'Your calendar' : 'Today'}</p>
            <h2>{formatDate(selected.arriveAt)}</h2>
            <label className="home-field">
              Starting from
              <input
                value={home}
                onChange={(e) => setHome(e.target.value)}
                aria-label="Starting location"
              />
            </label>
            <ul>
              {events.map((event) => (
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
                    <span className="leave">
                      {event.plan.impossible ? '—' : formatTime(event.plan.leaveAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <form className="add" onSubmit={addEvent}>
              <p className="kicker">Add event</p>
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
                  onChange={(e) =>
                    setDraft({ ...draft, driveMinutes: e.target.value })
                  }
                  aria-label="Drive minutes with no traffic"
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
              <span className="map-label">{mapsOn ? 'Maps' : 'Preview map'}</span>
            </div>
            <div className="sheet">
              <p className="kicker">Leave by</p>
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
                  <p className="note">Leave by this time</p>
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
                    <b>{alt.plan.impossible ? '—' : formatTime(alt.plan.leaveAt)}</b>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={reminders[selected.id] ? 'btn maps on' : 'btn maps'}
                onClick={() => {
                  if (reminders[selected.id]) {
                    setReminders((current) => ({
                      ...current,
                      [selected.id]: false,
                    }))
                    return
                  }
                  setPhoneError('')
                  setRemindOpen(true)
                }}
              >
                {reminders[selected.id]
                  ? 'Reminder on'
                  : 'Remind me when to leave'}
              </button>
            </div>
          </section>
        </main>
      </div>

      {remindOpen ? (
        <div className="modal-scrim" role="presentation">
          <form
            className="modal"
            role="dialog"
            aria-labelledby="remind-title"
            onSubmit={(event) => {
              event.preventDefault()
              const digits = phone.replace(/\D/g, '')
              if (digits.length < 10) {
                setPhoneError('Enter a phone number so we can text you.')
                return
              }
              setReminders((current) => ({ ...current, [selected.id]: true }))
              setRemindOpen(false)
              setPhoneError('')
            }}
          >
            <h3 id="remind-title">What’s your phone number?</h3>
            <p>We’ll text you when it’s time to leave for {selected.title}.</p>
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-5555"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Phone number"
            />
            {phoneError ? <p className="modal-error">{phoneError}</p> : null}
            <div className="modal-actions">
              <button
                type="button"
                className="btn maps"
                onClick={() => {
                  setRemindOpen(false)
                  setPhoneError('')
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn google">
                Remind me
              </button>
            </div>
            <p className="drawer-note">Prototype only — no text is actually sent.</p>
          </form>
        </div>
      ) : null}

      <ChatWidget events={events} home={home} />
    </>
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

function ClockMark() {
  return (
    <svg className="clock-mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="#fff" stroke="#1a73e8" strokeWidth="1.75" />
      <circle cx="16" cy="5.5" r="1.1" fill="#1a73e8" />
      <circle cx="16" cy="26.5" r="1.1" fill="#dadce0" />
      <circle cx="5.5" cy="16" r="1.1" fill="#dadce0" />
      <circle cx="26.5" cy="16" r="1.1" fill="#dadce0" />
      <line
        x1="16"
        y1="16"
        x2="16"
        y2="8.2"
        stroke="#202124"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        className="ticker"
        x1="16"
        y1="16"
        x2="23.4"
        y2="10.6"
        stroke="#ea4335"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="1.7" fill="#1a73e8" />
    </svg>
  )
}
