import { useCallback, useEffect, useRef, useState } from 'react'

export interface TimerState {
  id: string
  label: string
  totalSeconds: number
  remainingSeconds: number
  isRunning: boolean
}

export function useTimer() {
  const [timers, setTimers] = useState<Map<string, TimerState>>(new Map())
  const intervalsRef = useRef<Map<string, number>>(new Map())

  const addTimer = useCallback((id: string, label: string, seconds: number) => {
    setTimers((prev) => {
      const next = new Map(prev)
      if (!next.has(id)) {
        next.set(id, { id, label, totalSeconds: seconds, remainingSeconds: seconds, isRunning: false })
      }
      return next
    })
  }, [])

  const startTimer = useCallback((id: string) => {
    setTimers((prev) => {
      const timer = prev.get(id)
      if (!timer || timer.isRunning) return prev
      const next = new Map(prev)
      next.set(id, { ...timer, isRunning: true })
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
          next.set(id, { ...timer, remainingSeconds: 0, isRunning: false })
          notifyDone(timer.label)
        }
        return next
      })
    }, 1000)

    intervalsRef.current.set(id, interval)
  }, [])

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
    const interval = intervalsRef.current.get(id)
    if (interval) {
      clearInterval(interval)
      intervalsRef.current.delete(id)
    }
    setTimers((prev) => {
      const timer = prev.get(id)
      if (!timer) return prev
      const next = new Map(prev)
      next.set(id, { ...timer, remainingSeconds: timer.totalSeconds, isRunning: false })
      return next
    })
  }, [])

  const removeTimer = useCallback((id: string) => {
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
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((interval) => clearInterval(interval))
    }
  }, [])

  return {
    timers: Array.from(timers.values()),
    addTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    removeTimer,
  }
}

function notifyDone(label: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Minuteur termine !', { body: label })
  }
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
