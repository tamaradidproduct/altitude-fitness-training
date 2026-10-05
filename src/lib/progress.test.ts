import { describe, expect, it } from 'vitest'
import { week1 } from '../data/program'
import { checkAllSets, emptyProgress, isRoundChecked, setRoundChecked, syncCompletion, isoDate, markDaily, resetWeek, setCompleted, toggleDaily, toggleSet, weekDates } from './progress'

describe('progress helpers', () => {
  it('toggles sets on and off', () => {
    let p = toggleSet(emptyProgress(), '1:strength-a', '1-0')
    expect(p.checks['1:strength-a']).toEqual(['1-0'])
    p = toggleSet(p, '1:strength-a', '1-0')
    expect(p.checks['1:strength-a']).toEqual([])
  })

  it('marks and clears completion', () => {
    let p = setCompleted(emptyProgress(), '1:cardio-1', '2026-10-05')
    expect(p.completed['1:cardio-1']).toBe('2026-10-05')
    p = setCompleted(p, '1:cardio-1', null)
    expect(p.completed).toEqual({})
  })

  it('toggles daily core/stretch independently', () => {
    const p = toggleDaily(emptyProgress(), '2026-10-05', 'core')
    expect(p.daily['2026-10-05']).toEqual({ core: true })
  })

  it('tracks the daily workout and never un-marks via markDaily', () => {
    let p = markDaily(emptyProgress(), '2026-10-05', 'workout')
    p = markDaily(p, '2026-10-05', 'workout')
    expect(p.daily['2026-10-05']).toEqual({ workout: true })
  })

  it('reset only clears the given week', () => {
    let p = setCompleted(emptyProgress(), '1:strength-a', '2026-10-05')
    p = setCompleted(p, '2:strength-a', '2026-10-12')
    p = toggleDaily(p, '2026-10-05', 'core')
    p = resetWeek(p, 1, ['2026-10-05'])
    expect(p.completed).toEqual({ '2:strength-a': '2026-10-12' })
    expect(p.daily).toEqual({})
  })

  it('weekDates runs Monday through Sunday', () => {
    const dates = weekDates(new Date(2026, 9, 8)).map(isoDate) // Thu Oct 8
    expect(dates[0]).toBe('2026-10-05')
    expect(dates[6]).toBe('2026-10-11')
  })
})

describe('round completion', () => {
  const session = week1.workouts[0]
  const key = '1:strength-a'

  it('checks and clears a single round', () => {
    let p = setRoundChecked(emptyProgress(), key, session, 2, true)
    expect(isRoundChecked(p.checks[key], session, 2)).toBe(true)
    expect(isRoundChecked(p.checks[key], session, 1)).toBe(false)
    p = setRoundChecked(p, key, session, 2, false)
    expect(p.checks[key]).toEqual([])
  })

  it('completes the workout and the daily dot only when every round is checked', () => {
    let p = emptyProgress()
    for (const r of [1, 2]) p = setRoundChecked(p, key, session, r, true)
    p = syncCompletion(p, 1, session, '2026-10-05')
    expect(p.completed[key]).toBeUndefined()
    p = syncCompletion(setRoundChecked(p, key, session, 3, true), 1, session, '2026-10-05')
    expect(p.completed[key]).toBe('2026-10-05')
    expect(p.daily['2026-10-05']).toEqual({ workout: true })
    p = syncCompletion(setRoundChecked(p, key, session, 1, false), 1, session, '2026-10-06')
    expect(p.completed[key]).toBeUndefined()
  })

  it('checkAllSets fills every set', () => {
    expect(checkAllSets(emptyProgress(), key, session).checks[key]).toHaveLength(15)
  })
})
