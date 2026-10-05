import type { Session } from '../data/program'

export type DailyPart = 'core' | 'workout' | 'stretch'

export interface Progress {
  /** `${week}:${sessionId}` → ISO date the workout was completed. */
  completed: Record<string, string>
  /** `${week}:${sessionId}` → checked set keys `${round}-${exerciseIndex}`. */
  checks: Record<string, string[]>
  /** YYYY-MM-DD → daily core / strength-or-cardio / stretch completion. */
  daily: Record<string, Partial<Record<DailyPart, boolean>>>
}

export const STORAGE_KEY = 'strength-to-snow:progress:v1'

export const emptyProgress = (): Progress => ({ completed: {}, checks: {}, daily: {} })

export const sessionKey = (week: number, sessionId: string) => `${week}:${sessionId}`
export const setKey = (round: number, exerciseIndex: number) => `${round}-${exerciseIndex}`

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    return { ...emptyProgress(), ...(JSON.parse(raw) as Partial<Progress>) }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage unavailable (private mode); progress stays in memory.
  }
}

export function toggleSet(p: Progress, key: string, set: string): Progress {
  const current = p.checks[key] ?? []
  const next = current.includes(set) ? current.filter((s) => s !== set) : [...current, set]
  return { ...p, checks: { ...p.checks, [key]: next } }
}

export function setCompleted(p: Progress, key: string, date: string | null): Progress {
  const completed = { ...p.completed }
  if (date) completed[key] = date
  else delete completed[key]
  return { ...p, completed }
}

/** Marks a daily part done (never un-marks). */
export function markDaily(p: Progress, date: string, part: DailyPart): Progress {
  if (p.daily[date]?.[part]) return p
  return toggleDaily(p, date, part)
}

export function toggleDaily(p: Progress, date: string, part: DailyPart): Progress {
  const day = p.daily[date] ?? {}
  return { ...p, daily: { ...p.daily, [date]: { ...day, [part]: !day[part] } } }
}

export function resetWeek(p: Progress, week: number, dates: string[]): Progress {
  const prefix = `${week}:`
  const strip = <T,>(rec: Record<string, T>) =>
    Object.fromEntries(Object.entries(rec).filter(([k]) => !k.startsWith(prefix)))
  const daily = { ...p.daily }
  dates.forEach((d) => delete daily[d])
  return { completed: strip(p.completed), checks: strip(p.checks), daily }
}

/** Local-time YYYY-MM-DD. */
export function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Monday→Sunday dates for the week containing `d`. */
export function weekDates(d: Date): Date[] {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return day
  })
}

export function dailyCount(p: Progress, dates: string[], part: DailyPart): number {
  return dates.filter((d) => p.daily[d]?.[part]).length
}

const allSetKeys = (session: Session) =>
  Array.from({ length: session.rounds }, (_, r) =>
    session.exercises.map((_, i) => setKey(r + 1, i)),
  ).flat()

export function isRoundChecked(checks: string[], session: Session, round: number): boolean {
  return session.exercises.every((_, i) => checks.includes(setKey(round, i)))
}

/** Checks (or clears) every exercise in one round. */
export function setRoundChecked(p: Progress, key: string, session: Session, round: number, checked: boolean): Progress {
  const roundKeys = session.exercises.map((_, i) => setKey(round, i))
  const rest = (p.checks[key] ?? []).filter((k) => !roundKeys.includes(k))
  return { ...p, checks: { ...p.checks, [key]: checked ? [...rest, ...roundKeys] : rest } }
}

/**
 * A workout counts as complete once every round is checked. Completing it
 * also ticks today's Workout dot; un-checking a round clears the completion.
 */
export function syncCompletion(p: Progress, week: number, session: Session, today: string): Progress {
  const key = sessionKey(week, session.id)
  const checks = p.checks[key] ?? []
  const allDone = allSetKeys(session).every((k) => checks.includes(k))
  if (allDone && !p.completed[key]) return markDaily(setCompleted(p, key, today), today, 'workout')
  if (!allDone && p.completed[key]) return setCompleted(p, key, null)
  return p
}

/** Checks every set of a workout (used when the guided session finishes). */
export function checkAllSets(p: Progress, key: string, session: Session): Progress {
  return { ...p, checks: { ...p.checks, [key]: allSetKeys(session) } }
}
