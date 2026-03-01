import { useState } from 'react'
import { X, Play, Pause, RotateCcw, Bell, BellOff, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTimer, type TimerState } from '@/hooks/useTimer'
import { cn } from '@/lib/utils'

interface TimerWidgetProps {
  timers: TimerState[]
  onStart: (id: string) => void
  onPause: (id: string) => void
  onReset: (id: string) => void
  onRemove: (id: string) => void
  onStopAlarm?: (id: string) => void
}

const CIRCLE_SIZE = 120
const STROKE_WIDTH = 6
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function TimerCircle({ timer, onStart, onPause, onReset, onRemove, onStopAlarm }: {
  timer: TimerState
  onStart: (id: string) => void
  onPause: (id: string) => void
  onReset: (id: string) => void
  onRemove: (id: string) => void
  onStopAlarm?: (id: string) => void
}) {
  const progress = timer.totalSeconds > 0
    ? timer.remainingSeconds / timer.totalSeconds
    : 0
  const offset = CIRCUMFERENCE * (1 - progress)
  const isDone = timer.remainingSeconds <= 0
  const isUrgent = !isDone && timer.remainingSeconds <= 30

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border bg-card p-4 shadow-lg transition-all',
        timer.isAlarming && 'border-red-500 bg-red-50 dark:bg-red-950/30 animate-pulse',
        isUrgent && !isDone && 'border-orange-400',
      )}
    >
      {/* Label */}
      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[140px]">{timer.label}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(timer.id)} aria-label="Supprimer le minuteur">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Cercle + temps */}
      <div className="relative flex items-center justify-center" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        {/* Fond du cercle */}
        <svg className="absolute inset-0" width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-muted/40"
          />
          {/* Progression */}
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={cn(
              'transition-all duration-1000',
              isDone ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-primary',
            )}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>

        {/* Temps au centre */}
        <div className="z-10 flex flex-col items-center">
          {isDone ? (
            <span className="text-lg font-bold text-red-600">Terminé !</span>
          ) : (
            <span className={cn(
              'font-mono text-2xl font-bold tabular-nums',
              isUrgent && 'text-orange-600',
            )}>
              {formatTimer(timer.remainingSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex items-center gap-1">
        {timer.isAlarming ? (
          <Button
            variant="destructive"
            size="sm"
            className="h-8 gap-1.5 px-3"
            onClick={() => onStopAlarm?.(timer.id)}
            aria-label="Arrêter l'alarme"
          >
            <BellOff className="h-4 w-4" />
            Arrêter
          </Button>
        ) : isDone ? (
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onReset(timer.id)} aria-label="Relancer">
            <RotateCcw className="h-4 w-4" />
          </Button>
        ) : (
          <>
            {timer.isRunning ? (
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPause(timer.id)} aria-label="Pause">
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="default" size="icon" className="h-8 w-8" onClick={() => onStart(timer.id)} aria-label="Démarrer">
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onReset(timer.id)} aria-label="Réinitialiser">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function TimerWidget({ timers, onStart, onPause, onReset, onRemove, onStopAlarm }: TimerWidgetProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (timers.length === 0) return null

  const alarmingCount = timers.filter((t) => t.isAlarming).length
  const runningCount = timers.filter((t) => t.isRunning).length

  // Mode réduit : petite pastille cliquable
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={cn(
          'fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all',
          'border bg-card hover:bg-accent',
          alarmingCount > 0 && 'border-red-500 bg-red-50 dark:bg-red-950/30 animate-pulse',
        )}
        aria-label="Afficher les minuteurs"
      >
        <Bell className={cn('h-4 w-4', alarmingCount > 0 ? 'text-red-500' : 'text-primary')} />
        <span className="text-sm font-medium">
          {alarmingCount > 0
            ? `${alarmingCount} terminé${alarmingCount > 1 ? 's' : ''} !`
            : `${runningCount} en cours`}
        </span>
        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2" aria-live="polite">
      {/* Bouton réduire */}
      <button
        onClick={() => setCollapsed(true)}
        className="flex items-center gap-1 self-start rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Réduire les minuteurs"
      >
        <ChevronDown className="h-3 w-3" />
        Réduire
      </button>

      {/* Liste des minuteurs */}
      <div className={cn(
        'flex gap-3',
        timers.length > 2 && 'flex-wrap',
      )}>
        {timers.map((timer) => (
          <TimerCircle
            key={timer.id}
            timer={timer}
            onStart={onStart}
            onPause={onPause}
            onReset={onReset}
            onRemove={onRemove}
            onStopAlarm={onStopAlarm}
          />
        ))}
      </div>
    </div>
  )
}
