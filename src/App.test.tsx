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

  it('completes a workout and updates the weekly count', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Bodyweight Squat/ }))
    expect(screen.getByText('1 / 15 sets checked')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Mark workout complete'))
    expect(screen.getByText('Strength').previousSibling).toHaveTextContent('1/3')
    expect(screen.getByRole('button', { name: /^Workout on/, pressed: true })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORE)!).completed['1:strength-a']).toBeTruthy()
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
