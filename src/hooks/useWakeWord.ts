import { useState, useEffect, useRef, useCallback } from 'react'
import type { PorcupineWorker, PorcupineKeyword, BuiltInKeyword } from '@picovoice/porcupine-web'

type WakeWordStatus = 'idle' | 'loading' | 'listening' | 'error'

interface UseWakeWordOptions {
  enabled: boolean
  onDetected: () => void
}

interface UseWakeWordReturn {
  status: WakeWordStatus
  isSupported: boolean
}

const ACCESS_KEY = import.meta.env.VITE_PICOVOICE_ACCESS_KEY as string | undefined

/**
 * Hook de détection du mot de réveil via Picovoice Porcupine.
 * Charge le WASM uniquement quand `enabled` passe à true (lazy loading).
 * Tente le fichier custom "OK Chef" (.ppn), sinon fallback sur "Computer".
 *
 * Le worker Porcupine est gardé en vie entre les toggles (subscribe/unsubscribe)
 * pour éviter de recharger le WASM à chaque entrée/sortie du mode mains libres.
 */
export function useWakeWord({ enabled, onDetected }: UseWakeWordOptions): UseWakeWordReturn {
  const [status, setStatus] = useState<WakeWordStatus>('idle')

  const isSupported =
    typeof WebAssembly !== 'undefined' &&
    typeof navigator?.mediaDevices?.getUserMedia === 'function' &&
    !!ACCESS_KEY

  const porcupineRef = useRef<PorcupineWorker | null>(null)
  const subscribedRef = useRef(false)
  const initPromiseRef = useRef<Promise<boolean> | null>(null)
  const disposedRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  /**
   * Initialise Porcupine une seule fois. Les appels suivants retournent
   * la même promesse. Retourne true si l'init a réussi.
   */
  const ensureInitialized = useCallback(async (): Promise<boolean> => {
    if (disposedRef.current) return false
    if (porcupineRef.current) return true
    if (initPromiseRef.current) return initPromiseRef.current

    initPromiseRef.current = (async () => {
      const [{ PorcupineWorker: PorcupineWorkerClass, BuiltInKeyword }] = await Promise.all([
        import('@picovoice/porcupine-web'),
        import('@picovoice/web-voice-processor'),
      ])

      // Vérifier le fichier custom avec HEAD (pas de téléchargement inutile)
      // et valider le content-type pour éviter le piège du SPA fallback
      // (Vercel retourne index.html avec 200 pour les fichiers inexistants)
      let keyword: PorcupineKeyword | BuiltInKeyword = BuiltInKeyword.Computer
      try {
        const res = await fetch('/porcupine/ok-chef_wasm.ppn', { method: 'HEAD' })
        if (res.ok && !res.headers.get('content-type')?.startsWith('text/')) {
          keyword = {
            publicPath: '/porcupine/ok-chef_wasm.ppn',
            label: 'OK Chef',
            sensitivity: 0.65,
          }
        }
      } catch {
        // Fichier custom absent — fallback "Computer"
      }

      const porcupine = await PorcupineWorkerClass.create(
        ACCESS_KEY!,
        keyword,
        (detection) => {
          console.log('[WakeWord] Détecté :', detection.label)
          onDetectedRef.current()
        },
        { publicPath: '/porcupine/porcupine_params.pv', forceWrite: true },
        {
          processErrorCallback: (error) => {
            console.error('[WakeWord] Erreur de traitement :', error)
            if (enabledRef.current) setStatus('error')
          },
        },
      )

      // Si le composant a été démonté pendant l'init async, libérer immédiatement
      if (disposedRef.current) {
        porcupine.release().catch(() => {})
        return false
      }

      porcupineRef.current = porcupine
      return true
    })().catch((err) => {
      console.error('[WakeWord] Échec d\'initialisation :', err)
      initPromiseRef.current = null
      return false
    })

    return initPromiseRef.current
  }, [])

  /**
   * Subscribe au micro (commence l'écoute du wake word).
   * Ne recrée pas le worker s'il existe déjà.
   */
  const subscribe = useCallback(async () => {
    if (subscribedRef.current || !porcupineRef.current) return
    const { WebVoiceProcessor } = await import('@picovoice/web-voice-processor')
    await WebVoiceProcessor.subscribe(porcupineRef.current)
    subscribedRef.current = true
  }, [])

  /**
   * Unsubscribe du micro (arrête l'écoute sans détruire le worker).
   */
  const unsubscribe = useCallback(async () => {
    if (!subscribedRef.current || !porcupineRef.current) return
    try {
      const { WebVoiceProcessor } = await import('@picovoice/web-voice-processor')
      await WebVoiceProcessor.unsubscribe(porcupineRef.current)
    } catch {
      // Best-effort
    }
    subscribedRef.current = false
  }, [])

  // Gestion de l'écoute : subscribe quand enabled, unsubscribe quand disabled
  useEffect(() => {
    if (!isSupported) return

    if (!enabled) {
      if (subscribedRef.current) {
        unsubscribe()
        setStatus('idle')
      }
      return
    }

    let cancelled = false

    ;(async () => {
      setStatus('loading')

      const ok = await ensureInitialized()
      if (cancelled || !ok) {
        if (!cancelled && !ok) setStatus('error')
        return
      }

      try {
        await subscribe()
        if (!cancelled) setStatus('listening')
      } catch (err) {
        console.error('[WakeWord] Erreur subscribe :', err)
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      unsubscribe()
      setStatus('idle')
    }
  }, [enabled, isSupported, ensureInitialized, subscribe, unsubscribe])

  // Nettoyage complet au démontage (release le worker)
  useEffect(() => {
    return () => {
      disposedRef.current = true
      const porcupine = porcupineRef.current
      porcupineRef.current = null
      initPromiseRef.current = null

      if (!porcupine) return

      import('@picovoice/web-voice-processor').then(({ WebVoiceProcessor }) => {
        if (subscribedRef.current) {
          WebVoiceProcessor.unsubscribe(porcupine).catch(() => {})
          subscribedRef.current = false
        }
        porcupine.release().catch(() => {})
      }).catch(() => {})
    }
  }, [])

  return { status, isSupported }
}
