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
}

/** Builds the ordered list of timed phases for a guided session. */
export function buildPhases(session: Session): Phase[] {
  const phases: Phase[] = []
  const transition = session.transitionSeconds ?? 30
  const section = session.nickname ?? session.title

  session.warmup?.forEach((move) => phases.push({ kind: 'warmup', label: move, seconds: transition, section }))

  for (let round = 1; round <= session.rounds; round++) {
    session.exercises.forEach((ex, exerciseIndex) => {
      const base = { exerciseIndex, round, section }
      if (session.interval) {
        phases.push({ ...base, kind: 'work', label: ex.name, seconds: session.interval.work })
        phases.push({ ...base, kind: 'rest', label: 'Recover', seconds: session.interval.rest })
        return
      }
      if (ex.seconds === undefined && session.kind === 'strength') {
        phases.push({ ...base, kind: 'work', label: ex.name, seconds: 0, manual: true, detail: ex.prescription })
        return
      }
      const seconds = ex.seconds ?? 60
      const sides = ex.perSide ? ['Left', 'Right'] : [null]
      for (const side of sides) {
        const label = side ? `${ex.name} — ${side}` : ex.name
        phases.push({ ...base, kind: 'work', label, seconds })
        if (ex.restSeconds) phases.push({ ...base, kind: 'rest', label: 'Rest', seconds: ex.restSeconds })
      }
    })
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
