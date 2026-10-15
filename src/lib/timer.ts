import type { Session } from '../data/program'

export type PhaseKind = 'warmup' | 'work' | 'rest' | 'cooldown'

export interface Phase {
  kind: PhaseKind
  label: string
  seconds: number
  /** Index into session.exercises, when the phase belongs to an exercise. */
  exerciseIndex?: number
  round?: number
  /** Which part of the flow this phase belongs to (e.g. "Core"). */
  section: string
  /** Rep-based step: no countdown, the user taps Done when finished. */
  manual?: boolean
  /** Prescription shown for manual steps, e.g. "12 reps". */
  detail?: string
  /** How to do the exercise (for rests: the upcoming one). */
  description?: string
}

/** Rest the timer adds between timed exercises that have no built-in rest. */
export const AUTO_REST_SECONDS = 10

interface Unit {
  work: Phase
  /** Rest after this unit; `auto` rests are dropped after the last unit of a section. */
  rest?: { seconds: number; label: string; auto: boolean }
}

/** "8 each side" → "8 reps", "30 sec each side" → "30 sec". */
function perSideAmount(prescription: string): string {
  const amount = prescription.replace(/\s*each side/i, '').trim()
  return /^\d+(–\d+)?$/.test(amount) ? `${amount} reps` : amount
}

/** Builds the ordered list of timed phases for a guided session. */
export function buildPhases(session: Session): Phase[] {
  const transition = session.transitionSeconds ?? 30
  const section = session.nickname ?? session.title
  const phases: Phase[] = []

  session.warmup?.forEach((move) => phases.push({ kind: 'warmup', label: move, seconds: transition, section }))

  const units: Unit[] = []
  for (let round = 1; round <= session.rounds; round++) {
    session.exercises.forEach((ex, exerciseIndex) => {
      const base = { exerciseIndex, round, section, description: ex.description }
      if (session.interval) {
        units.push({
          work: { ...base, kind: 'work', label: ex.name, seconds: session.interval.work },
          rest: { seconds: session.interval.rest, label: 'Recover', auto: false },
        })
        return
      }
      const sides = ex.perSide ? ['Left', 'Right'] : [null]
      sides.forEach((side, sideIndex) => {
        const label = side ? `${ex.name} — ${side}` : ex.name
        if (ex.seconds === undefined) {
          // Rep-based: the user taps Done at their own pace.
          const detail = ex.perSide ? perSideAmount(ex.prescription) : ex.prescription
          units.push({ work: { ...base, kind: 'work', label, seconds: 0, manual: true, detail } })
          return
        }
        const last = sideIndex === sides.length - 1
        const builtIn = ex.restSeconds
        units.push({
          work: { ...base, kind: 'work', label, seconds: ex.seconds },
          rest: {
            seconds: builtIn ?? AUTO_REST_SECONDS,
            label: last ? 'Rest' : 'Switch sides',
            auto: builtIn === undefined,
          },
        })
      })
    })
  }

  units.forEach(({ work, rest }, i) => {
    phases.push(work)
    if (!rest) return
    if (rest.auto && i === units.length - 1) return
    phases.push({
      kind: 'rest',
      label: rest.label,
      seconds: rest.seconds,
      exerciseIndex: work.exerciseIndex,
      round: work.round,
      section,
    })
  })

  // While resting, show how to do the move that is coming up.
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].kind === 'rest') phases[i].description = phases[i + 1]?.description
  }

  session.cooldown?.forEach((move) => phases.push({ kind: 'cooldown', label: move, seconds: transition, section }))
  return phases
}

export function totalSeconds(phases: Phase[]): number {
  return phases.reduce((sum, p) => sum + p.seconds, 0)
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** One continuous flow: every session's phases back to back. */
export function buildFlowPhases(sessions: Session[]): Phase[] {
  return sessions.flatMap(buildPhases)
}
