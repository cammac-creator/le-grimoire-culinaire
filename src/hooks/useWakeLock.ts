import { useCallback, useEffect, useRef, useState } from 'react'

interface WakeLockStatus {
  /** true si la Wake Lock API est dispo dans le navigateur */
  supported: boolean
  /** true si un wake lock est actif maintenant */
  active: boolean
  /** Compte les release inattendues (utile pour signaler à l'utilisateur) */
  releaseCount: number
}

/**
 * Empêche l'écran de se mettre en veille tant que le composant est monté.
 *
 * - Utilise la Wake Lock API (Safari iOS 16.4+, Chrome 84+)
 * - Re-demande activement après chaque release (système ou onglet caché)
 * - Heartbeat 30 s pour vérifier que le lock tient (certains OS le coupent
 *   silencieusement après une longue inactivité)
 * - Expose un statut consommable par l'UI (badge "écran maintenu allumé")
 */
export function useWakeLock(active = true): WakeLockStatus {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const releasedRef = useRef(false)
  const [supported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator)
  const [activeNow, setActiveNow] = useState(false)
  const [releaseCount, setReleaseCount] = useState(0)

  const request = useCallback(async () => {
    if (!supported || releasedRef.current) return
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      wakeLockRef.current = sentinel
      setActiveNow(true)
      sentinel.addEventListener('release', () => {
        wakeLockRef.current = null
        setActiveNow(false)
        if (!releasedRef.current) {
          // Release non sollicité — on tentera de re-demander
          setReleaseCount((c) => c + 1)
        }
      })
    } catch {
      setActiveNow(false)
    }
  }, [supported])

  useEffect(() => {
    if (!active || !supported) return
    releasedRef.current = false
    // request déclenche setState (active/releaseCount) — c'est l'effet voulu
    // ici (sync entre lock système et UI), pas un cascade render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void request()

    // Re-demander quand l'onglet redevient visible
    const handleVisibility = () => {
      if (!releasedRef.current && document.visibilityState === 'visible' && !wakeLockRef.current) {
        void request()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Heartbeat : si le wake lock a été coupé silencieusement, on le redemande
    const heartbeat = window.setInterval(() => {
      if (!releasedRef.current && document.visibilityState === 'visible' && !wakeLockRef.current) {
        void request()
      }
    }, 30_000)

    return () => {
      releasedRef.current = true
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(heartbeat)
      wakeLockRef.current?.release().catch(() => undefined)
      wakeLockRef.current = null
      setActiveNow(false)
    }
  }, [active, supported, request])

  return { supported, active: activeNow, releaseCount }
}
