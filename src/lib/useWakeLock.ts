import { useEffect } from 'react'

/**
 * Keeps the screen on while the app is open and visible (Screen Wake Lock API).
 * Browsers drop the lock when the tab is hidden, so it is re-acquired on return.
 * Unsupported browsers (or a denied request) simply let the screen sleep as usual.
 */
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible' || sentinel) return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel = lock
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null
        })
      } catch {
        // Denied (e.g. low battery or no user gesture yet); retried on the next interaction.
      }
    }

    const onVisible = () => void acquire()
    document.addEventListener('visibilitychange', onVisible)
    // Some browsers only grant the lock after a user gesture.
    document.addEventListener('pointerdown', onVisible)
    void acquire()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      document.removeEventListener('pointerdown', onVisible)
      void sentinel?.release()
    }
  }, [])
}
