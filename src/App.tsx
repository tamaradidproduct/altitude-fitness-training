import { useEffect, useState } from 'react'
import { program, WEEKLY_GOALS, type Session } from './data/program'
import {
  dailyCount,
  isoDate,
  loadProgress,
  markDaily,
  resetWeek,
  saveProgress,
  sessionKey,
  setCompleted,
  toggleDaily,
  toggleSet,
  weekDates,
  type DailyPart,
  type Progress,
} from './lib/progress'
import { SessionView } from './components/SessionView'

const pdfUrl = (week: number) => `${import.meta.env.BASE_URL}pdf/week-${week}.pdf`

const DAILY_ROWS: { part: DailyPart; label: string }[] = [
  { part: 'core', label: 'Core' },
  { part: 'workout', label: 'Workout' },
  { part: 'stretch', label: 'Stretch' },
]
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [weekNumber] = useState(1)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeId])

  const week = program.weeks.find((w) => w.number === weekNumber)!
  const [now] = useState(() => new Date())
  const today = isoDate(now)
  const dates = weekDates(now).map(isoDate)
  const daily = [week.core, week.stretch]
  const all = [...week.workouts, ...daily]
  const active = all.find((s) => s.id === activeId)

  const isDaily = (s: Session) => s.kind === 'core' || s.kind === 'stretch'
  const completedOn = (s: Session) =>
    isDaily(s)
      ? progress.daily[today]?.[s.kind as 'core' | 'stretch']
        ? today
        : undefined
      : progress.completed[sessionKey(week.number, s.id)]

  const handleComplete = (s: Session, done: boolean) => {
    if (isDaily(s)) {
      const part = s.kind as 'core' | 'stretch'
      if (Boolean(progress.daily[today]?.[part]) !== done) setProgress((p) => toggleDaily(p, today, part))
    } else {
      setProgress((p) => {
        const next = setCompleted(p, sessionKey(week.number, s.id), done ? today : null)
        return done ? markDaily(next, today, 'workout') : next
      })
    }
  }

  const countDone = (kind: Session['kind']) =>
    week.workouts.filter((w) => w.kind === kind && progress.completed[sessionKey(week.number, w.id)]).length

  const stats = [
    { label: 'Strength', value: countDone('strength'), goal: WEEKLY_GOALS.strength },
    { label: 'Cardio', value: countDone('cardio'), goal: WEEKLY_GOALS.cardio },
    { label: 'Core days', value: dailyCount(progress, dates, 'core'), goal: WEEKLY_GOALS.dailyMin },
    { label: 'Stretch days', value: dailyCount(progress, dates, 'stretch'), goal: WEEKLY_GOALS.dailyMin },
  ]

  return (
    <div className="app">
      <header className="masthead">
        <svg className="masthead__logo" viewBox="0 0 32 32" aria-hidden>
          <path d="M2 27 L13 9 L19 18 L22 13 L30 27 Z" fill="currentColor" />
        </svg>
        <div>
          <h1>{program.title}</h1>
          <p className="masthead__sub">
            Week {week.number}: {week.phase} — {week.theme}
          </p>
        </div>
      </header>

      <main>
        {active ? (
          <SessionView
            key={active.id}
            session={active}
            checks={progress.checks[sessionKey(week.number, active.id)] ?? []}
            completedOn={completedOn(active)}
            onToggleSet={(set) => setProgress((p) => toggleSet(p, sessionKey(week.number, active.id), set))}
            onComplete={(done) => handleComplete(active, done)}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <>
            <section aria-label="Weekly progress" className="stats">
              {stats.map((s) => (
                <div key={s.label} className={`stat ${s.value >= s.goal ? 'stat--met' : ''}`}>
                  <span className="stat__value">
                    {s.value}
                    <small>/{s.goal}</small>
                  </span>
                  <span className="stat__label">{s.label}</span>
                  <span className="stat__bar" aria-hidden>
                    <span style={{ width: `${Math.min(100, (s.value / s.goal) * 100)}%` }} />
                  </span>
                </div>
              ))}
            </section>

            <section className="card">
              <div className="card__head">
                <h2>Daily routine</h2>
                <p className="muted">Core + stretch 5–7 days; strength or cardio on workout days</p>
              </div>
              <table className="days">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Routine</span>
                    </th>
                    {dates.map((d, i) => (
                      <th key={d} scope="col" className={d === today ? 'is-today' : ''}>
                        <abbr title={new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'long' })}>
                          {DAY_LABELS[i]}
                        </abbr>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAILY_ROWS.map(({ part, label }) => (
                    <tr key={part}>
                      <th scope="row">{label}</th>
                      {dates.map((d) => {
                        const on = Boolean(progress.daily[d]?.[part])
                        return (
                          <td key={d}>
                            <button
                              type="button"
                              className={`dot ${on ? 'dot--on' : ''} ${d === today ? 'dot--today' : ''}`}
                              aria-pressed={on}
                              aria-label={`${label} on ${d}`}
                              onClick={() => setProgress((p) => toggleDaily(p, d, part))}
                            >
                              {on ? '✓' : ''}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="daily-links">
                {daily.map((s) => (
                  <button key={s.id} type="button" className="btn btn--ghost" onClick={() => setActiveId(s.id)}>
                    {s.title} routine ▸
                  </button>
                ))}
              </div>
            </section>

            <section aria-label="Workouts">
              <h2 className="section-title">This week's workouts</h2>
              <ul className="workouts">
                {week.workouts.map((w) => {
                  const done = completedOn(w)
                  const checked = progress.checks[sessionKey(week.number, w.id)]?.length ?? 0
                  const total = w.rounds * w.exercises.length
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        className={`workout kind--${w.kind} ${done ? 'workout--done' : ''}`}
                        onClick={() => setActiveId(w.id)}
                      >
                        <span className="workout__badge" aria-hidden>
                          {done ? '✓' : w.kind === 'strength' ? '💪' : '❤️'}
                        </span>
                        <span className="workout__text">
                          <span className="eyebrow">
                            {w.title} · {w.durationLabel}
                          </span>
                          <span className="workout__name">{w.nickname}</span>
                          <span className="muted">
                            {done
                              ? `Completed ${new Date(done + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`
                              : checked > 0
                                ? `${checked}/${total} sets checked`
                                : w.equipment
                                  ? w.equipment.join(', ')
                                  : `${w.interval?.work}s on / ${w.interval?.rest}s off`}
                          </span>
                        </span>
                        <span aria-hidden className="chev">
                          ›
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <a className="btn btn--ghost btn--block pdf-link" href={pdfUrl(week.number)} target="_blank" rel="noreferrer">
              📄 View original Week {week.number} PDF
            </a>

            <p className="footer">
              Each day: Core (5 min) → Strength or Cardio (15–20 min) → Stretch (5 min) ≈ 30 min.
              <br />
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  if (window.confirm(`Reset all Week ${week.number} progress?`))
                    setProgress((p) => resetWeek(p, week.number, dates))
                }}
              >
                Reset week
              </button>
            </p>
          </>
        )}
      </main>
    </div>
  )
}
