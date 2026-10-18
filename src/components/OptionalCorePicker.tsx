import { useState } from 'react'
import type { OptionalExercise } from '../data/program'

interface Props {
  options: OptionalExercise[]
  selected: string[]
  onToggle: (name: string) => void
}

/** Lets the user add extra exercises to the daily Core routine. Nothing is added by default. */
const GROUP_HINT: Record<string, string> = {
  Weighted: 'one dumbbell or light weight',
  Pilates: 'mat work',
  Bodyweight: 'no equipment',
}

export function OptionalCorePicker({ options, selected, onToggle }: Props) {
  const [open, setOpen] = useState(false)
  const groups = options.reduce<[string, OptionalExercise[]][]>((acc, ex) => {
    const found = acc.find(([g]) => g === ex.group)
    if (found) found[1].push(ex)
    else acc.push([ex.group, [ex]])
    return acc
  }, [])

  return (
    <div className="optional">
      <button
        type="button"
        className="optional__toggle"
        aria-expanded={open}
        aria-controls="optional-core-list"
        onClick={() => setOpen(!open)}
      >
        <span>＋ Add optional core exercises</span>
        <span className="muted">{selected.length > 0 ? `${selected.length} added` : 'none added'}</span>
      </button>
      {open && (
        <div id="optional-core-list" className="optional__groups">
          {groups.map(([group, items]) => (
            <section key={group} aria-label={`${group} exercises`}>
              <h3 className="optional__group">
                {group} <span className="muted">· {GROUP_HINT[group]}</span>
              </h3>
              <ul className="optional__list">
                {items.map((ex) => {
                  const on = selected.includes(ex.name)
                  return (
                    <li key={ex.name} className="optional__item">
                      <span className="optional__text">
                        <span className="optional__name">{ex.name}</span>
                        <span className="exercise__rx">{ex.prescription}</span>
                      </span>
                      <button
                        type="button"
                        className={`btn btn--toggle ${on ? 'btn--toggle-on' : ''}`}
                        aria-pressed={on}
                        aria-label={`${on ? 'Remove' : 'Add'} ${ex.name}`}
                        onClick={() => onToggle(ex.name)}
                      >
                        {on ? '✓ Added' : '＋ Add'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
