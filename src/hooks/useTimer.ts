import { useCallback, useEffect, useRef, useState } from 'react'

export interface TimerState {
  id: string
  label: string
  totalSeconds: number
  remainingSeconds: number
  isRunning: boolean
  isAlarming: boolean
}

interface PersistedTimer {
  id: string
  label: string
  totalSeconds: number
  remainingSeconds: number
  isRunning: boolean
  endsAt: number | null // epoch ms si running
}

const STORAGE_KEY = 'grimoire-timers-v1'

function loadPersistedTimers(): PersistedTimer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePersistedTimers(timers: PersistedTimer[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers))
  } catch {
    // QuotaExceeded ou storage indisponible — ignore silencieusement
  }
}

// Génère un bip via Web Audio API (pas besoin de fichier audio)
function createAlarmSound(): { start: () => void; stop: () => void } {
  let ctx: AudioContext | null = null
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
        beep()
        let count = 0
        interval = window.setInterval(() => {
          count++
          if (count % 5 < 3) beep()
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
      if (ctx) {
        ctx.close()
        ctx = null
      }
    },
  }
}

export function useTimer() {
  const intervalsRef = useRef<Map<string, number>>(new Map())
  const alarmsRef = useRef<Map<string, ReturnType<typeof createAlarmSound>>>(new Map())
  const remainingAtStartRef = useRef<Map<string, number>>(new Map())
  const startTimeRef = useRef<Map<string, number>>(new Map())

  // Restoration : recalcule l'état des timers persistés après une fermeture/refresh
  const [timers, setTimers] = useState<Map<string, TimerState>>(() => {
    const persisted = loadPersistedTimers()
    const now = Date.now()
    const restored = new Map<string, TimerState>()
    for (const p of persisted) {
      if (p.isRunning && p.endsAt) {
        const remaining = Math.max(0, Math.floor((p.endsAt - now) / 1000))
        restored.set(p.id, {
          id: p.id,
          label: p.label,
          totalSeconds: p.totalSeconds,
          remainingSeconds: remaining,
          isRunning: remaining > 0,
          isAlarming: remaining === 0, // déjà expiré pendant la fermeture
        })
      } else {
        restored.set(p.id, {
          id: p.id,
          label: p.label,
          totalSeconds: p.totalSeconds,
          remainingSeconds: p.remainingSeconds,
          isRunning: false,
          isAlarming: false,
        })
      }
    }
    return restored
  })

  // Persistance : à chaque mutation des timers, sérialiser
  useEffect(() => {
    const persisted: PersistedTimer[] = Array.from(timers.values()).map((t) => ({
      id: t.id,
      label: t.label,
      totalSeconds: t.totalSeconds,
      remainingSeconds: t.remainingSeconds,
      isRunning: t.isRunning,
      endsAt: t.isRunning ? Date.now() + t.remainingSeconds * 1000 : null,
    }))
    savePersistedTimers(persisted)
  }, [timers])

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
    stopAlarm(id)

    setTimers((prev) => {
      const timer = prev.get(id)
      if (!timer || timer.isRunning) return prev
      remainingAtStartRef.current.set(id, timer.remainingSeconds)
      startTimeRef.current.set(id, Date.now())
      const next = new Map(prev)
      next.set(id, { ...timer, isRunning: true, isAlarming: false })
      return next
    })

    const interval = window.setInterval(() => {
      const startedAt = startTimeRef.current.get(id) ?? Date.now()
      const initial = remainingAtStartRef.current.get(id) ?? 0
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const remaining = Math.max(0, initial - elapsed)

      setTimers((prev) => {
        const timer = prev.get(id)
        if (!timer) return prev
        const next = new Map(prev)
        next.set(id, { ...timer, remainingSeconds: remaining })

        if (remaining <= 0) {
          clearInterval(interval)
          intervalsRef.current.delete(id)
          remainingAtStartRef.current.delete(id)
          startTimeRef.current.delete(id)
          next.set(id, { ...timer, remainingSeconds: 0, isRunning: false, isAlarming: true })

          const alarm = createAlarmSound()
          alarmsRef.current.set(id, alarm)
          alarm.start()

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
    remainingAtStartRef.current.delete(id)
    startTimeRef.current.delete(id)
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
    remainingAtStartRef.current.delete(id)
    startTimeRef.current.delete(id)
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
    remainingAtStartRef.current.delete(id)
    startTimeRef.current.delete(id)
    setTimers((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [stopAlarm])

  // Reprend les timers qui étaient running au moment du refresh/reload
  // Effectué une seule fois au montage, après la restoration synchrone du useState
  const didResumeRef = useRef(false)
  useEffect(() => {
    if (didResumeRef.current) return
    didResumeRef.current = true
    const toResume: string[] = []
    timers.forEach((t) => {
      if (t.isRunning && t.remainingSeconds > 0) toResume.push(t.id)
      if (t.isAlarming) {
        // Lancer alarme pour les timers expirés pendant l'absence
        const alarm = createAlarmSound()
        alarmsRef.current.set(t.id, alarm)
        alarm.start()
        setTimeout(() => {
          alarm.stop()
          alarmsRef.current.delete(t.id)
          setTimers((p) => {
            const cur = p.get(t.id)
            if (!cur) return p
            const n = new Map(p)
            n.set(t.id, { ...cur, isAlarming: false })
            return n
          })
        }, 30_000)
      }
    })
    // Repasse les running en pause d'abord, puis startTimer recrée l'interval
    if (toResume.length > 0) {
      setTimers((prev) => {
        const next = new Map(prev)
        toResume.forEach((id) => {
          const t = next.get(id)
          if (t) next.set(id, { ...t, isRunning: false })
        })
        return next
      })
      // Démarrer après le state update
      queueMicrotask(() => toResume.forEach((id) => startTimer(id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    const intervals = intervalsRef.current
    const alarms = alarmsRef.current
    return () => {
      intervals.forEach((interval) => clearInterval(interval))
      alarms.forEach((alarm) => alarm.stop())
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
