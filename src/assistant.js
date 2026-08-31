import { formatTime } from './travel.js'

export const SUGGESTED_PROMPTS = [
  'What time should I leave my house?',
  'I get off work at 6pm. Can I gym before dinner at Bestia at 8:30?',
  'Which gym routine should I hit today?',
]

const WORK_RE =
  /(?:end(?:s)? work|get off|off work|leave work|work ends?|finish(?:es)? work|i end work)\s*(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i
const AT_RE = /(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i

export function parseHourMinute(text, { hour, minute = 0, meridiem } = {}) {
  let h = Number(hour)
  const m = Number(minute) || 0
  const mer = (meridiem || '').replace(/\./g, '').toLowerCase()
  if (mer === 'pm' && h < 12) h += 12
  if (mer === 'am' && h === 12) h = 0
  if (!mer && h >= 1 && h <= 7) h += 12
  return { hour: h, minute: m }
}

function dateOnSameDay(base, hour, minute) {
  const date = new Date(base)
  date.setHours(hour, minute, 0, 0)
  return date
}

function findNamed(events, ...names) {
  return events.find((event) =>
    names.some((name) => event.title.toLowerCase().includes(name)),
  )
}

function leaveLine(event) {
  if (!event?.plan || event.plan.impossible) {
    return `${event.title} is too far to walk — switch to drive or transit.`
  }
  return `Leave by ${formatTime(event.plan.leaveAt)} for ${event.title} at ${formatTime(event.arriveAt)} (${event.plan.travel} min travel + ${event.plan.buffer} min buffer).`
}

function routineForMinutes(minutes) {
  if (minutes < 20) {
    return {
      length: `${Math.max(10, minutes)} minutes`,
      name: 'Express core + stretch',
      detail: 'No full lift. Do 8–10 minutes of planks, dead bugs, and hip openers so you still move without blowing dinner.',
    }
  }
  if (minutes < 35) {
    return {
      length: '20–25 minutes',
      name: 'Upper push (no cardio)',
      detail: 'Bench or push-ups, overhead press, one arm isolation. Skip legs and the shower-at-the-gym if you are tight on time — rinse at home.',
    }
  }
  if (minutes < 55) {
    return {
      length: '35–45 minutes',
      name: 'Push or pull day',
      detail: 'A normal PPL half-session: 4 compounds, skip accessories. That still counts as training today.',
    }
  }
  return {
    length: '60 minutes',
    name: 'Full lift (push / pull / legs as scheduled)',
    detail: 'You have enough time for your usual split plus a 10-minute cool down.',
  }
}

function eveningPlan(events, { workAt, dinnerAt } = {}) {
  const gym = findNamed(events, 'gym')
  const dinner = findNamed(events, 'dinner')
  const dayAnchor = dinner?.arriveAt || gym?.arriveAt || events[0]?.arriveAt || new Date()

  const workEnd = workAt
    ? dateOnSameDay(dayAnchor, workAt.hour, workAt.minute)
    : null
  const dinnerTime = dinnerAt
    ? dateOnSameDay(dayAnchor, dinnerAt.hour, dinnerAt.minute)
    : dinner?.arriveAt

  if (!gym && !dinnerTime) {
    return 'I need a gym or dinner on the calendar to plan that evening. Add them, or tell me the times.'
  }

  const toGym = gym
    ? gym.plan.travel + gym.plan.buffer
    : 25
  const toDinner = dinner
    ? dinner.plan.travel + dinner.plan.buffer
    : 20

  if (workEnd && dinnerTime) {
    const arriveGym = new Date(workEnd.getTime() + toGym * 60_000)
    const leaveForDinner = new Date(dinnerTime.getTime() - toDinner * 60_000)
    const gymMinutes = Math.round((leaveForDinner - arriveGym) / 60_000)
    const leaveHouse = workEnd

    if (gymMinutes < 15) {
      return [
        `Work ending at ${formatTime(workEnd)} and dinner at ${formatTime(dinnerTime)} does not leave a real gym window.`,
        `Travel to the gym is about ${toGym} min and you need to leave for dinner by ${formatTime(leaveForDinner)}.`,
        `Do not squeeze a workout in. Leave the house at ${formatTime(leaveHouse)}, skip the gym (or do 10 min at home), and go straight toward dinner. Lift tomorrow morning or after dinner if the restaurant is close.`,
      ].join(' ')
    }

    const routine = routineForMinutes(gymMinutes)
    const gymStart = arriveGym
    return [
      `Leave the house when work ends — ${formatTime(leaveHouse)} — and drive to the gym (about ${toGym} min, including buffer).`,
      `Start the session around ${formatTime(gymStart)}. You have about ${gymMinutes} minutes on the floor before you should leave for dinner at ${formatTime(leaveForDinner)}.`,
      `Keep the gym to ${routine.length}: ${routine.name}. ${routine.detail}`,
      dinner
        ? `Dinner is ${leaveLine(dinner)}`
        : `Be walking into dinner at ${formatTime(dinnerTime)}.`,
    ].join(' ')
  }

  if (gym && dinner) {
    const gymEnd = new Date(gym.arriveAt.getTime() + 55 * 60_000)
    const clash = gymEnd > dinner.plan.leaveAt
    const minutes = Math.round((dinner.plan.leaveAt - gym.arriveAt) / 60_000)
    const routine = routineForMinutes(Math.max(minutes, 20))
    return [
      leaveLine(gym),
      leaveLine(dinner),
      clash
        ? `Those two overlap if you do a full hour. Cap the gym at ${routine.length} (${routine.name}) so you can leave the gym by ${formatTime(dinner.plan.leaveAt)}.`
        : `A ${routine.length} ${routine.name} fits before dinner. ${routine.detail}`,
    ].join(' ')
  }

  if (gym) return leaveLine(gym)
  return leaveLine(dinner)
}

export function replyTo(message, { events = [], home = 'home' } = {}) {
  const text = message.trim()
  const lower = text.toLowerCase()
  if (!text) return 'Ask me when to leave, or how to fit the gym around dinner.'

  const workMatch = text.match(WORK_RE)
  const workAt = workMatch
    ? parseHourMinute(text, {
        hour: workMatch[1],
        minute: workMatch[2],
        meridiem: workMatch[3],
      })
    : null

  let dinnerAt = null
  const dinnerTalk = /dinner/.test(lower)
  if (dinnerTalk) {
    const afterDinner = text.split(/dinner/i)[1] || text
    const time = afterDinner.match(AT_RE)
    if (time) {
      dinnerAt = parseHourMinute(text, {
        hour: time[1],
        minute: time[2],
        meridiem: time[3],
      })
    }
  }

  const wantsLeave = /leave|when should i go|what time should i leave/.test(lower)
  const wantsGym = /gym|workout|lift|routine|session/.test(lower)
  const wantsRoutine = /routine|which (day|split)|what should i (hit|train)|how long/.test(lower)
  const squeezedEvening = Boolean(workAt) || (wantsGym && dinnerTalk)

  if (squeezedEvening || (wantsGym && (workAt || dinnerTalk || wantsRoutine))) {
    return eveningPlan(events, { workAt, dinnerAt })
  }

  if (wantsLeave) {
    const next = events.find((event) => !event.plan?.missed) || events[0]
    if (!next) {
      return `I do not see events yet. Open your sample day and I can tell you when to leave ${home}.`
    }
    if (lower.includes('house') || lower.includes('home')) {
      return `From ${home}: ${leaveLine(next)} If you meant a later event, name it (gym, class, dinner).`
    }
    const named = findNamed(events, 'gym', 'class', 'dinner', 'coffee', 'interview')
    const target =
      (lower.includes('gym') && findNamed(events, 'gym')) ||
      (lower.includes('dinner') && findNamed(events, 'dinner')) ||
      (lower.includes('class') && findNamed(events, 'class')) ||
      next
    return leaveLine(target || named)
  }

  if (wantsRoutine) {
    const gym = findNamed(events, 'gym')
    const dinner = findNamed(events, 'dinner')
    if (gym && dinner) return eveningPlan(events, {})
    return routineForMinutes(55).detail
  }

  const next = events.find((event) => !event.plan?.missed) || events[0]
  if (next) {
    return `Here is the next thing on your calendar. ${leaveLine(next)} You can also ask: “What time should I leave my house?” or “I end work at 6pm, gym, dinner at 7 — what do I do?”`
  }

  return 'Ask when to leave, or tell me when work ends and I will fit gym + dinner around it.'
}
