import { useState, useRef, useEffect } from 'react'
import {
  ChefHat,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCookingAssistant } from '@/hooks/useCookingAssistant'
import { cn } from '@/lib/utils'
import type { Recipe } from '@/types'

interface AssistantWidgetProps {
  recipe: Recipe
  onPlayCooking?: () => void
}

export function AssistantWidget({ recipe, onPlayCooking }: AssistantWidgetProps) {
  const [open, setOpen] = useState(false)
  const [handsFreeMode, setHandsFreeMode] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    isListening,
    isSpeaking,
    voiceEnabled,
    transcript,
    hasSpeechRecognition,
    sendMessage,
    startListening,
    stopListening,
    toggleVoice,
    setHandsFree,
  } = useCookingAssistant(recipe)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  const enterHandsFree = () => {
    setHandsFreeMode(true)
    setOpen(true)
    setHandsFree(true)
    startListening()
  }

  const exitHandsFree = () => {
    setHandsFreeMode(false)
    setHandsFree(false)
  }

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')

  // Mode mains libres plein écran
  if (handsFreeMode) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background/98 backdrop-blur-sm">
        {/* Header mains libres */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <span className="font-medium">Mode cuisine — {recipe.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoice}
              aria-label={voiceEnabled ? 'Désactiver la synthèse vocale' : 'Activer la synthèse vocale'}
            >
              {voiceEnabled ? (
                <Volume2 className={cn('h-5 w-5', isSpeaking && 'text-primary animate-pulse')} />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={exitHandsFree}
              aria-label="Quitter le mode mains libres"
            >
              <Minimize2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { exitHandsFree(); setOpen(false) }}
              aria-label="Fermer l'assistant"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Zone principale */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
          {/* Dernière réponse de l'assistant */}
          {isLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg">Réflexion...</span>
            </div>
          ) : lastAssistantMsg ? (
            <div className="max-w-2xl rounded-xl bg-card p-6 text-center shadow-lg">
              <p className="text-lg leading-relaxed">{lastAssistantMsg.content}</p>
            </div>
          ) : (
            <div className="max-w-md text-center">
              <ChefHat className="mx-auto mb-4 h-16 w-16 text-primary/40" />
              <p className="text-lg text-muted-foreground">
                Appuyez sur le micro et posez votre question
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                « Combien de farine ? », « Par quoi remplacer le beurre ? », « Explique l'étape 3 »
              </p>
            </div>
          )}

          {/* Transcription en cours */}
          {transcript && (
            <div className="rounded-lg bg-muted px-4 py-2 text-sm italic text-muted-foreground">
              {transcript}...
            </div>
          )}

          {/* Gros bouton micro */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading || isSpeaking}
            className={cn(
              'relative flex h-28 w-28 items-center justify-center rounded-full transition-all',
              'focus:outline-none focus-visible:ring-4 focus-visible:ring-ring',
              isListening
                ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                : 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105',
              (isLoading || isSpeaking) && 'opacity-50 cursor-not-allowed',
            )}
            aria-label={isListening ? 'Arrêter l\'écoute' : 'Parler à l\'assistant'}
          >
            {isListening ? (
              <>
                <MicOff className="h-12 w-12" />
                {/* Pulse animation */}
                <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-20" />
              </>
            ) : (
              <Mic className="h-12 w-12" />
            )}
          </button>

          <p className="text-sm text-muted-foreground">
            {isListening ? 'Je vous écoute...' : isSpeaking ? 'Lecture en cours...' : 'Appuyez pour parler'}
          </p>
        </div>

        {/* Input texte en bas (fallback) */}
        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="mx-auto flex max-w-xl gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ou tapez votre question ici..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Mode chat classique (mini panel)
  return (
    <>
      {/* Floating buttons — ordre : Play, ChefHat, Mic */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
        {/* 1. Bouton Play (mode cuisine étape par étape) */}
        {onPlayCooking && !open && (
          <Button
            onClick={onPlayCooking}
            className="h-12 w-12 rounded-full shadow-lg"
            variant="secondary"
            size="icon"
            aria-label="Lancer le mode cuisine"
          >
            <Play className="h-5 w-5" />
          </Button>
        )}

        {/* 2. Bouton ChefHat (assistant chat) */}
        <Button
          onClick={() => setOpen(!open)}
          className={cn(
            'h-12 w-12 rounded-full shadow-lg',
            isListening && 'animate-pulse ring-2 ring-red-500',
          )}
          size="icon"
          aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant culinaire"}
        >
          {open ? <X className="h-5 w-5" /> : <ChefHat className="h-5 w-5" />}
        </Button>

        {/* 3. Bouton Micro (mains libres) */}
        {hasSpeechRecognition && !open && (
          <Button
            onClick={enterHandsFree}
            className="h-12 w-12 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90"
            size="icon"
            aria-label="Mode mains libres"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Panel chat */}
      {open && (
        <div className="fixed bottom-36 right-4 z-50 flex h-[28rem] w-80 flex-col rounded-lg border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-medium">Assistant culinaire</span>
            <div className="flex items-center gap-1">
              {hasSpeechRecognition && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={enterHandsFree}
                    aria-label="Mode mains libres"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? 'Arrêter le micro' : 'Activer le micro'}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 text-red-500" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleVoice}
                aria-label={voiceEnabled ? 'Désactiver la voix' : 'Activer la voix'}
              >
                {voiceEnabled ? (
                  <Volume2 className={cn('h-4 w-4', isSpeaking && 'text-primary animate-pulse')} />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">
                Posez une question sur « {recipe.title} » !
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted',
                )}
              >
                {msg.content}
              </div>
            ))}
            {transcript && (
              <div className="ml-auto max-w-[85%] rounded-lg px-3 py-2 text-sm bg-primary/20 italic">
                {transcript}...
              </div>
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Réflexion...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-2">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Votre question..."
                className="text-sm"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
