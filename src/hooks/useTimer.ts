import { useCallback, useEffect, useRef, useState } from 'react'

export interface TimerState {
  id: string
  label: string
  totalSeconds: number
  remainingSeconds: number
  isRunning: boolean
  isAlarming: boolean
}

// Génère un bip via Web Audio API (pas besoin de fichier audio)
function createAlarmSound(): { start: () => void; stop: () => void } {
  let ctx: AudioContext | null = null
  let oscillator: OscillatorNode | null = null
  let gain: GainNode | null = null
  let interval: number | null = null

  function beep() {
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g)
    g.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'square'
    g.gain.value = 0.3
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  }

  return {
    start() {
      try {
        ctx = new AudioContext()
        // 3 bips rapides, pause, répéter
        beep()
        let count = 0
        interval = window.setInterval(() => {
          count++
          if (count % 5 < 3) beep() // 3 bips puis 2 silences
        }, 300)
      } catch {
        // Web Audio non supporté
      }
    },
    stop() {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      if (oscillator) {
        try { oscillator.stop() } catch { /* already stopped */ }
        oscillator = null
      }
      if (gain) { gain = null }
      if (ctx) {
        ctx.close()
        ctx = null
      }
    },
  }
}

export function useTimer() {
  const [timers, setTimers] = useState<Map<string, TimerState>>(new Map())
  const intervalsRef = useRef<Map<string, number>>(new Map())
  const alarmsRef = useRef<Map<string, ReturnType<typeof createAlarmSound>>>(new Map())

  const stopAlarm = useCallback((id: string) => {
    const alarm = alarmsRef.current.get(id)
    if (alarm) {
      alarm.stop()
      alarmsRef.current.delete(id)
    }
    setTimers((prev) => {
      const timer = prev.get(id)
      if (!timer) return prev
      const next = new Map(prev)
      next.set(id, { ...timer, isAlarming: false })
      return next
    })
  }, [])

  const addTimer = useCallback((id: string, label: string, seconds: number) => {
    setTimers((prev) => {
      const next = new Map(prev)
      if (!next.has(id)) {
        next.set(id, { id, label, totalSeconds: seconds, remainingSeconds: seconds, isRunning: false, isAlarming: false })
      }
      return next
    })
  }, [])

  const startTimer = useCallback((id: string) => {
    // Si en alarme, arrêter l'alarme d'abord
    stopAlarm(id)

    setTimers((prev) => {
      const timer = prev.get(id)
      if (!timer || timer.isRunning) return prev
      const next = new Map(prev)
      next.set(id, { ...timer, isRunning: true, isAlarming: false })
      return next
    })

    const startTime = Date.now()
    let lastRemaining = 0
    setTimers((prev) => {
      lastRemaining = prev.get(id)?.remainingSeconds ?? 0
      return prev
    })

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, lastRemaining - elapsed)

      setTimers((prev) => {
        const timer = prev.get(id)
        if (!timer) return prev
        const next = new Map(prev)
        next.set(id, { ...timer, remainingSeconds: remaining })

        if (remaining <= 0) {
          clearInterval(interval)
          intervalsRef.current.delete(id)
          next.set(id, { ...timer, remainingSeconds: 0, isRunning: false, isAlarming: true })

          // Lancer l'alarme sonore
          const alarm = createAlarmSound()
          alarmsRef.current.set(id, alarm)
          alarm.start()

          // Arrêter l'alarme automatiquement après 30 secondes
          setTimeout(() => {
            alarm.stop()
            alarmsRef.current.delete(id)
            setTimers((p) => {
              const t = p.get(id)
              if (!t) return p
              const n = new Map(p)
              n.set(id, { ...t, isAlarming: false })
              return n
            })
          }, 30_000)

          // Notification aussi (en complément)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Minuteur terminé !', { body: timer.label })
          }
        }
        return next
      })
    }, 1000)

    intervalsRef.current.set(id, interval)
  }, [stopAlarm])

  const pauseTimer = useCallback((id: string) => {
    const interval = intervalsRef.current.get(id)
    if (interval) {
      clearInterval(interval)
      intervalsRef.current.delete(id)
    }
    setTimers((prev) => {
      const timer = prev.get(id)
      if (!timer) return prev
      const next = new Map(prev)
      next.set(id, { ...timer, isRunning: false })
      return next
    })
  }, [])

  const resetTimer = useCallback((id: string) => {
    stopAlarm(id)
    const interval = intervalsRef.current.get(id)
    if (interval) {
      clearInterval(interval)
      intervalsRef.current.delete(id)
    }
    setTimers((prev) => {
      const timer = prev.get(id)
      if (!timer) return prev
      const next = new Map(prev)
      next.set(id, { ...timer, remainingSeconds: timer.totalSeconds, isRunning: false, isAlarming: false })
      return next
    })
  }, [stopAlarm])

  const removeTimer = useCallback((id: string) => {
    stopAlarm(id)
    const interval = intervalsRef.current.get(id)
    if (interval) {
      clearInterval(interval)
      intervalsRef.current.delete(id)
    }
    setTimers((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [stopAlarm])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((interval) => clearInterval(interval))
      alarmsRef.current.forEach((alarm) => alarm.stop())
    }
  }, [])

  return {
    timers: Array.from(timers.values()),
    addTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    removeTimer,
    stopAlarm,
  }
}

export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}
