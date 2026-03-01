import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCookingAssistant } from '@/hooks/useCookingAssistant'
import { cn } from '@/lib/utils'
import type { Recipe } from '@/types'

interface AssistantWidgetProps {
  recipe: Recipe
}

export function AssistantWidget({ recipe }: AssistantWidgetProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    isListening,
    isSpeaking,
    voiceEnabled,
    hasSpeechRecognition,
    sendMessage,
    startListening,
    stopListening,
    toggleVoice,
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

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg',
          isListening && 'animate-pulse ring-2 ring-red-500'
        )}
        size="icon"
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant culinaire"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-36 right-4 z-50 flex h-[28rem] w-80 flex-col rounded-lg border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-medium">Assistant culinaire</span>
            <div className="flex items-center gap-1">
              {hasSpeechRecognition && (
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
                    : 'bg-muted'
                )}
              >
                {msg.content}
              </div>
            ))}
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
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
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
