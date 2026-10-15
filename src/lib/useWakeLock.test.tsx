import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

function Probe() {
  useWakeLock()
  return null
}

function installWakeLock() {
  const release = vi.fn(() => Promise.resolve())
  let onRelease: () => void = () => {}
  const request = vi.fn(() =>
    Promise.resolve({
      release,
      addEventListener: (_: string, cb: () => void) => {
        onRelease = cb
      },
    }),
  )
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  return { request, release, dropLock: () => onRelease() }
}

describe('useWakeLock', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock')
  })

  it('requests a screen wake lock on mount and releases it on unmount', async () => {
    const { request, release } = installWakeLock()
    const { unmount } = render(<Probe />)
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'))
    unmount()
    await vi.waitFor(() => expect(release).toHaveBeenCalled())
  })

  it('does not request a second lock while already holding one', async () => {
    const { request } = installWakeLock()
    render(<Probe />)
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('re-acquires the lock after the browser drops it and the page is visible again', async () => {
    const { request, dropLock } = installWakeLock()
    render(<Probe />)
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    dropLock() // e.g. the tab was hidden
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2))
  })

  it('does nothing in browsers without the API', () => {
    expect(() => render(<Probe />)).not.toThrow()
  })
})
