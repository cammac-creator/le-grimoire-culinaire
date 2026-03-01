import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BatchPageState } from '@/hooks/useBatchOcr'

interface BatchProgressPanelProps {
  pages: BatchPageState[]
  onRetry: (pageNumber: number) => void
}

const STATUS_CONFIG = {
  pending: { icon: Upload, label: 'En attente', color: 'text-muted-foreground' },
  uploading: { icon: Loader2, label: 'Upload...', color: 'text-blue-500' },
  processing: { icon: Loader2, label: 'Analyse OCR...', color: 'text-amber-500' },
  done: { icon: CheckCircle2, label: 'Terminé', color: 'text-green-500' },
  error: { icon: AlertCircle, label: 'Erreur', color: 'text-destructive' },
} as const

export function BatchProgressPanel({ pages, onRetry }: BatchProgressPanelProps) {
  const doneCount = pages.filter((p) => p.status === 'done').length
  const total = pages.length
  const progress = total > 0 ? (doneCount / total) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Global progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progression</span>
          <span className="text-muted-foreground">
            {doneCount} / {total} page{total > 1 ? 's' : ''}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Per-page status */}
      <div className="grid gap-2 sm:grid-cols-2">
        {pages.map((page) => {
          const config = STATUS_CONFIG[page.status]
          const Icon = config.icon
          const spinning = page.status === 'uploading' || page.status === 'processing'

          return (
            <div
              key={page.pageNumber}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <img
                src={page.thumbnailUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-12 w-9 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Page {page.pageNumber}</p>
                <p className={cn('text-xs', config.color)}>
                  {page.status === 'error' ? page.error : config.label}
                </p>
              </div>
              <Icon
                className={cn('h-5 w-5 shrink-0', config.color, spinning && 'animate-spin')}
              />
              {page.status === 'error' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onRetry(page.pageNumber)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
