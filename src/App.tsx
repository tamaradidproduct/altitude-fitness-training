import { useEffect, useState } from 'react'
import { OPTIONAL_MET, optionalCore, program, suggestedCore, WEEKLY_GOALS, type Session, type WeekPhase } from './data/program'
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
import { estimateSession, roundKcal } from './lib/calories'
import { loadOptionalCore, loadProfile, saveOptionalCore, saveProfile } from './lib/preferences'
import { CalorieSettings } from './components/CalorieSettings'
import { OptionalCorePicker } from './components/OptionalCorePicker'
import { RoutineSection } from './components/RoutineSection'
import { WorkoutSection } from './components/WorkoutSection'

const pdfUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`

const DAILY_ROWS: { part: DailyPart; label: string }[] = [
  { part: 'core', label: 'Core' },
  { part: 'workout', label: 'Workout' },
  { part: 'stretch', label: 'Stretch' },
]
const WEEK_KEY = 'strength-to-snow:week:v1'

/** The first week that still has a workout to do (the last week once everything is done). */
function currentWeek(progress: Progress): number {
  const open = program.weeks.find((w) => w.workouts.some((x) => !progress.completed[sessionKey(w.number, x.id)]))
  return (open ?? program.weeks[program.weeks.length - 1]).number
}

function loadWeek(): number {
  try {
    const saved = Number(localStorage.getItem(WEEK_KEY))
    if (program.weeks.some((w) => w.number === saved)) return saved
  } catch {
    // Fall through to the default.
  }
  return currentWeek(loadProgress())
}

const PHASES: WeekPhase[] = ['Base', 'Peak', 'Send']
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [weekNumber, setWeekNumber] = useState(loadWeek)
  const [timerOpen, setTimerOpen] = useState(false)
  const [profile, setProfile] = useState(loadProfile)
  const [extraCore, setExtraCore] = useState<string[]>(loadOptionalCore)


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
  const completedIn = (weekNo: number, id: string) => progress.completed[sessionKey(weekNo, id)]
  const completedOn = (id: string) => completedIn(week.number, id)

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
  const suggested = suggestedCore[week.phase]
  const extras = optionalCore
    .filter((ex) => extraCore.includes(ex.name))
    .map((ex) => ({ ...ex, ...suggested[ex.name], met: OPTIONAL_MET[ex.group], optional: true }))
  const core: Session = {
    ...week.core,
    durationLabel: extras.length > 0 ? `5 min + ${extras.length} optional` : week.core.durationLabel,
    exercises: [...week.core.exercises, ...extras],
  }
  const flow: Session[] = [core, selected, stretch]
  const addSuggested = () =>
    setExtraCore((cur) => {
      const next = [...cur, ...Object.keys(suggested).filter((n) => !cur.includes(n))]
      saveOptionalCore(next)
      return next
    })
  const kcalOf = (session: Session) => estimateSession(session, week.number, profile).kcal
  const coreKcal = kcalOf(core)
  const stretchKcal = kcalOf(stretch)
  const selectedKcal = roundKcal(kcalOf(selected))
  // Sum of the rounded parts so the session total matches the breakdown shown when it finishes.
  const flowKcal = roundKcal(coreKcal) + selectedKcal + roundKcal(stretchKcal)
  const weekKcal =
    week.workouts.reduce((sum, w) => sum + (completedOn(w.id) ? kcalOf(w) : 0), 0) +
    dailyCount(progress, dates, 'core') * coreKcal +
    dailyCount(progress, dates, 'stretch') * stretchKcal
  const updateProfile = (next: typeof profile) => {
    setProfile(next)
    saveProfile(next)
  }
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
            Week {week.number}: {week.phase}{week.theme ? ` — ${week.theme}` : ''}
          </p>
        </div>
      </header>

      {program.weeks.length > 1 && (
        <label className="week-picker">
          <span className="week-picker__label">Week</span>
          <select
            value={week.number}
            onChange={(e) => {
              setWeekNumber(Number(e.target.value))
              setTimerOpen(false)
            }}
          >
            {PHASES.map((phase) => {
              const weeks = program.weeks.filter((w) => w.phase === phase)
              return (
                <optgroup key={phase} label={`${phase} · Weeks ${weeks[0].number}–${weeks[weeks.length - 1].number}`}>
                  {weeks.map((w) => (
                    <option key={w.number} value={w.number}>
                      Week {w.number}
                      {w.workouts.every((x) => completedIn(w.number, x.id)) ? ' ✓' : ''}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </label>
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

        <p className="week-kcal">
          Estimated calories this week: <strong>≈ {roundKcal(weekKcal)} kcal</strong>
          <span className="muted"> · completed workouts plus core and stretch days</span>
        </p>

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
              Core → {selected.nickname} → Stretch + Mobility · about 30 min · ≈ {flowKcal} kcal
            </p>
          </div>
          {timerOpen ? (
            <>
              <GuidedTimer
                key={`${week.number}-${selected.id}-${extras.length}-${extras.map((e) => e.name).join()}`}
                sessions={flow}
                onFinish={finishFlow}
                summary={[
                  { label: 'Core', kcal: roundKcal(coreKcal) },
                  { label: selected.nickname ?? selected.title, kcal: selectedKcal },
                  { label: 'Stretch + Mobility', kcal: roundKcal(stretchKcal) },
                ]}
              />
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
          kcal={roundKcal(coreKcal)}
          done={dailyDone('core')}
          onToggleDone={() => setProgress((p) => toggleDaily(p, today, 'core'))}
        >
          <OptionalCorePicker
            options={optionalCore}
            selected={extraCore}
            suggested={suggested}
            phase={week.phase}
            onToggle={toggleExtra}
            onAddSuggested={addSuggested}
          />
        </RoutineSection>

        <WorkoutSection
          step={2}
          workouts={week.workouts}
          kcalFor={(id) => roundKcal(kcalOf(workoutById(id)))}
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
          kcal={roundKcal(stretchKcal)}
          done={dailyDone('stretch')}
          onToggleDone={() => setProgress((p) => toggleDaily(p, today, 'stretch'))}
        />

        {week.pdf && (
          <a className="btn btn--ghost btn--block pdf-link" href={pdfUrl(week.pdf)} target="_blank" rel="noreferrer">
            📄 View original Week {week.number} PDF
          </a>
        )}
        <a
          className="btn btn--ghost btn--block pdf-link"
          href={pdfUrl('pdf/full-program.pdf')}
          target="_blank"
          rel="noreferrer"
        >
          📄 View full 12-week program PDF
        </a>

        <CalorieSettings profile={profile} onChange={updateProfile} />

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
