import { useState } from 'react'
import type { Exercise } from '../data/program'

interface Props {
  options: Exercise[]
  selected: string[]
  onToggle: (name: string) => void
}

/** Lets the user add extra exercises to the daily Core routine. Nothing is added by default. */
export function OptionalCorePicker({ options, selected, onToggle }: Props) {
  const [open, setOpen] = useState(false)

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
        <ul id="optional-core-list" className="optional__list">
          {options.map((ex) => {
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
      )}
    </div>
  )
}
