import { useState, useCallback } from 'react'
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

  const timer = parsedTimers.find((t) => t.stepIndex === current)

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-label="Mode cuisine">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          Étape {current + 1} / {steps.length}
        </span>
        <div className="flex-1 mx-4">
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${((current + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer le mode cuisine">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={reduced ? undefined : variants}
            initial={reduced ? undefined : 'enter'}
            animate={reduced ? undefined : 'center'}
            exit={reduced ? undefined : 'exit'}
            transition={{ duration: 0.25 }}
            drag={reduced ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (info.offset.x > 100) prev()
              else if (info.offset.x < -100) next()
            }}
            className="w-full max-w-2xl text-center"
          >
            <p className="text-xl sm:text-2xl leading-relaxed">
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border px-4 py-4">
        <Button
          variant="outline"
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>
        <Button
          onClick={next}
          disabled={current === steps.length - 1}
          className="flex items-center gap-2"
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
