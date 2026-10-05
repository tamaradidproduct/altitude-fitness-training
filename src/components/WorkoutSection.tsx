import { useState } from 'react'
import type { Session } from '../data/program'
import { setKey } from '../lib/progress'
import { ExerciseList } from './ExerciseList'

interface Props {
  step: number
  workouts: Session[]
  selectedId: string
  onSelect: (id: string) => void
  checksFor: (sessionId: string) => string[]
  completedOn: (sessionId: string) => string | undefined
  onToggleSet: (sessionId: string, set: string) => void
  onComplete: (sessionId: string, done: boolean) => void
}

export function WorkoutSection({
  step,
  workouts,
  selectedId,
  onSelect,
  checksFor,
  completedOn,
  onToggleSet,
  onComplete,
}: Props) {
  const session = workouts.find((w) => w.id === selectedId) ?? workouts[0]
  const [round, setRound] = useState(1)
  const checks = checksFor(session.id)
  const done = completedOn(session.id)
  const roundDone = (r: number) => session.exercises.every((_, i) => checks.includes(setKey(r, i)))

  return (
    <section className={`step kind--${session.kind}`} aria-labelledby="step-workout">
      <header className="step__head">
        <span className="step__num" aria-hidden>
          {step}
        </span>
        <div className="step__title">
          <h2 id="step-workout">Strength or Cardio</h2>
          <p className="muted">{session.durationLabel} · pick today's workout</p>
        </div>
      </header>

      <div className="selector" role="tablist" aria-label="Choose workout">
        {workouts.map((w) => (
          <button
            key={w.id}
            type="button"
            role="tab"
            aria-selected={w.id === session.id}
            className={`selector__item kind--${w.kind} ${w.id === session.id ? 'selector__item--active' : ''}`}
            onClick={() => {
              onSelect(w.id)
              setRound(1)
            }}
          >
            <span>{w.title}</span>
            {completedOn(w.id) && <span aria-label="completed"> ✓</span>}
          </button>
        ))}
      </div>

      <div className={`workout-head kind--${session.kind}`}>
        <h3>{session.nickname}</h3>
        <p className="muted">
          {session.interval
            ? `${session.exercises.length} exercises × ${session.rounds} rounds · ${session.interval.work}s work / ${session.interval.rest}s recovery`
            : `${session.exercises.length} exercises × ${session.rounds} rounds`}
        </p>
        {session.equipment && (
          <ul className="chips" aria-label="Equipment">
            {session.equipment.map((e) => (
              <li key={e} className="chip">
                {e}
              </li>
            ))}
          </ul>
        )}
      </div>

      {session.warmup && (
        <p className="note">
          <strong>2-min warm-up</strong> (30s each): {session.warmup.join(' · ')}
        </p>
      )}

      <div className="tabs" role="tablist" aria-label="Rounds">
        {Array.from({ length: session.rounds }, (_, i) => i + 1).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={round === r}
            className={`tab ${round === r ? 'tab--active' : ''}`}
            onClick={() => setRound(r)}
          >
            Round {r} {roundDone(r) && '✓'}
          </button>
        ))}
      </div>

      <ExerciseList
        key={`${session.id}-${round}`}
        session={session}
        round={round}
        checks={checks}
        onToggle={(set) => onToggleSet(session.id, set)}
      />

      {session.cooldown && (
        <p className="note">
          <strong>2-min cooldown</strong> (30s each): {session.cooldown.join(' · ')}
        </p>
      )}

      <p className="session__count">
        {checks.length} / {session.rounds * session.exercises.length} sets checked
      </p>

      {done ? (
        <div className="complete">
          <span>✓ Completed {new Date(done + 'T00:00').toLocaleDateString()}</span>
          <button type="button" className="link-btn" onClick={() => onComplete(session.id, false)}>
            Undo
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--accent btn--block" onClick={() => onComplete(session.id, true)}>
          Mark workout complete
        </button>
      )}
    </section>
  )
}
