import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X, ChevronLeft, ChevronRight, Timer, Check, Eye, Volume2, VolumeX, Plus, Lightbulb,
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useLocale } from '@/hooks/useLocale'
import type { Step } from '@/types'
import type { ParsedTimer } from '@/lib/time-parser'

interface CookingModeProps {
  steps: Step[]
  parsedTimers: ParsedTimer[]
  onAddTimer: (stepIndex: number) => void
  onAddCustomTimer?: (stepIndex: number, label: string, seconds: number) => void
  onClose: () => void
}

const STORAGE_KEY_PREFIX = 'grimoire-cooking-progress-'

/** Lit la voix française système préférée pour Web Speech API */
function pickFrVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? []
  const fr = voices.find((v) => v.lang?.startsWith('fr')) ?? voices[0] ?? null
  return fr
}

export function CookingMode({
  steps,
  parsedTimers,
  onAddTimer,
  onAddCustomTimer,
  onClose,
}: CookingModeProps) {
  const { t } = useLocale()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  const [voiceOn, setVoiceOn] = useState(false)
  const reduced = useReducedMotion()

  // Empêcher la mise en veille — statut affiché discrètement
  const wakeLock = useWakeLock()

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Persistance progression : si user ferme et revient, retrouve son point
  const progressKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}${steps.map((s) => s.text).join('|').slice(0, 80)}`,
    [steps],
  )

  useEffect(() => {
    try {
      const raw = localStorage.getItem(progressKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { current?: number; done?: number[] }
      if (typeof parsed.current === 'number' && parsed.current < steps.length) {
        setCurrent(parsed.current)
      }
      if (Array.isArray(parsed.done)) {
        setDoneSteps(new Set(parsed.done))
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressKey])

  useEffect(() => {
    try {
      localStorage.setItem(
        progressKey,
        JSON.stringify({ current, done: Array.from(doneSteps) }),
      )
    } catch {
      /* ignore */
    }
  }, [progressKey, current, doneSteps])

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

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return
    setDirection(index > current ? 1 : -1)
    setCurrent(index)
  }, [current, steps.length])

  const toggleDone = useCallback((index: number) => {
    setDoneSteps((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  // Lecture vocale (Web Speech API — gratuit, hors-ligne)
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'fr-FR'
    const voice = pickFrVoice()
    if (voice) utter.voice = voice
    utter.rate = 0.95
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  // Annonce vocale automatique au changement d'étape si voiceOn
  useEffect(() => {
    if (!voiceOn) return
    const text = steps[current]?.text
    if (text) speak(text)
    return () => stopSpeaking()
  }, [voiceOn, current, steps, speak, stopSpeaking])

  useEffect(() => () => stopSpeaking(), [stopSpeaking])

  // Touch swipe
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

  // Navigation clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'Enter') { e.preventDefault(); toggleDone(current) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose, toggleDone, current])

  const timer = parsedTimers.find((t) => t.stepIndex === current)
  const isDone = doneSteps.has(current)
  const allDone = doneSteps.size === steps.length

  // Timer rapide custom (5/10/15 min) si pas de timer auto-détecté
  const handleQuickTimer = useCallback(
    (minutes: number) => {
      onAddCustomTimer?.(current, `${steps[current]?.number ?? current + 1} · ${minutes} min`, minutes * 60)
    },
    [current, steps, onAddCustomTimer],
  )

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  }

  const prevStep = current > 0 ? steps[current - 1] : null
  const nextStep = current < steps.length - 1 ? steps[current + 1] : null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      role="dialog"
      aria-label={t('cooking.title')}
    >
      {/* Header avec progression segmentée et indicateurs discrets */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <span className="text-lg font-bold text-foreground tabular-nums">
          {current + 1}
          <span className="text-muted-foreground font-normal"> / {steps.length}</span>
        </span>

        {/* Barre segmentée : un trait par étape, vert si "fait", primary si courant */}
        <div className="flex-1 mx-4 flex gap-0.5" aria-label={t('cooking.progress')}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 flex-1 rounded-full transition-colors ${
                doneSteps.has(i)
                  ? 'bg-green-500/80'
                  : i === current
                    ? 'bg-primary'
                    : 'bg-muted hover:bg-muted-foreground/30'
              }`}
              aria-label={`${t('cooking.goToStep')} ${i + 1}`}
              aria-current={i === current ? 'step' : undefined}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Indicateur wake lock — discret, info-bulle au hover */}
          {wakeLock.supported && (
            <span
              title={wakeLock.active ? t('cooking.screenAwake') : t('cooking.screenAwakeOff')}
              className={`hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full ${
                wakeLock.active ? 'text-amber-500' : 'text-muted-foreground/40'
              }`}
              aria-label={wakeLock.active ? t('cooking.screenAwake') : t('cooking.screenAwakeOff')}
            >
              <Lightbulb className="h-4 w-4" />
            </span>
          )}

          {/* Toggle lecture vocale */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => {
              setVoiceOn((v) => {
                if (v) stopSpeaking()
                return !v
              })
            }}
            aria-label={voiceOn ? t('cooking.voiceOff') : t('cooking.voiceOn')}
            aria-pressed={voiceOn}
          >
            {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Aperçu étape précédente — discret */}
      {prevStep && (
        <button
          onClick={prev}
          className="px-5 sm:px-8 pt-3 pb-1 text-left opacity-50 hover:opacity-80 transition-opacity"
          aria-label={t('cooking.goToPrev')}
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {t('cooking.prevStep')} · {prevStep.number}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-1">{prevStep.text}</p>
        </button>
      )}

      {/* Contenu principal — étape courante */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden px-5 sm:px-8 py-2"
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
            <div className={`rounded-2xl bg-card p-6 sm:p-10 shadow-md transition-opacity ${isDone ? 'opacity-60' : ''}`}>
              {/* Cercle numéro tappable pour toggle "fait" */}
              <button
                onClick={() => toggleDone(current)}
                className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold transition-colors ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-primary-foreground hover:scale-105'
                }`}
                aria-label={isDone ? t('cooking.markUndone') : t('cooking.markDone')}
                aria-pressed={isDone}
              >
                {isDone ? <Check className="h-7 w-7" /> : (steps[current]?.number ?? current + 1)}
              </button>

              <p className={`text-xl sm:text-2xl md:text-3xl leading-relaxed sm:leading-loose ${isDone ? 'line-through decoration-2 decoration-muted-foreground/40' : ''}`}>
                {steps[current]?.text}
              </p>

              {/* Timer auto-détecté */}
              {timer && (
                <Button
                  variant="outline"
                  className="mt-6 h-14 px-8 text-lg gap-3"
                  onClick={() => onAddTimer(current)}
                >
                  <Timer className="h-6 w-6" />
                  {t('cooking.startTimer')} {timer.label}
                </Button>
              )}

              {/* Quick timers si pas de durée détectée */}
              {!timer && onAddCustomTimer && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground mr-1">{t('cooking.quickTimer')} :</span>
                  {[5, 10, 15, 30].map((min) => (
                    <Button
                      key={min}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickTimer(min)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      {min} min
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Aperçu étape suivante — discret */}
      {nextStep ? (
        <button
          onClick={next}
          className="px-5 sm:px-8 pb-3 pt-1 text-left opacity-50 hover:opacity-80 transition-opacity"
          aria-label={t('cooking.goToNext')}
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {t('cooking.nextStep')} · {nextStep.number}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-1">{nextStep.text}</p>
        </button>
      ) : (
        <div className="px-5 sm:px-8 pb-3 pt-1 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {allDone ? `✨ ${t('cooking.allDone')}` : t('cooking.lastStep')}
          </p>
        </div>
      )}

      {/* Navigation — gros boutons mobile */}
      <div className="flex items-center gap-3 border-t border-border px-4 py-4 sm:px-6">
        <Button
          variant="outline"
          onClick={prev}
          disabled={current === 0}
          className="flex-1 h-14 text-base font-medium"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          {t('cooking.previous')}
        </Button>
        <Button
          variant={isDone ? 'default' : 'outline'}
          size="icon"
          onClick={() => toggleDone(current)}
          className="h-14 w-14 shrink-0"
          aria-label={isDone ? t('cooking.markUndone') : t('cooking.markDone')}
          aria-pressed={isDone}
        >
          {isDone ? <Eye className="h-5 w-5" /> : <Check className="h-5 w-5" />}
        </Button>
        <Button
          onClick={current === steps.length - 1 ? onClose : next}
          className="flex-1 h-14 text-base font-medium"
        >
          {current === steps.length - 1 ? t('cooking.finish') : t('cooking.next')}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
