import { describe, expect, it } from 'vitest'
import { program } from '../data/program'
import { DEFAULT_PROFILE, estimateSession, manualSeconds, restingKcalPerHour, roundKcal } from './calories'

const week = (n: number) => program.weeks[n - 1]

describe('restingKcalPerHour', () => {
  it('uses Mifflin-St Jeor for the default 155 lb, 38-year-old woman (5\'5")', () => {
    // 10×70.31 + 6.25×165.1 − 5×38 − 161 = 1384.6 kcal/day
    expect(restingKcalPerHour(DEFAULT_PROFILE)).toBeCloseTo(1384.6 / 24, 0)
  })

  it('rises with weight and falls with age; men burn more than women', () => {
    const base = restingKcalPerHour(DEFAULT_PROFILE)
    expect(restingKcalPerHour({ ...DEFAULT_PROFILE, weightLb: 200 })).toBeGreaterThan(base)
    expect(restingKcalPerHour({ ...DEFAULT_PROFILE, ageYears: 58 })).toBeLessThan(base)
    expect(restingKcalPerHour({ ...DEFAULT_PROFILE, sex: 'male' })).toBeGreaterThan(base)
  })
})

describe('manualSeconds', () => {
  it('estimates about 3 seconds a rep plus setup', () => {
    expect(manualSeconds('Squat', '12 reps')).toBe(12 * 3 + 10)
  })

  it('counts both sides of "each side" prescriptions and slows down for tempo reps', () => {
    expect(manualSeconds('Alternating Crunch', '15 each side, alternating')).toBe(30 * 3 + 10)
    expect(manualSeconds('4-sec Eccentric Goblet Squat', '10 reps')).toBe(10 * 5.5 + 10)
  })

  it('treats second-based details as that many seconds', () => {
    expect(manualSeconds('Hold', '30 sec')).toBe(35)
  })
})

describe('estimateSession', () => {
  const kcal = (s: Parameters<typeof estimateSession>[0], n: number) => estimateSession(s, n, DEFAULT_PROFILE).kcal

  it('gives sensible totals and durations for Week 1', () => {
    const cardio = estimateSession(week(1).workouts[3], 1, DEFAULT_PROFILE)
    expect(cardio.seconds).toBe(19 * 60)
    expect(cardio.kcal).toBeGreaterThan(30)
    expect(cardio.kcal).toBeLessThan(90)
    const strength = estimateSession(week(1).workouts[0], 1, DEFAULT_PROFILE)
    expect(strength.seconds / 60).toBeGreaterThan(12)
    expect(strength.seconds / 60).toBeLessThan(22)
  })

  it('burns more as the program gets harder', () => {
    expect(kcal(week(8).workouts[3], 8)).toBeGreaterThan(kcal(week(1).workouts[3], 1))
    expect(kcal(week(12).workouts[3], 12)).toBeGreaterThan(kcal(week(8).workouts[3], 8))
    expect(kcal(week(12).workouts[0], 12)).toBeGreaterThan(kcal(week(1).workouts[0], 1))
  })

  it('scales with body weight', () => {
    const heavier = estimateSession(week(5).workouts[0], 5, { ...DEFAULT_PROFILE, weightLb: 200 }).kcal
    expect(heavier).toBeGreaterThan(kcal(week(5).workouts[0], 5))
  })

  it('uses an exercise MET override (optional core)', () => {
    const core = week(1).core
    const harder = { ...core, exercises: core.exercises.map((e) => ({ ...e, met: 8 })) }
    expect(kcal(harder, 1)).toBeGreaterThan(kcal(core, 1))
  })
})

describe('roundKcal', () => {
  it('rounds to the nearest 5', () => {
    expect(roundKcal(52.4)).toBe(50)
    expect(roundKcal(53)).toBe(55)
  })
})
