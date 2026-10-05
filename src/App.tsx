import { useEffect, useMemo, useState } from 'react'
import { program, WEEKLY_GOALS, type Session } from './data/program'
import {
  dailyCount,
  isoDate,
  checkAllSets,
  loadProgress,
  markDaily,
  resetWeek,
  saveProgress,
  setRoundChecked,
  sessionKey,
  syncCompletion,
  toggleDaily,
  toggleSet,
  weekDates,
  type DailyPart,
  type Progress,
} from './lib/progress'
import { GuidedTimer } from './components/GuidedTimer'
import { RoutineSection } from './components/RoutineSection'
import { WorkoutSection } from './components/WorkoutSection'

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
  const [timerOpen, setTimerOpen] = useState(false)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const week = program.weeks.find((w) => w.number === weekNumber)!
  const [now] = useState(() => new Date())
  const today = isoDate(now)
  const dates = weekDates(now).map(isoDate)

  const keyOf = (id: string) => sessionKey(week.number, id)
  const completedOn = (id: string) => progress.completed[keyOf(id)]

  // Default to the first workout not yet done this week.
  const [selectedId, setSelectedId] = useState(
    () => (week.workouts.find((w) => !loadProgress().completed[sessionKey(week.number, w.id)]) ?? week.workouts[0]).id,
  )
  const selected = week.workouts.find((w) => w.id === selectedId) ?? week.workouts[0]
  const { core, stretch } = week
  const flow = useMemo<Session[]>(() => [core, selected, stretch], [core, selected, stretch])

  const dailyDone = (part: DailyPart) => Boolean(progress.daily[today]?.[part])

  const workoutById = (id: string) => week.workouts.find((w) => w.id === id)!

  const toggleWorkoutSet = (id: string, set: string) =>
    setProgress((p) => syncCompletion(toggleSet(p, keyOf(id), set), week.number, workoutById(id), today))

  const setRound = (id: string, round: number, checked: boolean) =>
    setProgress((p) =>
      syncCompletion(setRoundChecked(p, keyOf(id), workoutById(id), round, checked), week.number, workoutById(id), today),
    )

  const finishFlow = () =>
    setProgress((p) => {
      const withSets = checkAllSets(p, keyOf(selected.id), selected)
      const done = syncCompletion(withSets, week.number, selected, today)
      return markDaily(markDaily(done, today, 'core'), today, 'stretch')
    })

  const countDone = (kind: Session['kind']) =>
    week.workouts.filter((w) => w.kind === kind && completedOn(w.id)).length

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
        </section>

        <section className="card timer-card" aria-label="Guided session">
          <div className="card__head">
            <h2>Today's session</h2>
            <p className="muted">
              Core → {selected.nickname} → Stretch + Mobility · about 30 min
            </p>
          </div>
          {timerOpen ? (
            <>
              <GuidedTimer key={selected.id} sessions={flow} onFinish={finishFlow} />
              <button type="button" className="link-btn" onClick={() => setTimerOpen(false)}>
                Close timer
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--primary btn--block" onClick={() => setTimerOpen(true)}>
              ▶ Start guided session
            </button>
          )}
        </section>

        <RoutineSection
          step={1}
          session={week.core}
          done={dailyDone('core')}
          onToggleDone={() => setProgress((p) => toggleDaily(p, today, 'core'))}
        />

        <WorkoutSection
          step={2}
          workouts={week.workouts}
          selectedId={selected.id}
          onSelect={setSelectedId}
          checksFor={(id) => progress.checks[keyOf(id)] ?? []}
          completedOn={completedOn}
          onToggleSet={toggleWorkoutSet}
          onSetRound={setRound}
        />

        <RoutineSection
          step={3}
          session={week.stretch}
          done={dailyDone('stretch')}
          onToggleDone={() => setProgress((p) => toggleDaily(p, today, 'stretch'))}
        />

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
      </main>
    </div>
  )
}
