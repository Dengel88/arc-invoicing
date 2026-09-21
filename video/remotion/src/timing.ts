/**
 * Frame-accurate shot durations at 30fps, matching video/SCRIPT.md exactly. Change a
 * duration here and every shot's `<Sequence>` offset in Trailer.tsx recomputes — shots
 * never need their own hardcoded start frame.
 */
import {FPS} from './theme'

const sec = (s: number) => Math.round(s * FPS)

export const SHOTS = [
  {id: 'cold-open', duration: sec(4)},
  {id: 'problem', duration: sec(8)},
  {id: 'turn', duration: sec(5)},
  {id: 'issue', duration: sec(10)},
  {id: 'pay', duration: sec(11)},
  {id: 'why-arc', duration: sec(12)},
  {id: 'proof', duration: sec(6)},
  {id: 'close', duration: sec(6)},
] as const

export type ShotId = (typeof SHOTS)[number]['id']

export const shotStart = (id: ShotId): number => {
  let acc = 0
  for (const s of SHOTS) {
    if (s.id === id) return acc
    acc += s.duration
  }
  throw new Error(`Unknown shot id: ${id}`)
}

export const shotDuration = (id: ShotId): number =>
  SHOTS.find((s) => s.id === id)!.duration

export const TOTAL_DURATION = SHOTS.reduce((sum, s) => sum + s.duration, 0)
