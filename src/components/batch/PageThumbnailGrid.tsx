import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PdfPage } from '@/lib/pdf-extractor'

interface PageThumbnailGridProps {
  pages: PdfPage[]
  selected: Set<number>
  onToggle: (pageNumber: number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export function PageThumbnailGrid({
  pages,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: PageThumbnailGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.size} / {pages.length} page{pages.length > 1 ? 's' : ''} sélectionnée
          {selected.size > 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Tout sélectionner
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            Tout désélectionner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {pages.map((page) => {
          const isSelected = selected.has(page.pageNumber)
          return (
            <button
              key={page.pageNumber}
              type="button"
              onClick={() => onToggle(page.pageNumber)}
              className={cn(
                'group relative overflow-hidden rounded-lg border-2 transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border opacity-60 hover:opacity-100',
              )}
            >
              <img
                src={page.thumbnailUrl}
                alt={`Page ${page.pageNumber}`}
                className="aspect-[3/4] w-full object-cover"
              />
              <div
                className={cn(
                  'absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground bg-background text-muted-foreground',
                )}
              >
                {isSelected ? '✓' : page.pageNumber}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                <span className="text-xs font-medium text-white">
                  Page {page.pageNumber}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
