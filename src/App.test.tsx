import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

const STORE = 'strength-to-snow:progress:v1'

describe('App', () => {
  beforeEach(() => localStorage.clear())

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

  it('does not treat a scrollTo return value as an effect cleanup', () => {
    const original = window.scrollTo
    window.scrollTo = (() => ({})) as unknown as typeof window.scrollTo
    try {
      expect(() => render(<App />)).not.toThrow()
    } finally {
      window.scrollTo = original
    }
  })
})
