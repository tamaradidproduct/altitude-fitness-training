import { useEffect, useState } from 'react'
import { optionalCore, program, WEEKLY_GOALS, type Session } from './data/program'
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
import { loadOptionalCore, saveOptionalCore } from './lib/preferences'
import { useWakeLock } from './lib/useWakeLock'
import { OptionalCorePicker } from './components/OptionalCorePicker'
import { RoutineSection } from './components/RoutineSection'
import { WorkoutSection } from './components/WorkoutSection'

const pdfUrl = (week: number) => `${import.meta.env.BASE_URL}pdf/week-${week}.pdf`

const DAILY_ROWS: { part: DailyPart; label: string }[] = [
  { part: 'core', label: 'Core' },
  { part: 'workout', label: 'Workout' },
  { part: 'stretch', label: 'Stretch' },
]
const WEEK_KEY = 'strength-to-snow:week:v1'
const latestWeek = program.weeks[program.weeks.length - 1].number

function loadWeek(): number {
  try {
    const saved = Number(localStorage.getItem(WEEK_KEY))
    return program.weeks.some((w) => w.number === saved) ? saved : latestWeek
  } catch {
    return latestWeek
  }
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [weekNumber, setWeekNumber] = useState(loadWeek)
  const [timerOpen, setTimerOpen] = useState(false)
  const [extraCore, setExtraCore] = useState<string[]>(loadOptionalCore)

  useWakeLock()

  useEffect(() => {
    saveProgress(progress)
  }, [progress])
  useEffect(() => {
    try {
      localStorage.setItem(WEEK_KEY, String(weekNumber))
    } catch {
      // Storage unavailable; the week just resets on reload.
    }
  }, [weekNumber])

  const week = program.weeks.find((w) => w.number === weekNumber)!
  const [now] = useState(() => new Date())
  const today = isoDate(now)
  const dates = weekDates(now).map(isoDate)

  const keyOf = (id: string) => sessionKey(week.number, id)
  const completedOn = (id: string) => progress.completed[keyOf(id)]

  // Per week: the workout the user picked, else the first one not done when the app opened.
  const [picked, setPicked] = useState<Record<number, string>>({})
  const [defaults] = useState(() => {
    const saved = loadProgress()
    return Object.fromEntries(
      program.weeks.map((w) => [
        w.number,
        (w.workouts.find((x) => !saved.completed[sessionKey(w.number, x.id)]) ?? w.workouts[0]).id,
      ]),
    )
  })
  const selected =
    week.workouts.find((w) => w.id === (picked[week.number] ?? defaults[week.number])) ?? week.workouts[0]
  const { stretch } = week
  // Selected optional exercises follow the program's core moves, in list order.
  const extras = optionalCore.filter((ex) => extraCore.includes(ex.name)).map((ex) => ({ ...ex, optional: true }))
  const core: Session = {
    ...week.core,
    durationLabel: extras.length > 0 ? `5 min + ${extras.length} optional` : week.core.durationLabel,
    exercises: [...week.core.exercises, ...extras],
  }
  const flow: Session[] = [core, selected, stretch]
  const toggleExtra = (name: string) =>
    setExtraCore((cur) => {
      const next = cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]
      saveOptionalCore(next)
      return next
    })

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

      {program.weeks.length > 1 && (
        <div className="weeks" role="tablist" aria-label="Program week">
          {program.weeks.map((w) => (
            <button
              key={w.number}
              type="button"
              role="tab"
              aria-selected={w.number === week.number}
              className={`tab ${w.number === week.number ? 'tab--active' : ''}`}
              onClick={() => {
                setWeekNumber(w.number)
                setTimerOpen(false)
              }}
            >
              Week {w.number}
            </button>
          ))}
        </div>
      )}

      <main key={week.number}>
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
              <GuidedTimer key={`${week.number}-${selected.id}-${extras.length}-${extras.map((e) => e.name).join()}`} sessions={flow} onFinish={finishFlow} />
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
          session={core}
          done={dailyDone('core')}
          onToggleDone={() => setProgress((p) => toggleDaily(p, today, 'core'))}
        >
          <OptionalCorePicker options={optionalCore} selected={extraCore} onToggle={toggleExtra} />
        </RoutineSection>

        <WorkoutSection
          step={2}
          workouts={week.workouts}
          selectedId={selected.id}
          onSelect={(id) => setPicked((p) => ({ ...p, [week.number]: id }))}
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
