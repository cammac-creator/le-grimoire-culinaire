import { useState, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
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
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
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
      {/* Header — plus grand, plus tactile */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <span className="text-lg font-bold text-foreground">
          {current + 1}<span className="text-muted-foreground font-normal"> / {steps.length}</span>
        </span>
        <div className="flex-1 mx-4">
          {/* Barre de progression continue */}
          <div className="relative h-2 w-full rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((current + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onClose} aria-label="Fermer le mode cuisine">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Contenu — zone swipeable, plein écran */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden px-5 sm:px-8"
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
            className="w-full max-w-3xl text-center"
          >
            <div className="rounded-2xl bg-card p-8 sm:p-12 shadow-md">
              {/* Numéro d'étape bien visible */}
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {steps[current]?.number ?? current + 1}
              </div>

              {/* Texte de l'étape — grande taille */}
              <p className="text-xl sm:text-2xl md:text-3xl leading-relaxed sm:leading-loose">
                {steps[current]?.text}
              </p>

              {/* Bouton minuteur — grand et visible */}
              {timer && (
                <Button
                  variant="outline"
                  className="mt-8 h-14 px-8 text-lg gap-3"
                  onClick={() => onAddTimer(current)}
                >
                  <Timer className="h-6 w-6" />
                  Minuteur {timer.label}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation — très gros boutons pour mobile */}
      <div className="flex items-center gap-4 border-t border-border px-4 py-5 sm:px-6">
        <Button
          variant="outline"
          onClick={prev}
          disabled={current === 0}
          className="flex-1 h-16 text-lg font-medium"
        >
          <ChevronLeft className="mr-2 h-6 w-6" />
          Précédent
        </Button>
        <Button
          onClick={current === steps.length - 1 ? onClose : next}
          className="flex-1 h-16 text-lg font-medium"
        >
          {current === steps.length - 1 ? 'Terminer' : 'Suivant'}
          <ChevronRight className="ml-2 h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
