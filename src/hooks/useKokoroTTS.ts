import { useCallback, useRef, useState } from 'react'
import type { KokoroTTS } from 'kokoro-js'

// ── Singleton module-level ───────────────────────────────────
let instance: KokoroTTS | null = null
let loadPromise: Promise<KokoroTTS> | null = null

async function loadKokoro(): Promise<KokoroTTS> {
  if (instance) return instance
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const { KokoroTTS: KokoroClass } = await import('kokoro-js')
    const tts = await KokoroClass.from_pretrained(
      'onnx-community/Kokoro-82M-v1.0-ONNX',
      { dtype: 'q8' },
    )
    instance = tts
    return tts
  })()

  try {
    return await loadPromise
  } catch (err) {
    loadPromise = null
    throw err
  }
}

// ── Fallback Web Speech API ──────────────────────────────────
function speakFallback(text: string, onDone?: () => void) {
  if (!('speechSynthesis' in window)) {
    onDone?.()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  const voices = window.speechSynthesis.getVoices()
  const frVoice = voices.find((v) => v.lang.startsWith('fr'))
  if (frVoice) utterance.voice = frVoice
  utterance.onend = () => onDone?.()
  utterance.onerror = () => onDone?.()
  window.speechSynthesis.speak(utterance)
}

// ── Hook React ───────────────────────────────────────────────
export function useKokoroTTS() {
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsReady, setTtsReady] = useState(!!instance)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const isSpeakingRef = useRef(false)

  const loadTTS = useCallback(async () => {
    if (instance) {
      setTtsReady(true)
      return
    }
    setTtsLoading(true)
    try {
      await loadKokoro()
      setTtsReady(true)
    } catch (err) {
      console.warn('[KokoroTTS] Chargement échoué, fallback Web Speech', err)
    } finally {
      setTtsLoading(false)
    }
  }, [])

  const speak = useCallback(
    async (text: string, onStart?: () => void, onDone?: () => void) => {
      if (!instance) {
        onStart?.()
        speakFallback(text, onDone)
        return
      }

      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext({ sampleRate: 24000 })
        }
        const ctx = audioCtxRef.current
        if (ctx.state === 'suspended') await ctx.resume()

        const rawAudio = await instance.generate(text, {
          voice: 'ff_siwis' as never,
        })

        if (!isSpeakingRef.current) {
          // stopSpeaking was called during generation
          onDone?.()
          return
        }

        const samples = rawAudio.audio as Float32Array<ArrayBuffer>
        const buffer = ctx.createBuffer(1, samples.length, rawAudio.sampling_rate)
        buffer.copyToChannel(samples, 0)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        sourceRef.current = source

        onStart?.()

        await new Promise<void>((resolve) => {
          source.onended = () => {
            sourceRef.current = null
            resolve()
          }
          source.start()
        })

        onDone?.()
      } catch (err) {
        console.warn('[KokoroTTS] Erreur synthèse, fallback Web Speech', err)
        onStart?.()
        speakFallback(text, onDone)
      }
    },
    [],
  )

  const stopSpeaking = useCallback(() => {
    isSpeakingRef.current = false
    if (sourceRef.current) {
      try {
        sourceRef.current.stop()
      } catch {
        // already stopped
      }
      sourceRef.current = null
    }
    window.speechSynthesis.cancel()
  }, [])

  const markSpeaking = useCallback(() => {
    isSpeakingRef.current = true
  }, [])

  return { speak, stopSpeaking, markSpeaking, ttsReady, ttsLoading, loadTTS }
}
