import { useState, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Step } from '@/types'
import type { ParsedTimer } from '@/lib/time-parser'

interface CookingModeProps {
  steps: Step[]
  parsedTimers: ParsedTimer[]
  onAddTimer: (stepIndex: number) => void
  onClose: () => void
}

export function CookingMode({ steps, parsedTimers, onAddTimer, onClose }: CookingModeProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)
  const reduced = useReducedMotion()

  // Touch swipe fallback (pour les cas où framer-motion drag ne fonctionne pas bien)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const prev = useCallback(() => {
    if (current > 0) {
      setDirection(-1)
      setCurrent((c) => c - 1)
    }
  }, [current])

  const next = useCallback(() => {
    if (current < steps.length - 1) {
      setDirection(1)
      setCurrent((c) => c + 1)
    }
  }, [current, steps.length])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // Swipe horizontal seulement si le mouvement est plus horizontal que vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) prev()
      else next()
    }
  }, [prev, next])

  const timer = parsedTimers.find((t) => t.stepIndex === current)

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background" role="dialog" aria-label="Mode cuisine">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          Étape {current + 1} / {steps.length}
        </span>
        <div className="flex-1 mx-4">
          {/* Dots de progression */}
          <div className="flex items-center justify-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === current ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
                )}
                aria-label={`Aller à l'étape ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer le mode cuisine">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content — zone swipeable */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden px-4 sm:px-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={reduced ? undefined : variants}
            initial={reduced ? undefined : 'enter'}
            animate={reduced ? undefined : 'center'}
            exit={reduced ? undefined : 'exit'}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl text-center"
          >
            <div className="rounded-xl bg-card p-6 sm:p-8 shadow-sm">
              <div className="mb-4 flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                {steps[current]?.number ?? current + 1}
              </div>
              <p className="text-lg sm:text-xl leading-relaxed">
                {steps[current]?.text}
              </p>

              {timer && (
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => onAddTimer(current)}
                >
                  <Timer className="mr-2 h-4 w-4" />
                  Lancer le minuteur ({timer.label})
                </Button>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Swipez ou utilisez les boutons pour naviguer
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation — gros boutons tactiles */}
      <div className="flex items-center justify-between border-t border-border px-4 py-4 gap-3">
        <Button
          variant="outline"
          onClick={prev}
          disabled={current === 0}
          className="flex-1 h-12 text-base"
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Précédent
        </Button>
        <Button
          onClick={next}
          disabled={current === steps.length - 1}
          className="flex-1 h-12 text-base"
        >
          Suivant
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
