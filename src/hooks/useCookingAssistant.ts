import { useCallback, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Recipe } from '@/types'

interface Message {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

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
        speak(reply)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erreur de communication avec l\'assistant.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [recipe, messages, voiceEnabled])

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    const voices = window.speechSynthesis.getVoices()
    const frVoice = voices.find((v) => v.lang.startsWith('fr'))
    if (frVoice) utterance.voice = frVoice
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript
      if (transcript) sendMessage(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [sendMessage])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((v) => !v)
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSpeaking])

  return {
    messages,
    isLoading,
    isListening,
    isSpeaking,
    voiceEnabled,
    hasSpeechRecognition: !!SpeechRecognition,
    sendMessage,
    startListening,
    stopListening,
    toggleVoice,
  }
}
