import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

const STORE = 'strength-to-snow:progress:v1'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('strength-to-snow:week:v1', '1')
    localStorage.removeItem('strength-to-snow:optional-core:v1')
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

  it('defaults to the latest week and lets you switch between weeks', () => {
    localStorage.removeItem('strength-to-snow:week:v1')
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Week 2', selected: true })).toBeInTheDocument()
    expect(screen.getByText('Bird Dog Crunch')).toBeInTheDocument()
    expect(screen.getByText('Week 2: Base — Build the Foundation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View original Week 2 PDF/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/pdf\/week-2\.pdf$/),
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Week 1' }))
    expect(screen.getByText('Bird Dog')).toBeInTheDocument()
    expect(localStorage.getItem('strength-to-snow:week:v1')).toBe('1')
  })

  it('tracks each week\'s workouts separately', () => {
    render(<App />)
    for (const r of [1, 2, 3]) fireEvent.click(screen.getByRole('button', { name: `Mark round ${r} complete` }))
    expect(screen.getByText('Strength').previousSibling).toHaveTextContent('1/3')
    fireEvent.click(screen.getByRole('tab', { name: 'Week 2' }))
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

    it('can be added from the picker, shown as optional, and removed again', () => {
      render(<App />)
      open()
      fireEvent.click(screen.getByRole('button', { name: 'Add Dead Bug' }))
      expect(screen.getByText('1 added')).toBeInTheDocument()
      expect(screen.getByText('Optional')).toBeInTheDocument()
      expect(screen.getByText('5 min + 1 optional')).toBeInTheDocument()
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
