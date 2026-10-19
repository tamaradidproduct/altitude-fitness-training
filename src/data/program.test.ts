import { describe, expect, it } from 'vitest'
import { buildPhases, totalSeconds } from '../lib/timer'
import { optionalCore, program, suggestedCore } from './program'
import { parsePrescription } from './laterWeeks'
import { WEEK_3_DESCRIPTIONS } from './week3Descriptions'

const allSessions = program.weeks.flatMap((w) => [w.core, w.stretch, ...w.workouts])

describe('12-week program', () => {
  it('has weeks 1–12 in order, in Base / Peak / Send phases', () => {
    expect(program.weeks.map((w) => w.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(program.weeks.map((w) => w.phase)).toEqual([
      ...Array(4).fill('Base'),
      ...Array(4).fill('Peak'),
      ...Array(4).fill('Send'),
    ])
  })

  it('gives every week core, stretch, three strength and two cardio sessions', () => {
    for (const w of program.weeks) {
      expect(w.workouts.map((x) => x.id)).toEqual(['strength-a', 'strength-b', 'strength-c', 'cardio-1', 'cardio-2'])
      expect(w.stretch.exercises.length).toBe(5)
      expect(w.core.exercises.length).toBeGreaterThanOrEqual(3)
      for (const s of w.workouts) expect(s.exercises.length).toBe(5)
    }
  })

  it('has a description and prescription for every exercise', () => {
    const missing = allSessions.flatMap((s) =>
      s.exercises.filter((e) => !e.description || !e.prescription).map((e) => e.name),
    )
    expect(missing).toEqual([])
  })

  it('uses 15/45, 30/30 and 45/15 cardio intervals by phase', () => {
    const interval = (week: number) => program.weeks[week - 1].workouts[3].interval
    expect(interval(1)).toEqual({ work: 15, rest: 45 })
    expect(interval(4)).toEqual({ work: 15, rest: 45 })
    expect(interval(5)).toEqual({ work: 30, rest: 30 })
    expect(interval(8)).toEqual({ work: 30, rest: 30 })
    expect(interval(9)).toEqual({ work: 45, rest: 15 })
    expect(interval(12)).toEqual({ work: 45, rest: 15 })
    expect(program.weeks[5].workouts[4].exercises[0].prescription).toBe('30s work / 30s recovery')
  })

  it('transcribes spot-checked cells from the PDF', () => {
    const w = (n: number) => program.weeks[n - 1]
    expect(w(3).core.exercises.map((e) => e.name)).toEqual([
      'Forearm Plank',
      'Glute Bridge with Block/Ball',
      'Super Woman',
      'Alternating Crunch',
    ])
    expect(w(4).core.exercises[0]).toMatchObject({ name: 'Forearm Plank', seconds: 90 })
    expect(w(8).core.exercises[2]).toMatchObject({ name: 'V-Sit / Boat Pose', seconds: 30, repeats: 3 })
    expect(w(9).core.exercises[0]).toMatchObject({ name: 'Side Plank', seconds: 30, perSide: true })
    expect(w(12).core.exercises[2]).toMatchObject({ name: 'Mountain Climbers', seconds: 60 })
    expect(w(5).workouts[0].exercises.map((e) => `${e.name}: ${e.prescription}`)).toEqual([
      'Goblet Squat: 12 reps',
      'Weighted Split Squat: 8 each side',
      'Dumbbell Chest Press: 10 reps',
      'Weighted Calf Raise: 15 reps',
      'Lateral Lunge: 10 each side',
    ])
    expect(w(7).workouts[2].exercises[1]).toMatchObject({ name: 'Weighted Wall Sit', seconds: 45 })
    expect(w(11).workouts[2].exercises[1]).toMatchObject({ name: '4-sec Squat + 10-sec Hold', prescription: '8 reps' })
    expect(w(12).workouts[1].exercises[1].name).toBe('Weighted 5-sec Step-Down')
    expect(w(10).workouts[3].exercises.map((e) => e.name)).toEqual([
      'Fast Feet + Direction Change',
      'Power Jacks',
      'High Knees + Arms',
      'Lateral Shuffle + Touch',
      'Skaters + Reach',
    ])
    expect(w(12).workouts[4].exercises[4].name).toBe('Burpees')
  })

  it('explains modifiers like Weighted and N-sec Eccentric in the description', () => {
    const e = program.weeks[10].workouts[0].exercises[0]
    expect(e.name).toBe('4-sec Eccentric Dumbbell Front Squat')
    expect(e.description).toContain('Take 4 seconds to lower')
    const weighted = program.weeks[4].workouts[0].exercises[3]
    expect(weighted.description).toContain('Hold a dumbbell or kettlebell')
  })

  it('builds a timer for every session in every week', () => {
    for (const s of allSessions) expect(buildPhases(s).length).toBeGreaterThan(0)
    // Strength sessions have no timed holds beyond wall sits; spot-check a long stretch routine.
    const stretch = buildPhases(program.weeks[2].stretch)
    expect(totalSeconds(stretch)).toBeGreaterThan(300)
  })

  it('repeats holds and runs two-sided timed moves once per side', () => {
    const labels = buildPhases(program.weeks[7].core).map((p) => p.label)
    expect(labels.filter((l) => l.startsWith('V-Sit / Boat Pose'))).toEqual([
      'V-Sit / Boat Pose · 1 of 3',
      'V-Sit / Boat Pose · 2 of 3',
      'V-Sit / Boat Pose · 3 of 3',
    ])
    const week7 = buildPhases(program.weeks[6].core).map((p) => p.label)
    expect(week7).toContain('Single-Leg Glute Bridge — Left')
    expect(week7).toContain('Single-Leg Glute Bridge — Right')
  })
})

describe('Week 3 (from its own PDF)', () => {
  const week3 = program.weeks[2]
  const sessions = [week3.core, week3.stretch, ...week3.workouts]

  it('has exactly the exercises, in order, that the Week 3 PDF lists for each session', () => {
    for (const session of sessions) {
      const fromPdf = Object.keys(WEEK_3_DESCRIPTIONS)
        .filter((k) => k.startsWith(`${session.id}|`))
        .map((k) => k.slice(session.id.length + 1))
      expect(session.exercises.map((e) => e.name)).toEqual(fromPdf)
    }
  })

  it('uses the PDF\'s descriptions word for word, including each Monster Walk', () => {
    for (const session of sessions)
      for (const ex of session.exercises) expect(ex.description).toBe(WEEK_3_DESCRIPTIONS[`${session.id}|${ex.name}`])
    expect(week3.workouts[0].exercises[4].description).toContain('forward and outward')
    expect(week3.workouts[2].exercises[3].description).toContain('collapse inward')
  })

  it('links the Week 3 PDF and lists only a resistance band for Strength B, as the PDF does', () => {
    expect(week3.pdf).toBe('pdf/week-3.pdf')
    expect(week3.workouts[1].equipment).toEqual(['Resistance Band'])
    expect(program.weeks[3].pdf).toBeUndefined()
  })

  it('reuses its wording in later weeks for the same exercise', () => {
    const arnold = program.weeks[3].workouts[2].exercises[4]
    expect(arnold.name).toBe('Arnold Press')
    expect(arnold.description).toBe(WEEK_3_DESCRIPTIONS['strength-c|Arnold Press'])
  })
})

describe('parsePrescription', () => {
  it('reads timed, repeated, two-sided and plain rep prescriptions', () => {
    expect(parsePrescription('45 sec')).toEqual({ seconds: 45 })
    expect(parsePrescription('30 sec each side')).toEqual({ seconds: 30, perSide: true })
    expect(parsePrescription('15 sec hold ×2')).toEqual({ seconds: 15, repeats: 2 })
    expect(parsePrescription('8 each side')).toEqual({ perSide: true })
    expect(parsePrescription('12 reps')).toEqual({})
    expect(parsePrescription('15 each side, alternating')).toEqual({})
  })
})

describe('suggested optional core', () => {
  it('only suggests exercises that exist in the optional list', () => {
    const names = optionalCore.map((e) => e.name)
    for (const phase of Object.values(suggestedCore)) for (const n of Object.keys(phase)) expect(names).toContain(n)
  })

  it('includes the teaser variations', () => {
    const names = optionalCore.map((e) => e.name)
    for (const n of ['Teaser with Leg Lowers', 'Teaser Hold', 'Teaser with Twist', 'Teaser with Weight']) expect(names).toContain(n)
  })
})
