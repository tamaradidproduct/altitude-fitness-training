import type { ReactNode } from 'react'
import type { Session } from '../data/program'
import { ExerciseList } from './ExerciseList'

interface Props {
  step: number
  session: Session
  done: boolean
  onToggleDone: () => void
  children?: ReactNode
}

/** Core or Stretch + Mobility: a numbered, always-visible step in the daily flow. */
export function RoutineSection({ step, session, done, onToggleDone }: Props) {
  return (
    <section className={`step kind--${session.kind}`} aria-labelledby={`step-${session.id}`}>
      <header className="step__head">
        <span className="step__num" aria-hidden>
          {step}
        </span>
        <div className="step__title">
          <h2 id={`step-${session.id}`}>{session.title}</h2>
          <p className="muted">{session.durationLabel}</p>
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
    </section>
  )
}
