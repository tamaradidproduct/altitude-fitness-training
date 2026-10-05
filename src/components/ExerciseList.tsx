import { useState } from 'react'
import type { Session } from '../data/program'
import { setKey } from '../lib/progress'

interface Props {
  session: Session
  /** When provided, each exercise gets a checkbox for this round. */
  round?: number
  checks?: string[]
  onToggle?: (key: string) => void
}

export function ExerciseList({ session, round, checks = [], onToggle }: Props) {
  const [open, setOpen] = useState<number | null>(null)
  const tracked = round !== undefined && onToggle

  return (
    <ol className="exercises">
      {session.exercises.map((ex, i) => {
        const key = tracked ? setKey(round, i) : ''
        const checked = checks.includes(key)
        const id = `${session.id}-${round ?? 'x'}-${i}`
        return (
          <li key={ex.name} className={`exercise ${checked ? 'exercise--done' : ''}`}>
            <div className="exercise__row">
              {tracked ? (
                <>
                  <input id={id} type="checkbox" className="check" checked={checked} onChange={() => onToggle(key)} />
                  <label htmlFor={id} className="exercise__name">
                    <span>{ex.name}</span>
                    <span className="exercise__rx">{ex.prescription}</span>
                  </label>
                </>
              ) : (
                <div className="exercise__name">
                  <span>{ex.name}</span>
                  <span className="exercise__rx">{ex.prescription}</span>
                </div>
              )}
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
              <p id={`${id}-how`} className={`exercise__how ${tracked ? '' : 'exercise__how--flush'}`}>
                {ex.description}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
