import { X } from 'lucide-react'
import { useToastState } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToastState()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-5 fade-in',
            t.variant === 'destructive'
              ? 'border-destructive/50 bg-destructive text-destructive-foreground'
              : 'border-border bg-card text-card-foreground'
          )}
        >
          <div className="flex-1">
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm opacity-90">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
