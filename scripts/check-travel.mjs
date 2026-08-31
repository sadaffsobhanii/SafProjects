import assert from 'node:assert/strict'
import {
  compareModes,
  defaultArriveAt,
  estimateBases,
  leaveStatus,
  planTrip,
  trafficMultiplier,
} from '../src/travel.js'

const eightPm = defaultArriveAt(20, 0)
eightPm.setHours(20, 0, 0, 0)

const drive = planTrip({
  arriveAt: eightPm,
  mode: 'drive',
  baseMinutes: { drive: 18, walk: 62, transit: 38 },
  bufferMinutes: 8,
})

assert.equal(drive.impossible, false)
assert.equal(drive.travel > 18, true)
assert.equal(drive.leaveAt.getTime() < eightPm.getTime(), true)

const walk = planTrip({
  arriveAt: eightPm,
  mode: 'walk',
  baseMinutes: { drive: 18, walk: 62, transit: 38 },
  bufferMinutes: 8,
})
assert.equal(walk.travel, 62)
assert.equal(walk.leaveAt.getTime() < drive.leaveAt.getTime(), true)

const rush = new Date(eightPm)
rush.setHours(17, 30, 0, 0)
assert.equal(trafficMultiplier('drive', rush) > trafficMultiplier('drive', eightPm), true)

const alts = compareModes({
  arriveAt: eightPm,
  baseMinutes: { drive: 18, walk: 62, transit: 38 },
  bufferMinutes: 8,
})
assert.equal(alts.length, 3)

const longWalk = planTrip({
  arriveAt: eightPm,
  mode: 'walk',
  baseMinutes: { drive: 32, walk: 0, transit: 78 },
  bufferMinutes: 25,
})
assert.equal(longWalk.impossible, true)
assert.equal(estimateBases(10).walk > 10, true)
assert.equal(leaveStatus({ ...drive, minutesUntilLeave: 12, missed: false, alreadyLate: false, impossible: false }).tone, 'soon')

console.log('travel checks passed')
