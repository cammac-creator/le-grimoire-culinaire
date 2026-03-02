import { useEffect, useRef } from 'react'

/**
 * Empêche l'écran de se mettre en veille tant que le composant est monté.
 * Utilise la Wake Lock API (Safari iOS 16.4+, Chrome Android).
 * Se réactive automatiquement quand l'onglet redevient visible.
 */
export function useWakeLock(active = true) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let released = false

    const request = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null
        })
      } catch {
        // Wake Lock refusé (batterie faible, onglet caché, etc.)
      }
    }

    // Demander le wake lock
    request()

    // Re-demander quand l'onglet redevient visible (le wake lock est libéré automatiquement quand l'onglet est caché)
    const handleVisibility = () => {
      if (!released && document.visibilityState === 'visible') {
        request()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', handleVisibility)
      wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [active])
}
