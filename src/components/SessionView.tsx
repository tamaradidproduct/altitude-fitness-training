import { useState } from 'react'
import type { Session } from '../data/program'
import { setKey } from '../lib/progress'
import { buildPhases, formatClock, totalSeconds } from '../lib/timer'
import { GuidedTimer } from './GuidedTimer'

interface Props {
  session: Session
  checks: string[]
  completedOn?: string
  onToggleSet: (set: string) => void
  onComplete: (done: boolean) => void
  onBack: () => void
}

export function SessionView({ session, checks, completedOn, onToggleSet, onComplete, onBack }: Props) {
  const [round, setRound] = useState(1)
  const [open, setOpen] = useState<number | null>(null)
  const [timerOpen, setTimerOpen] = useState(false)

  const guided = session.kind !== 'strength'
  const totalSets = session.rounds * session.exercises.length
  const doneSets = checks.length
  const roundDone = (r: number) => session.exercises.every((_, i) => checks.includes(setKey(r, i)))

  return (
    <section className="session">
      <button type="button" className="link-btn" onClick={onBack}>
        ← Week overview
      </button>

      <header className={`session__head kind--${session.kind}`}>
        <p className="eyebrow">
          {session.title} · {session.durationLabel}
        </p>
        <h2>{session.nickname ?? session.title}</h2>
        <p className="session__meta">
          {session.interval
            ? `${session.exercises.length} exercises × ${session.rounds} rounds · ${session.interval.work}s work / ${session.interval.rest}s recovery`
            : session.rounds > 1
              ? `${session.exercises.length} exercises × ${session.rounds} rounds`
              : `${session.exercises.length} moves`}
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
      </header>

      {guided &&
        (timerOpen ? (
          <GuidedTimer session={session} onFinish={() => onComplete(true)} onClose={() => setTimerOpen(false)} />
        ) : (
          <button type="button" className="btn btn--primary btn--block" onClick={() => setTimerOpen(true)}>
            ▶ Start guided timer ({formatClock(totalSeconds(buildPhases(session)))})
          </button>
        ))}

      {session.warmup && (
        <p className="note">
          <strong>2-min warm-up</strong> (30s each): {session.warmup.join(' · ')}
        </p>
      )}

      {session.rounds > 1 && (
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
      )}

      <ol className="exercises">
        {session.exercises.map((ex, i) => {
          const key = setKey(round, i)
          const checked = checks.includes(key)
          const id = `${session.id}-${round}-${i}`
          return (
            <li key={ex.name} className={`exercise ${checked ? 'exercise--done' : ''}`}>
              <div className="exercise__row">
                <input
                  id={id}
                  type="checkbox"
                  className="check"
                  checked={checked}
                  onChange={() => onToggleSet(key)}
                />
                <label htmlFor={id} className="exercise__name">
                  <span>{ex.name}</span>
                  <span className="exercise__rx">{ex.prescription}</span>
                </label>
                <button
                  type="button"
                  className="icon-btn"
                  aria-expanded={open === i}
                  aria-controls={`${id}-how`}
                  aria-label={`How to do ${ex.name}`}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  {open === i ? '−' : 'i'}
                </button>
              </div>
              {open === i && (
                <p id={`${id}-how`} className="exercise__how">
                  {ex.description}
                </p>
              )}
            </li>
          )
        })}
      </ol>

      {session.cooldown && (
        <p className="note">
          <strong>2-min cooldown</strong> (30s each): {session.cooldown.join(' · ')}
        </p>
      )}

      {session.rounds > 1 && (
        <p className="session__count">
          {doneSets} / {totalSets} sets checked
        </p>
      )}

      {completedOn ? (
        <div className="complete">
          <span>✓ Completed {new Date(completedOn + 'T00:00').toLocaleDateString()}</span>
          <button type="button" className="link-btn" onClick={() => onComplete(false)}>
            Undo
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--accent btn--block" onClick={() => onComplete(true)}>
          Mark workout complete
        </button>
      )}
    </section>
  )
}
