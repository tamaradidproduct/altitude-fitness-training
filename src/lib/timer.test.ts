import { describe, expect, it } from 'vitest'
import { optionalCore, week1, week2 } from '../data/program'
import { AUTO_REST_SECONDS, buildFlowPhases, buildPhases, formatClock, totalSeconds } from './timer'

const workout = (week: typeof week1, id: string) => week.workouts.find((w) => w.id === id)!

describe('buildPhases', () => {
  it('builds cardio: 2-min warm-up, 3×5 of 15s/45s, 2-min cooldown', () => {
    const phases = buildPhases(workout(week1, 'cardio-1'))
    expect(phases.filter((p) => p.kind === 'warmup')).toHaveLength(4)
    expect(phases.filter((p) => p.kind === 'work')).toHaveLength(15)
    expect(phases.filter((p) => p.kind === 'cooldown')).toHaveLength(4)
    // Recovery is built in, so no extra 10s rests are added.
    expect(totalSeconds(phases)).toBe(120 + 15 * 60 + 120)
  })

  it('does a timed two-sided exercise once per side, with a switch rest between', () => {
    const labels = buildPhases(week1.core).map((p) => p.label)
    const i = labels.indexOf('Bird Dog — Left')
    expect(labels.slice(i, i + 3)).toEqual(['Bird Dog — Left', 'Switch sides', 'Bird Dog — Right'])
  })

  it('uses built-in rest where the program has one, and 10s otherwise', () => {
    const phases = buildPhases(week1.core)
    const rests = phases.filter((p) => p.kind === 'rest')
    // Plank + Glute Bridge: 30s built in. Bird Dog: 10s between sides and 10s before Super Woman.
    expect(rests.map((r) => r.seconds)).toEqual([30, 30, AUTO_REST_SECONDS, AUTO_REST_SECONDS])
    expect(totalSeconds(phases)).toBe(30 + 30 + 30 + 30 + 30 + 10 + 30 + 10 + 60)
  })

  it('never adds a trailing 10s rest after the last exercise of a section', () => {
    for (const session of [week1.stretch, week2.stretch, week2.core]) {
      const phases = buildPhases(session)
      const last = phases[phases.length - 1]
      expect(last.kind === 'rest' && last.seconds === AUTO_REST_SECONDS).toBe(false)
    }
  })

  it('puts 10s between every stretch move, including between sides', () => {
    const phases = buildPhases(week1.stretch)
    expect(phases.filter((p) => p.kind === 'rest')).toHaveLength(8)
    expect(totalSeconds(phases)).toBe(8 * 30 + 60 + 8 * AUTO_REST_SECONDS)
  })

  it('shows the exercise description on work phases and the upcoming one on rests', () => {
    const phases = buildPhases(week1.stretch)
    const quad = phases.find((p) => p.label === 'Standing Quad Stretch — Left')!
    expect(quad.description).toBe(week1.stretch.exercises[0].description)
    const rest = phases[phases.indexOf(quad) + 1]
    expect(rest.kind).toBe('rest')
    expect(rest.description).toBe(week1.stretch.exercises[0].description)
  })

  it('shows the next cardio move\'s description during recovery', () => {
    const cardio = workout(week2, 'cardio-1')
    const phases = buildPhases(cardio)
    const firstRecover = phases.find((p) => p.label === 'Recover')!
    expect(firstRecover.description).toBe(cardio.exercises[1].description)
  })
})

describe('rep-based two-sided exercises', () => {
  it('repeats once on each side within every round', () => {
    const phases = buildPhases(workout(week1, 'strength-a')).filter((p) => p.round === 1)
    expect(phases.map((p) => p.label)).toEqual([
      'Bodyweight Squat',
      'Reverse Lunge — Left',
      'Reverse Lunge — Right',
      'Incline Push-Up',
      'Calf Raise',
      'Band Lateral Walk — Left',
      'Band Lateral Walk — Right',
    ])
    expect(phases.find((p) => p.label === 'Reverse Lunge — Left')).toMatchObject({ manual: true, detail: '8 reps' })
  })

  it('does the Week 2 Bird Dog Crunch once per side', () => {
    const labels = buildPhases(week2.core).map((p) => p.label)
    expect(labels).toContain('Bird Dog Crunch — Left')
    expect(labels).toContain('Bird Dog Crunch — Right')
  })
})

describe('buildFlowPhases', () => {
  it('chains core, workout and stretch, with rep-based strength steps manual', () => {
    const strength = workout(week1, 'strength-a')
    const phases = buildFlowPhases([week1.core, strength, week1.stretch])
    expect(phases[0].section).toBe('Core')
    expect(phases.at(-1)!.section).toBe('Stretch + Mobility')
    // 7 rep steps per round (two exercises are done on both sides) × 3 rounds.
    expect(phases.filter((p) => p.manual)).toHaveLength(21)
    expect(phases.find((p) => p.manual)).toMatchObject({ label: 'Bodyweight Squat', detail: '12 reps', round: 1 })
  })

  it('keeps timed strength holds (wall sit) on a countdown with 10s rest after', () => {
    const phases = buildPhases(workout(week2, 'strength-c'))
    const i = phases.findIndex((p) => p.label === 'Wall Sit')
    expect(phases[i].manual).toBeUndefined()
    expect(phases[i].seconds).toBe(40)
    expect(phases[i + 1]).toMatchObject({ kind: 'rest', seconds: AUTO_REST_SECONDS })
    expect(phases.filter((p) => p.label === 'Wall Sit')).toHaveLength(3)
  })
})

describe('optional core exercises in the timer', () => {
  const withExtras = (names: string[]) => ({
    ...week1.core,
    exercises: [...week1.core.exercises, ...optionalCore.filter((e) => names.includes(e.name))],
  })

  it('adds nothing unless selected', () => {
    expect(buildPhases(withExtras([])).map((p) => p.label)).toEqual(buildPhases(week1.core).map((p) => p.label))
  })

  it('runs a selected two-sided hold once per side after the program moves, with 10s rests', () => {
    const phases = buildPhases(withExtras(['Side Plank']))
    const labels = phases.map((p) => p.label)
    expect(labels.slice(-3)).toEqual(['Side Plank — Left', 'Switch sides', 'Side Plank — Right'])
    // Super Woman is no longer last, so it gets a 10s rest before the optional move.
    expect(labels.indexOf('Side Plank — Left')).toBeGreaterThan(labels.indexOf('Super Woman — Alternating Arm + Leg'))
    expect(totalSeconds(phases) - totalSeconds(buildPhases(week1.core))).toBe(10 + 30 + 10 + 30)
  })

  it('makes rep-based extras tap-to-continue steps, once per side when two-sided', () => {
    const phases = buildPhases(withExtras(['Dead Bug', 'Weighted Russian Twist']))
    const manual = phases.filter((p) => p.manual)
    expect(manual.map((p) => `${p.label}: ${p.detail}`)).toEqual([
      // Extras follow the library order (weighted first), not the order they were picked.
      'Weighted Russian Twist: 20 reps',
      'Dead Bug — Left: 10 reps',
      'Dead Bug — Right: 10 reps',
    ])
  })
})

describe('optional core library', () => {
  const names = optionalCore.map((e) => e.name)

  it('includes the requested weighted, Pilates, and teaser exercises', () => {
    for (const n of [
      'Goblet Squat',
      'Dumbbell Woodchop',
      'Weighted Russian Twist',
      'Weighted Plank Drag',
      'Weighted Glute Bridge',
      'Weighted Roll-Up',
      'Single Leg Stretch',
      'Double Leg Stretch',
      'Criss-Cross',
      'Teaser Prep',
      'Single-Leg Teaser',
      'Full Teaser',
    ])
      expect(names).toContain(n)
  })

  it('has unique names and a description for every exercise', () => {
    expect(new Set(names).size).toBe(names.length)
    expect(optionalCore.every((e) => e.description.length > 20 && e.prescription)).toBe(true)
  })

  it('does a one-sided Pilates teaser once per side and the full teaser as one step', () => {
    const phases = buildPhases({
      ...week1.core,
      exercises: optionalCore.filter((e) => ['Single-Leg Teaser', 'Full Teaser'].includes(e.name)),
    })
    expect(phases.filter((p) => p.manual).map((p) => `${p.label}: ${p.detail}`)).toEqual([
      'Single-Leg Teaser — Left: 5 reps',
      'Single-Leg Teaser — Right: 5 reps',
      'Full Teaser: 5 reps',
    ])
  })
})

describe('Week 2 program data', () => {
  it('has the same five workouts with the new prescriptions', () => {
    expect(week2.workouts.map((w) => w.id)).toEqual(['strength-a', 'strength-b', 'strength-c', 'cardio-1', 'cardio-2'])
    expect(workout(week2, 'strength-a').exercises.map((e) => `${e.name}: ${e.prescription}`)).toEqual([
      'Bodyweight Squat: 15 reps',
      'Reverse Lunge: 10 each side',
      'Push-Up: 8–10 reps',
      'Calf Raise: 20 reps',
      'Band Lateral Walk: 12 each side',
    ])
    expect(workout(week2, 'cardio-2').exercises[0].name).toBe('Squat + Calf Raise')
    expect(week2.core.exercises[0]).toMatchObject({ name: 'Forearm Plank', seconds: 45, restSeconds: 15 })
  })

  it('does not change Week 1', () => {
    expect(workout(week1, 'strength-a').exercises[0].prescription).toBe('12 reps')
  })
})

describe('formatClock', () => {
  it('formats m:ss', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(75)).toBe('1:15')
    expect(formatClock(-3)).toBe('0:00')
  })
})
