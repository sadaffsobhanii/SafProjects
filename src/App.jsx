import { useMemo, useState } from 'react'
import {
  compareModes,
  defaultArriveAt,
  formatDate,
  formatTime,
  MODES,
  planTrip,
  PRESETS,
  toDatetimeLocal,
  trafficLabel,
} from './travel.js'

const gym = PRESETS[0]

export default function App() {
  const [presetId, setPresetId] = useState(gym.id)
  const [eventName, setEventName] = useState(gym.eventName)
  const [origin, setOrigin] = useState(gym.origin)
  const [destination, setDestination] = useState(gym.destination)
  const [mode, setMode] = useState('drive')
  const [buffer, setBuffer] = useState(gym.buffer)
  const [baseMinutes, setBaseMinutes] = useState(gym.baseMinutes)
  const [arriveLocal, setArriveLocal] = useState(
    toDatetimeLocal(defaultArriveAt(gym.arriveHour, gym.arriveMinute)),
  )

  const arriveAt = useMemo(() => new Date(arriveLocal), [arriveLocal])

  const input = { arriveAt, mode, baseMinutes, bufferMinutes: buffer }
  const plan = planTrip(input)
  const alts = compareModes({ arriveAt, baseMinutes, bufferMinutes: buffer })
  const condition = !plan.impossible ? trafficLabel(plan.multiplier) : null

  function applyPreset(id) {
    const preset = PRESETS.find((item) => item.id === id)
    setPresetId(id)
    if (!preset || id === 'custom') return
    setEventName(preset.eventName)
    setOrigin(preset.origin)
    setDestination(preset.destination)
    setBaseMinutes(preset.baseMinutes)
    setBuffer(preset.buffer)
    setArriveLocal(
      toDatetimeLocal(defaultArriveAt(preset.arriveHour, preset.arriveMinute)),
    )
  }

  return (
    <div className="page">
      <header className="nav">
        <a className="brand" href="#top">
          <span className="mark" aria-hidden="true" />
          LeaveBy
        </a>
        <nav>
          <a href="#planner">Planner</a>
          <a href="#how">How it works</a>
          <a className="nav-cta" href="#planner">
            Try the demo
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="eyebrow">Vibe-coded for people who are always “five minutes out”</p>
          <h1>
            Stop guessing
            <br />
            when to leave.
          </h1>
          <p className="lede">
            Your calendar says gym at 8:00. Traffic does not care. LeaveBy looks at
            when you need to arrive, how you want to get there, and tells you the
            actual time to walk out the door.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="#planner">
              Plan a leave time
            </a>
            <p className="fine">
              Prototype for MOR-531 · no Google account required
            </p>
          </div>
        </section>

        <section id="planner" className="planner-wrap">
          <div className="planner-copy">
            <p className="eyebrow">Interactive demo</p>
            <h2>When should you leave for the gym?</h2>
            <p>
              Pick a trip, choose walk / drive / transit, and LeaveBy applies a
              Los Angeles–style traffic curve to empty-road travel time. This is
              a working prototype — calendar and Maps sync are the next build.
            </p>
            <ul className="checklist">
              <li>Uses your arrive-by time, not a generic ETA</li>
              <li>Compares modes so a walk is not a surprise</li>
              <li>Adds a buffer so you are not sprinting from the lot</li>
            </ul>
          </div>

          <div className="planner">
            <div className="preset-row" role="tablist" aria-label="Trip presets">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  role="tab"
                  aria-selected={presetId === preset.id}
                  className={presetId === preset.id ? 'chip on' : 'chip'}
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <form
              className="form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label>
                Event
                <input
                  value={eventName}
                  onChange={(e) => {
                    setPresetId('custom')
                    setEventName(e.target.value)
                  }}
                  placeholder="Gym"
                />
              </label>
              <div className="row">
                <label>
                  From
                  <input
                    value={origin}
                    onChange={(e) => {
                      setPresetId('custom')
                      setOrigin(e.target.value)
                    }}
                    placeholder="Where you are"
                  />
                </label>
                <label>
                  To
                  <input
                    value={destination}
                    onChange={(e) => {
                      setPresetId('custom')
                      setDestination(e.target.value)
                    }}
                    placeholder="Where you need to be"
                  />
                </label>
              </div>
              <div className="row">
                <label>
                  Arrive by
                  <input
                    type="datetime-local"
                    value={arriveLocal}
                    onChange={(e) => setArriveLocal(e.target.value)}
                  />
                </label>
                <label>
                  Buffer (min)
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={buffer}
                    onChange={(e) => setBuffer(Number(e.target.value))}
                  />
                </label>
              </div>
              {presetId === 'custom' ? (
                <label>
                  Empty-road minutes ({MODES.find((m) => m.id === mode)?.label})
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={baseMinutes[mode]}
                    onChange={(e) =>
                      setBaseMinutes({
                        ...baseMinutes,
                        [mode]: Number(e.target.value),
                      })
                    }
                  />
                </label>
              ) : null}

              <fieldset className="modes">
                <legend>How you want to go</legend>
                {MODES.map((item) => (
                  <label key={item.id} className={mode === item.id ? 'mode on' : 'mode'}>
                    <input
                      type="radio"
                      name="mode"
                      value={item.id}
                      checked={mode === item.id}
                      onChange={() => setMode(item.id)}
                    />
                    {item.label}
                  </label>
                ))}
              </fieldset>
            </form>

            <ResultCard
              eventName={eventName || 'your plan'}
              origin={origin}
              destination={destination}
              plan={plan}
              condition={condition}
            />

            <div className="alts">
              <p className="alts-label">If you switched modes</p>
              <div className="alt-grid">
                {alts.map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    className={alt.id === mode ? 'alt on' : 'alt'}
                    onClick={() => setMode(alt.id)}
                    disabled={alt.plan.impossible}
                  >
                    <span>{alt.label}</span>
                    <strong>
                      {alt.plan.impossible
                        ? '—'
                        : `Leave ${formatTime(alt.plan.leaveAt)}`}
                    </strong>
                    <em>
                      {alt.plan.impossible
                        ? 'Not practical'
                        : `${alt.plan.travel} min travel`}
                    </em>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="how">
          <h2>How LeaveBy thinks</h2>
          <ol>
            <li>
              <strong>Start from the calendar, not the map.</strong>
              You already know you want to be at the gym at 8pm. The question is
              departure, not destination.
            </li>
            <li>
              <strong>Layer traffic on the way you travel.</strong>
              Driving at 5:30pm is not the same as walking at 8pm. Transit gets
              its own delay curve.
            </li>
            <li>
              <strong>Tell you a leave-by time, with a buffer.</strong>
              Output is a clock time you can set as an alarm — not a vague “leave
              soon.”
            </li>
          </ol>
        </section>

        <section className="problem">
          <div>
            <p className="eyebrow">Who it’s for</p>
            <h2>Busy people who plan their day in a calendar and then guess the commute.</h2>
            <p>
              Students, first jobs, and anyone in a traffic city who has stood at
              the door thinking “if I leave now I’ll be early… unless the 10 is a
              parking lot.”
            </p>
          </div>
          <blockquote>
            “I have gym at 8. I should leave at… 7:20? 7:40? I’ll just hope.”
            <cite>The current product: vibes</cite>
          </blockquote>
        </section>
      </main>

      <footer>
        <p>LeaveBy · Sadaf Sobhani · MOR-531 vibe coding</p>
        <p>Built with Cursor. Calendar + Google Maps sync is the next experiment.</p>
      </footer>
    </div>
  )
}

function ResultCard({ eventName, origin, destination, plan, condition }) {
  if (plan.impossible) {
    return (
      <div className="result warn">
        <p className="result-kicker">Cannot plan this mode</p>
        <h3>{plan.reason}</h3>
      </div>
    )
  }

  let kicker = 'Leave by'
  if (plan.missed) kicker = 'This arrival time has already passed'
  else if (plan.alreadyLate) kicker = 'You needed to already be on the way'

  return (
    <div className={`result ${plan.alreadyLate || plan.missed ? 'late' : ''}`}>
      <p className="result-kicker">{kicker}</p>
      <p className="clock">{formatTime(plan.leaveAt)}</p>
      <p className="result-meta">
        {formatDate(plan.leaveAt)} · {eventName}
        {origin && destination ? ` · ${origin} → ${destination}` : ''}
      </p>
      <dl>
        <div>
          <dt>Travel</dt>
          <dd>{plan.travel} min</dd>
        </div>
        <div>
          <dt>Buffer</dt>
          <dd>{plan.buffer} min</dd>
        </div>
        <div>
          <dt>Conditions</dt>
          <dd>
            <span className={`pill ${condition.tone}`}>{condition.text}</span>
          </dd>
        </div>
        <div>
          <dt>Arrive</dt>
          <dd>{formatTime(plan.arriveAt)}</dd>
        </div>
      </dl>
    </div>
  )
}
