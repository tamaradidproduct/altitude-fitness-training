import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => localStorage.clear())

  it('lists all five workouts', () => {
    render(<App />)
    for (const name of ['Powder Day', 'Last Chair', 'All Mountain Muscle', 'Earn Your Turns', 'Do It for the Après'])
      expect(screen.getByText(name)).toBeInTheDocument()
  })

  it('completes a workout and updates the weekly count', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Powder Day'))
    fireEvent.click(screen.getByRole('checkbox', { name: /Bodyweight Squat/ }))
    expect(screen.getByText('1 / 15 sets checked')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Mark workout complete'))
    fireEvent.click(screen.getByText('← Week overview'))
    expect(screen.getByText('Strength').previousSibling).toHaveTextContent('1/3')
    expect(screen.getByRole('button', { name: /^Workout on/, pressed: true })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('strength-to-snow:progress:v1')!).completed['1:strength-a']).toBeTruthy()
  })
})

describe('App in hosts that wrap window.scrollTo', () => {
  it('does not treat a scrollTo return value as an effect cleanup', () => {
    const original = window.scrollTo
    window.scrollTo = (() => ({})) as unknown as typeof window.scrollTo
    try {
      render(<App />)
      fireEvent.click(screen.getByText('Powder Day'))
      expect(() => fireEvent.click(screen.getByText('← Week overview'))).not.toThrow()
      expect(screen.getByText('Last Chair')).toBeInTheDocument()
    } finally {
      window.scrollTo = original
    }
  })
})
