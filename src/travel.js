export const MODES = [
  { id: 'drive', label: 'Drive', verb: 'driving' },
  { id: 'walk', label: 'Walk', verb: 'walking' },
  { id: 'transit', label: 'Transit', verb: 'on transit' },
]

export const DAY_START_HOUR = 8
export const DAY_END_HOUR = 22
export const HOUR_HEIGHT = 52

export function atDayTime(hour, minute) {
  return defaultArriveAt(hour, minute)
}

export function eventLayout(event) {
  const start = event.arriveAt
  const end = event.endsAt || new Date(start.getTime() + 60 * 60_000)
  const startMin = start.getHours() * 60 + start.getMinutes()
  const endMin = end.getHours() * 60 + end.getMinutes()
  const origin = DAY_START_HOUR * 60
  return {
    top: ((startMin - origin) / 60) * HOUR_HEIGHT,
    height: Math.max(22, ((endMin - startMin) / 60) * HOUR_HEIGHT - 4),
    lane: event.lane || 0,
  }
}

export function formatRange(start, end) {
  const sameMeridiem =
    start.toLocaleTimeString('en-US', { hour: 'numeric' }).slice(-2) ===
    end.toLocaleTimeString('en-US', { hour: 'numeric' }).slice(-2)
  const startLabel = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const endLabel = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  if (sameMeridiem) {
    return `${startLabel.replace(/ [AP]M/, '')} – ${endLabel}`
  }
  return `${startLabel} – ${endLabel}`
}

export const EVENT_COLORS = ['#7ec8c4', '#c5b4e3', '#9fd6e8', '#f3c89b', '#34a853', '#0b8043']

export function estimateBases(driveMinutes) {
  const drive = Math.max(1, Number(driveMinutes) || 20)
  return {
    drive,
    walk: Math.round(drive * 3.2),
    transit: Math.round(drive * 1.85),
  }
}

export function leaveStatus(plan) {
  if (plan.impossible) return { text: 'Pick another mode', tone: 'muted' }
  if (plan.missed) return { text: 'Event already started', tone: 'late' }
  if (plan.alreadyLate) return { text: 'Leave now', tone: 'late' }
  if (plan.minutesUntilLeave < 60) {
    return { text: `Leave in ${plan.minutesUntilLeave} min`, tone: 'soon' }
  }
  const hours = Math.floor(plan.minutesUntilLeave / 60)
  const mins = plan.minutesUntilLeave % 60
  return { text: `Leave in ${hours}h ${mins}m`, tone: 'ok' }
}

export const SAMPLE_CALENDAR = [
  {
    id: 'work',
    title: 'Work',
    color: '#c5e8f2',
    accent: '#5aa7bc',
    location: 'Office, Downtown LA',
    startHour: 9,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    baseMinutes: { drive: 22, walk: 68, transit: 42 },
    buffer: 10,
  },
  {
    id: 'gym',
    title: 'Gym',
    color: '#c8ebe3',
    accent: '#3d9a86',
    location: 'Equinox, Downtown LA',
    startHour: 19,
    startMinute: 0,
    endHour: 20,
    endMinute: 0,
    origin: 'Office, Downtown LA',
    baseMinutes: { drive: 14, walk: 28, transit: 22 },
    buffer: 8,
  },
  {
    id: 'dinner',
    title: 'Dinner with friends',
    color: '#f6d7b8',
    accent: '#c4843c',
    location: 'Bestia, Arts District',
    startHour: 20,
    startMinute: 30,
    endHour: 22,
    endMinute: 0,
    origin: 'Equinox, Downtown LA',
    baseMinutes: { drive: 12, walk: 24, transit: 20 },
    buffer: 8,
  },
]

function hourFromDate(date) {
  return date.getHours() + date.getMinutes() / 60
}

/** Los Angeles-style congestion curve. 1 = empty-road time. */
export function trafficMultiplier(mode, arriveAt) {
  const h = hourFromDate(arriveAt)

  if (mode === 'walk') {
    return h >= 21 || h < 6 ? 1.06 : 1
  }

  if (mode === 'transit') {
    if (h >= 7 && h < 9.5) return 1.28
    if (h >= 16 && h < 19) return 1.32
    if (h >= 9.5 && h < 16) return 1.12
    return 1.05
  }

  // drive
  if (h >= 7 && h < 10) return 1.58
  if (h >= 15.5 && h < 19) return 1.72
  if (h >= 19 && h < 21) return 1.22
  if (h >= 10 && h < 15.5) return 1.18
  if (h >= 6 && h < 7) return 1.2
  return 0.92
}

export function trafficLabel(multiplier) {
  if (multiplier >= 1.5) return { tone: 'heavy', text: 'Heavy traffic' }
  if (multiplier >= 1.2) return { tone: 'busy', text: 'Busy roads' }
  if (multiplier >= 1.05) return { tone: 'light', text: 'Typical flow' }
  return { tone: 'clear', text: 'Light traffic' }
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function planTrip({ arriveAt, mode, baseMinutes, bufferMinutes }) {
  const base = Number(baseMinutes[mode]) || 0
  if (mode === 'walk' && base <= 0) {
    return { impossible: true, reason: 'Walking this far is not practical.' }
  }

  const multiplier = trafficMultiplier(mode, arriveAt)
  const travel = base <= 0 ? 0 : Math.max(1, Math.round(base * multiplier))
  const buffer = Number(bufferMinutes) || 0
  const leaveAt = new Date(arriveAt.getTime() - (travel + buffer) * 60_000)
  const now = new Date()
  const minutesUntilLeave = Math.round((leaveAt.getTime() - now.getTime()) / 60_000)

  return {
    impossible: false,
    mode,
    multiplier,
    travel,
    buffer,
    leaveAt,
    arriveAt,
    minutesUntilLeave,
    alreadyLate: leaveAt.getTime() < now.getTime() && arriveAt.getTime() > now.getTime(),
    missed: arriveAt.getTime() <= now.getTime(),
  }
}

export function compareModes(input) {
  return MODES.map((mode) => ({
    ...mode,
    plan: planTrip({ ...input, mode: mode.id }),
  }))
}

export function defaultArriveAt(hour, minute) {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  if (date.getTime() < Date.now() + 20 * 60_000) {
    date.setDate(date.getDate() + 1)
  }
  return date
}

export function toDatetimeLocal(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
