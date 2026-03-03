import { useCallback, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useKokoroTTS } from './useKokoroTTS'
import type { Recipe } from '@/types'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    : undefined

export function useCookingAssistant(recipe: Recipe) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [transcript, setTranscript] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const autoListenRef = useRef(false)
  const sendMessageRef = useRef<(text: string) => void>(() => {})

  const {
    speak: kokoroSpeak,
    stopSpeaking: kokoroStop,
    markSpeaking,
    ttsReady,
    ttsLoading,
    loadTTS,
  } = useKokoroTTS()

  const speak = useCallback((text: string, onDone?: () => void) => {
    markSpeaking()
    kokoroSpeak(
      text,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false)
        onDone?.()
      },
    )
  }, [kokoroSpeak, markSpeaking])

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results?.[event.results.length - 1]
      const text = result?.[0]?.transcript ?? ''
      setTranscript(text)
      if (result?.isFinal && text) {
        sendMessageRef.current(text)
        setTranscript('')
      }
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setTranscript('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setTranscript('')
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('cooking-assistant', {
        body: {
          message: text,
          recipe: {
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
          },
          history: messages.slice(-10),
        },
      })

      if (error) throw error

      const reply = data?.reply ?? "Désolé, je n'ai pas pu répondre."
      const assistantMsg: Message = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, assistantMsg])

      if (voiceEnabled) {
        speak(reply, () => {
          // En mode mains libres, re-écouter après la réponse vocale
          if (autoListenRef.current) {
            startListening()
          }
        })
      }
    } catch {
      const errorMsg = 'Erreur de communication avec l\'assistant.'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg },
      ])
      if (voiceEnabled) {
        speak(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }, [recipe, messages, voiceEnabled, speak, startListening])
  sendMessageRef.current = sendMessage

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (!prev) loadTTS()
      return !prev
    })
    if (isSpeaking) {
      kokoroStop()
      setIsSpeaking(false)
    }
  }, [isSpeaking, loadTTS, kokoroStop])

  const setHandsFree = useCallback((enabled: boolean) => {
    autoListenRef.current = enabled
    setVoiceEnabled(enabled)
    if (enabled) {
      loadTTS()
    } else {
      recognitionRef.current?.stop()
      kokoroStop()
      setIsListening(false)
      setIsSpeaking(false)
      setTranscript('')
    }
  }, [loadTTS, kokoroStop])

  return {
    messages,
    isLoading,
    isListening,
    isSpeaking,
    voiceEnabled,
    transcript,
    ttsReady,
    ttsLoading,
    hasSpeechRecognition: !!SpeechRecognition,
    sendMessage,
    startListening,
    stopListening,
    toggleVoice,
    setHandsFree,
  }
}
