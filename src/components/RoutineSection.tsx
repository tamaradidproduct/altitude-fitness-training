import type { ReactNode } from 'react'
import type { Session } from '../data/program'
import { ExerciseList } from './ExerciseList'

interface Props {
  step: number
  session: Session
  /** Estimated calories for this routine. */
  kcal?: number
  done: boolean
  onToggleDone: () => void
  children?: ReactNode
}

/** Core or Stretch + Mobility: a numbered, always-visible step in the daily flow. */
export function RoutineSection({ step, session, kcal, done, onToggleDone, children }: Props) {
  return (
    <section className={`step kind--${session.kind}`} aria-labelledby={`step-${session.id}`}>
      <header className="step__head">
        <span className="step__num" aria-hidden>
          {step}
        </span>
        <div className="step__title">
          <h2 id={`step-${session.id}`}>{session.title}</h2>
          <p className="muted">
            {session.durationLabel}
            {kcal !== undefined && ` · ≈ ${kcal} kcal`}
          </p>
        </div>
        <button
          type="button"
          className={`btn btn--toggle ${done ? 'btn--toggle-on' : ''}`}
          aria-pressed={done}
          onClick={onToggleDone}
        >
          {done ? '✓ Done today' : 'Mark done'}
        </button>
      </header>
      <ExerciseList session={session} />
      {children}
    </section>
  )
}
