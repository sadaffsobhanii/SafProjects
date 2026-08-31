export const MODES = [
  { id: 'drive', label: 'Drive', verb: 'driving' },
  { id: 'walk', label: 'Walk', verb: 'walking' },
  { id: 'transit', label: 'Transit', verb: 'on transit' },
]

export const EVENT_COLORS = ['#039be5', '#33b679', '#d50000', '#f6bf26', '#8e24aa', '#0b8043']

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
    id: 'class',
    title: 'MOR-531',
    color: '#039be5',
    origin: 'Home, West Adams',
    location: 'USC Marshall',
    arriveHour: 9,
    arriveMinute: 0,
    baseMinutes: { drive: 16, walk: 48, transit: 32 },
    buffer: 10,
  },
  {
    id: 'coffee',
    title: 'Coffee with teammate',
    color: '#33b679',
    origin: 'USC Marshall',
    location: 'Blue Bottle, DTLA',
    arriveHour: 12,
    arriveMinute: 30,
    baseMinutes: { drive: 14, walk: 40, transit: 28 },
    buffer: 8,
  },
  {
    id: 'gym',
    title: 'Gym',
    color: '#d50000',
    origin: 'Apartment, Koreatown',
    location: 'Equinox, Downtown LA',
    arriveHour: 20,
    arriveMinute: 0,
    baseMinutes: { drive: 18, walk: 62, transit: 38 },
    buffer: 8,
  },
  {
    id: 'dinner',
    title: 'Dinner',
    color: '#8e24aa',
    origin: 'Equinox, Downtown LA',
    location: 'Bestia, Arts District',
    arriveHour: 21,
    arriveMinute: 0,
    baseMinutes: { drive: 12, walk: 28, transit: 22 },
    buffer: 6,
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
  const travel = Math.max(1, Math.round(base * multiplier))
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
