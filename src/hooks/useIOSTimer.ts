import { useCallback, useRef, useState } from 'react'
import { supportsAppleShortcuts } from '@/lib/platform'
import {
  isShortcutInstalled,
  markShortcutInstalled,
  triggerIOSTimer,
  detectShortcutFailure,
} from '@/lib/ios-shortcut'

interface UseIOSTimerReturn {
  /**
   * Tente de lancer le minuteur iOS natif.
   * - Si non-iOS → retourne false (le caller doit utiliser le timer web)
   * - Si iOS + raccourci installe → lance et retourne true
   * - Si iOS + raccourci pas installe → affiche le prompt, retourne true
   */
  tryIOSTimer: (seconds: number) => boolean
  /** Controle le dialog d'installation du raccourci */
  showPrompt: boolean
  setShowPrompt: (v: boolean) => void
  /** Secondes en attente pendant que l'utilisateur installe le raccourci */
  pendingSeconds: number | null
  /** Confirme que le raccourci est installe et lance le timer */
  confirmAndLaunch: () => void
  /** L'utilisateur prefere le timer web pour cette fois */
  useFallback: () => void
}

export function useIOSTimer(): UseIOSTimerReturn {
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingSeconds, setPendingSeconds] = useState<number | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const tryIOSTimer = useCallback((seconds: number): boolean => {
    if (!supportsAppleShortcuts()) return false

    if (isShortcutInstalled()) {
      triggerIOSTimer(seconds)

      // Detecter si le raccourci a echoue (desinstalle depuis?)
      cleanupRef.current?.()
      cleanupRef.current = detectShortcutFailure(() => {
        // Le raccourci n'a pas fonctionne — re-afficher le prompt
        setPendingSeconds(seconds)
        setShowPrompt(true)
      })

      return true
    }

    // Raccourci pas encore installe → afficher le prompt
    setPendingSeconds(seconds)
    setShowPrompt(true)
    return true
  }, [])

  const confirmAndLaunch = useCallback(() => {
    markShortcutInstalled()
    setShowPrompt(false)
    if (pendingSeconds !== null) {
      triggerIOSTimer(pendingSeconds)
    }
    setPendingSeconds(null)
  }, [pendingSeconds])

  const useFallback = useCallback(() => {
    setShowPrompt(false)
    setPendingSeconds(null)
  }, [])

  return {
    tryIOSTimer,
    showPrompt,
    setShowPrompt,
    pendingSeconds,
    confirmAndLaunch,
    useFallback,
  }
}
