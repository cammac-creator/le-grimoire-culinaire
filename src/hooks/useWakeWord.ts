import { useState, useEffect, useRef, useCallback } from 'react'

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
 */
export function useWakeWord({ enabled, onDetected }: UseWakeWordOptions): UseWakeWordReturn {
  const [status, setStatus] = useState<WakeWordStatus>('idle')

  const isSupported =
    typeof WebAssembly !== 'undefined' &&
    typeof navigator?.mediaDevices?.getUserMedia === 'function' &&
    !!ACCESS_KEY

  // Refs to keep the instances alive across renders
  const porcupineRef = useRef<any>(null)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  // Track whether we should be listening (avoids stale closure issues)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const cleanup = useCallback(async () => {
    try {
      if (porcupineRef.current) {
        const { WebVoiceProcessor } = await import('@picovoice/web-voice-processor')
        await WebVoiceProcessor.unsubscribe(porcupineRef.current)
        await porcupineRef.current.release()
        porcupineRef.current = null
      }
    } catch {
      // Best-effort cleanup
    }
  }, [])

  useEffect(() => {
    if (!isSupported || !enabled) {
      // Stop listening if we were active
      if (porcupineRef.current) {
        cleanup()
        setStatus('idle')
      }
      return
    }

    let cancelled = false

    async function start() {
      setStatus('loading')
      try {
        // Dynamic imports for code splitting
        const [{ PorcupineWorker, BuiltInKeyword }, { WebVoiceProcessor }] = await Promise.all([
          import('@picovoice/porcupine-web'),
          import('@picovoice/web-voice-processor'),
        ])

        if (cancelled) return

        // Try to load custom "OK Chef" keyword, fallback to built-in "Computer"
        let keyword: any = BuiltInKeyword.Computer
        try {
          const res = await fetch('/porcupine/ok-chef_wasm.ppn')
          if (res.ok) {
            keyword = {
              publicPath: '/porcupine/ok-chef_wasm.ppn',
              label: 'OK Chef',
              sensitivity: 0.65,
            }
          }
        } catch {
          // Custom file not available — use built-in fallback
        }

        if (cancelled) return

        const porcupine = await PorcupineWorker.create(
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

        if (cancelled) {
          await porcupine.release()
          return
        }

        porcupineRef.current = porcupine
        await WebVoiceProcessor.subscribe(porcupine)

        if (cancelled) {
          await WebVoiceProcessor.unsubscribe(porcupine)
          await porcupine.release()
          porcupineRef.current = null
          return
        }

        setStatus('listening')
      } catch (err) {
        console.error('[WakeWord] Échec d\'initialisation :', err)
        if (!cancelled) setStatus('error')
      }
    }

    start()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [enabled, isSupported, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => { cleanup() }
  }, [cleanup])

  return { status, isSupported }
}
