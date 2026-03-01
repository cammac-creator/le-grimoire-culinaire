import { X, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTimer, type TimerState } from '@/hooks/useTimer'

interface TimerWidgetProps {
  timers: TimerState[]
  onStart: (id: string) => void
  onPause: (id: string) => void
  onReset: (id: string) => void
  onRemove: (id: string) => void
}

export function TimerWidget({ timers, onStart, onPause, onReset, onRemove }: TimerWidgetProps) {
  if (timers.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {timers.map((timer) => {
        const progress = timer.totalSeconds > 0
          ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100
          : 0
        const isDone = timer.remainingSeconds <= 0

        return (
          <div
            key={timer.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-lg"
          >
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">{timer.label}</div>
              <div className={`text-lg font-mono font-bold ${isDone ? 'text-green-600' : ''}`}>
                {isDone ? 'Termine !' : formatTimer(timer.remainingSeconds)}
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-muted">
                <div
                  className="h-1 rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isDone && (
                timer.isRunning ? (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPause(timer.id)}>
                    <Pause className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onStart(timer.id)}>
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                )
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReset(timer.id)}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(timer.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
