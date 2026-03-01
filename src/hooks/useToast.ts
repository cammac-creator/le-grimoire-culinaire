import { useCallback, useEffect, useState } from 'react'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: ToastAction
}

type ToastInput = Omit<Toast, 'id'>

const TOAST_DURATION = 4000
const TOAST_DURATION_WITH_ACTION = 6000
const listeners: Set<(t: Toast[]) => void> = new Set()
let toasts: Toast[] = []

function emit() {
  listeners.forEach((l) => l([...toasts]))
}

export function toast(input: ToastInput) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  toasts = [...toasts, { ...input, id }]
  emit()
  const duration = input.action ? TOAST_DURATION_WITH_ACTION : TOAST_DURATION
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, duration)
}

export function useToastState() {
  const [state, setState] = useState<Toast[]>([])
  useEffect(() => {
    listeners.add(setState)
    return () => { listeners.delete(setState) }
  }, [])
  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, [])
  return { toasts: state, dismiss }
}
