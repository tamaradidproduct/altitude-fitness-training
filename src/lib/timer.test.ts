import { describe, expect, it } from 'vitest'
import { week1 } from '../data/program'
import { buildFlowPhases, buildPhases, formatClock, totalSeconds } from './timer'

describe('buildPhases', () => {
  it('builds cardio: 2-min warm-up, 3×5 of 15s/45s, 2-min cooldown', () => {
    const phases = buildPhases(week1.workouts.find((w) => w.id === 'cardio-1')!)
    expect(phases.filter((p) => p.kind === 'warmup')).toHaveLength(4)
    expect(phases.filter((p) => p.kind === 'work')).toHaveLength(15)
    expect(phases.filter((p) => p.kind === 'cooldown')).toHaveLength(4)
    expect(totalSeconds(phases)).toBe(120 + 15 * 60 + 120)
  })

  it('splits per-side holds and adds rests for core', () => {
    const phases = buildPhases(week1.core)
    expect(phases.map((p) => p.label)).toContain('Bird Dog — Left')
    expect(phases.map((p) => p.label)).toContain('Bird Dog — Right')
    expect(totalSeconds(phases)).toBe(60 + 60 + 60 + 60)
  })

  it('stretch totals 5 minutes', () => {
    expect(totalSeconds(buildPhases(week1.stretch))).toBe(300)
  })
})

describe('formatClock', () => {
  it('formats m:ss', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(75)).toBe('1:15')
    expect(formatClock(-3)).toBe('0:00')
  })
})

describe('buildFlowPhases', () => {
  it('chains core, workout and stretch, with rep-based strength steps manual', () => {
    const strength = week1.workouts.find((w) => w.id === 'strength-a')!
    const phases = buildFlowPhases([week1.core, strength, week1.stretch])
    expect(phases[0].section).toBe('Core')
    expect(phases.at(-1)!.section).toBe('Stretch + Mobility')
    const manual = phases.filter((p) => p.manual)
    expect(manual).toHaveLength(15)
    expect(manual[0]).toMatchObject({ label: 'Bodyweight Squat', detail: '12 reps', round: 1 })
  })

  it('keeps timed strength holds (wall sit) on a countdown', () => {
    const c = week1.workouts.find((w) => w.id === 'strength-c')!
    const wallSit = buildPhases(c).filter((p) => p.label === 'Wall Sit')
    expect(wallSit).toHaveLength(3)
    expect(wallSit.every((p) => !p.manual && p.seconds === 30)).toBe(true)
  })
})
