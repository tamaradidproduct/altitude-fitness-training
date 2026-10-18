import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

const STORE = 'strength-to-snow:progress:v1'

const pickWeek = (n: number) =>
  fireEvent.change(screen.getByRole('combobox', { name: 'Week' }), { target: { value: String(n) } })

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('strength-to-snow:week:v1', '1')
    localStorage.removeItem('strength-to-snow:optional-core:v1')
    localStorage.removeItem('strength-to-snow:profile:v1')
  })

  it('shows core, workout and stretch inline under the tracker', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Core' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Strength or Cardio' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Stretch + Mobility' })).toBeInTheDocument()
    expect(screen.getByText('Forearm Plank')).toBeInTheDocument()
    expect(screen.getByText('Standing Quad Stretch')).toBeInTheDocument()
  })

  it('switches workouts with the selector', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Powder Day' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Cardio 1' }))
    expect(screen.getByRole('heading', { name: 'Earn Your Turns' })).toBeInTheDocument()
    expect(screen.getByText('March in Place', { selector: '.exercise__name span' })).toBeInTheDocument()
  })

  it('uses the full program PDF\'s Strength B and C names', () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Strength B' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Strength B' }))
    expect(screen.getByRole('heading', { name: 'All Mountain Muscle' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Strength C' }))
    expect(screen.getByRole('heading', { name: 'Last Chair' })).toBeInTheDocument()
  })

  it('links to the original PDF', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: /View original Week 1 PDF/ })
    expect(link).toHaveAttribute('href', expect.stringMatching(/pdf\/week-1\.pdf$/))
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('marks a round complete, then the workout once all rounds are done', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Mark round 1 complete' }))
    expect(screen.getByText('5 / 15 sets checked')).toBeInTheDocument()
    // Advances to the next round automatically.
    expect(screen.getByRole('tab', { name: /Round 2/, selected: true })).toBeInTheDocument()
    expect(screen.queryByText(/Workout complete/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mark round 2 complete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mark round 3 complete' }))
    expect(screen.getByText(/Workout complete/)).toBeInTheDocument()
    expect(screen.getByText('Strength').previousSibling).toHaveTextContent('1/3')
    expect(screen.getByRole('button', { name: /^Workout on/, pressed: true })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORE)!).completed['1:strength-a']).toBeTruthy()
  })

  it('undoing a round clears the workout completion', () => {
    render(<App />)
    for (const r of [1, 2, 3]) fireEvent.click(screen.getByRole('button', { name: `Mark round ${r} complete` }))
    fireEvent.click(screen.getByRole('button', { name: /Round 3 complete · Undo/ }))
    expect(screen.queryByText(/Workout complete/)).not.toBeInTheDocument()
    expect(screen.getByText('Strength').previousSibling).toHaveTextContent('0/3')
  })

  it('checking individual sets also completes the round state', () => {
    render(<App />)
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box)
    expect(screen.getByRole('button', { name: /Round 1 complete · Undo/ })).toBeInTheDocument()
  })

  it('marks core and stretch done for today from their sections', () => {
    render(<App />)
    const [coreBtn, stretchBtn] = screen.getAllByRole('button', { name: 'Mark done' })
    fireEvent.click(coreBtn)
    fireEvent.click(stretchBtn)
    expect(screen.getAllByText('✓ Done today')).toHaveLength(2)
    expect(screen.getByText('Core days').previousSibling).toHaveTextContent('1/5')
  })

  it('runs one timer through core, the chosen workout, and stretch', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: 'Strength B' }))
    fireEvent.click(screen.getByText('▶ Start guided session'))
    const timer = screen.getByRole('region', { name: 'Guided timer' })
    expect(timer).toHaveTextContent('Core')
    expect(timer).toHaveTextContent('Step 1 of')
  })

  it('starts on the first unfinished week and lets you switch between all 12', () => {
    localStorage.removeItem('strength-to-snow:week:v1')
    render(<App />)
    const picker = screen.getByRole('combobox', { name: 'Week' })
    expect(within(picker).getAllByRole('option')).toHaveLength(12)
    expect(picker).toHaveValue('1')
    pickWeek(2)
    expect(screen.getByText('Bird Dog Crunch')).toBeInTheDocument()
    expect(screen.getByText('Week 2: Base — Build the Foundation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View original Week 2 PDF/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/pdf\/week-2\.pdf$/),
    )
    pickWeek(1)
    expect(screen.getByText('Bird Dog')).toBeInTheDocument()
    expect(localStorage.getItem('strength-to-snow:week:v1')).toBe('1')
  })

  it('opens on the next week once every workout in earlier weeks is done', () => {
    localStorage.removeItem('strength-to-snow:week:v1')
    const completed = Object.fromEntries(
      ['strength-a', 'strength-b', 'strength-c', 'cardio-1', 'cardio-2'].map((id) => [`1:${id}`, '2026-10-05']),
    )
    localStorage.setItem('strength-to-snow:progress:v1', JSON.stringify({ completed, checks: {}, daily: {} }))
    render(<App />)
    expect(screen.getByRole('combobox', { name: 'Week' })).toHaveValue('2')
    expect(screen.getByRole('option', { name: 'Week 1 ✓' })).toBeInTheDocument()
  })

  it('groups weeks by phase in the dropdown', () => {
    render(<App />)
    for (const g of ['Base · Weeks 1–4', 'Peak · Weeks 5–8', 'Send · Weeks 9–12'])
      expect(screen.getByRole('group', { name: g })).toBeInTheDocument()
  })

  it('shows later weeks, their phase, and only the full-program PDF where there is no weekly PDF', () => {
    render(<App />)
    pickWeek(6)
    expect(screen.getByText('Week 6: Peak')).toBeInTheDocument()
    expect(screen.getByText('Straight-Arm Plank')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /View original Week 6 PDF/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View full 12-week program PDF/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/pdf\/full-program\.pdf$/),
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Cardio 1' }))
    expect(screen.getByText(/5 exercises × 3 rounds · 30s work \/ 30s recovery/)).toBeInTheDocument()
  })

  it('tracks each week\'s workouts separately', () => {
    render(<App />)
    for (const r of [1, 2, 3]) fireEvent.click(screen.getByRole('button', { name: `Mark round ${r} complete` }))
    expect(screen.getByText('Strength').previousSibling).toHaveTextContent('1/3')
    pickWeek(2)
    expect(screen.getByText('Strength').previousSibling).toHaveTextContent('0/3')
    expect(screen.queryByText(/Workout complete/)).not.toBeInTheDocument()
  })

  it('shows the exercise description on the timer screen', () => {
    render(<App />)
    fireEvent.click(screen.getByText('▶ Start guided session'))
    const timer = screen.getByRole('region', { name: 'Guided timer' })
    expect(timer).toHaveTextContent('Start on your forearms and toes')
  })

  it('does not treat a scrollTo return value as an effect cleanup', () => {
    const original = window.scrollTo
    window.scrollTo = (() => ({})) as unknown as typeof window.scrollTo
    try {
      expect(() => render(<App />)).not.toThrow()
    } finally {
      window.scrollTo = original
    }
  })

  describe('optional core exercises', () => {
    const open = () => fireEvent.click(screen.getByRole('button', { name: /Add optional core exercises/ }))

    it('are not included by default', () => {
      render(<App />)
      expect(screen.getByText('none added')).toBeInTheDocument()
      expect(screen.queryByText('Dead Bug')).not.toBeInTheDocument()
      expect(screen.queryByText('Optional')).not.toBeInTheDocument()
    })

    it('are grouped as weighted, Pilates, and bodyweight in the picker', () => {
      render(<App />)
      open()
      for (const g of ['Weighted exercises', 'Pilates exercises', 'Bodyweight exercises'])
        expect(screen.getByRole('region', { name: g })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Goblet Squat' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Full Teaser' })).toBeInTheDocument()
    })

    it('can be added from the picker, shown as optional, and removed again', () => {
      render(<App />)
      open()
      fireEvent.click(screen.getByRole('button', { name: 'Add Dead Bug' }))
      expect(screen.getByText('1 added')).toBeInTheDocument()
      expect(screen.getByText('Optional')).toBeInTheDocument()
      expect(screen.getByText(/5 min \+ 1 optional/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Remove Dead Bug' }))
      expect(screen.queryByText('Optional')).not.toBeInTheDocument()
      expect(screen.getByText('none added')).toBeInTheDocument()
    })

    it('are remembered between visits', () => {
      const first = render(<App />)
      open()
      fireEvent.click(screen.getByRole('button', { name: 'Add Side Plank' }))
      first.unmount()
      render(<App />)
      expect(screen.getByText('1 added')).toBeInTheDocument()
      expect(JSON.parse(localStorage.getItem('strength-to-snow:optional-core:v1')!)).toEqual(['Side Plank'])
    })

    it('flags suggested exercises for the week\'s phase but never adds them on its own', () => {
      render(<App />)
      open()
      expect(screen.getByText(/Suggested for Base weeks/)).toBeInTheDocument()
      expect(screen.getAllByText('Suggested')).toHaveLength(3)
      expect(screen.getByText('none added')).toBeInTheDocument()
    })

    it('adds all suggested exercises with one tap, using the suggested reps', () => {
      render(<App />)
      open()
      fireEvent.click(screen.getByRole('button', { name: /Add suggested \(3\)/ }))
      expect(screen.getByText('3 added')).toBeInTheDocument()
      for (const n of ['Dead Bug', 'Teaser Prep', 'Single Leg Stretch'])
        expect(screen.getByRole('button', { name: `Remove ${n}` })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '✓ Suggested added' })).toBeDisabled()
    })

    it('suggests different exercises, with progressed reps or time, in later phases', () => {
      localStorage.setItem('strength-to-snow:week:v1', '9')
      render(<App />)
      open()
      expect(screen.getByText(/Suggested for Send weeks/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Add Hollow Body Hold' }))
      // The suggested time for Send weeks (30 sec) replaces the default (20 sec) in the core list.
      expect(screen.getAllByText('30 sec hold').length).toBeGreaterThan(0)
    })

    it('are included in the guided timer only when selected', () => {
      render(<App />)
      const steps = () => Number(/of (\d+)/.exec(screen.getByRole('region', { name: 'Guided timer' }).textContent!)![1])
      fireEvent.click(screen.getByText('▶ Start guided session'))
      const before = steps()
      open()
      fireEvent.click(screen.getByRole('button', { name: 'Add Side Plank' }))
      // Rest before it, left, switch-sides rest, right: 4 more steps; the timer restarts with the new routine.
      expect(steps()).toBe(before + 4)
      fireEvent.click(screen.getByRole('button', { name: 'Remove Side Plank' }))
      expect(steps()).toBe(before)
    })
  })
})

describe('calorie estimates', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('strength-to-snow:week:v1', '1')
  })

  const weeklyKcal = () => Number(/≈ (\d+) kcal/.exec(screen.getByText(/Estimated calories this week/).textContent!)![1])

  it('shows estimates for the session, each section, and the week', () => {
    render(<App />)
    expect(screen.getByText(/about 30 min · ≈ \d+ kcal/)).toBeInTheDocument()
    expect(screen.getAllByText(/ min · ≈ \d+ kcal/).length).toBeGreaterThanOrEqual(3)
    expect(weeklyKcal()).toBe(0)
  })

  it('adds a completed workout and core/stretch days to the weekly estimate', () => {
    render(<App />)
    for (const r of [1, 2, 3]) fireEvent.click(screen.getByRole('button', { name: `Mark round ${r} complete` }))
    const afterWorkout = weeklyKcal()
    expect(afterWorkout).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark done' })[0])
    expect(weeklyKcal()).toBeGreaterThan(afterWorkout)
  })

  it('changes with your weight and is remembered', () => {
    const first = render(<App />)
    const before = Number(/≈ (\d+) kcal/.exec(screen.getByText(/about 30 min/).textContent!)![1])
    fireEvent.click(screen.getByText('Calorie estimate settings'))
    fireEvent.change(screen.getByLabelText('Weight (lb)'), { target: { value: '200' } })
    const after = Number(/≈ (\d+) kcal/.exec(screen.getByText(/about 30 min/).textContent!)![1])
    expect(after).toBeGreaterThan(before)
    first.unmount()
    render(<App />)
    fireEvent.click(screen.getByText('Calorie estimate settings'))
    expect(screen.getByLabelText('Weight (lb)')).toHaveValue(200)
  })

  it('ignores out-of-range settings', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Calorie estimate settings'))
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '500' } })
    expect(JSON.parse(localStorage.getItem('strength-to-snow:profile:v1') ?? '{"ageYears":38}').ageYears).toBe(38)
  })

  it('defaults to a 155 lb, 38-year-old woman', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Calorie estimate settings'))
    expect(screen.getByLabelText('Weight (lb)')).toHaveValue(155)
    expect(screen.getByLabelText('Age')).toHaveValue(38)
    expect(screen.getByLabelText('Sex')).toHaveValue('female')
  })

  it('shows the calories burned when a workout is completed', () => {
    render(<App />)
    expect(screen.queryByText(/kcal burned/)).not.toBeInTheDocument()
    for (const r of [1, 2, 3]) fireEvent.click(screen.getByRole('button', { name: `Mark round ${r} complete` }))
    expect(screen.getByText(/≈ \d+ kcal burned/)).toBeInTheDocument()
  })

  it('shows a calorie breakdown when the guided session finishes', () => {
    render(<App />)
    fireEvent.click(screen.getByText('▶ Start guided session'))
    const timer = screen.getByRole('region', { name: 'Guided timer' })
    expect(within(timer).queryByLabelText('Calories burned')).not.toBeInTheDocument()
    for (let i = 0; i < 500 && !/Session complete/.test(timer.textContent ?? ''); i++)
      fireEvent.click(within(timer).getByRole('button', { name: /Skip/ }))
    const summary = within(timer).getByLabelText('Calories burned')
    expect(summary).toHaveTextContent('Core')
    expect(summary).toHaveTextContent('Powder Day')
    expect(summary).toHaveTextContent('Stretch + Mobility')
    expect(summary).toHaveTextContent(/Total ≈ \d+ kcal/)
    // Finishing also completes the workout, which now reports its own calories.
    expect(screen.getByText(/Workout complete/)).toBeInTheDocument()
  })
})
