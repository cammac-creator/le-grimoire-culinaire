import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (score: number) => void
  readonly?: boolean
  count?: number
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, readonly = false, count, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const displayValue = hovered || value
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(displayValue)
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => !readonly && setHovered(star)}
              onMouseLeave={() => !readonly && setHovered(0)}
              className={cn(
                'transition-colors',
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              )}
              aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  starSize,
                  filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                )}
              />
            </button>
          )
        })}
      </div>
      {count !== undefined && (
        <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          ({count})
        </span>
      )}
    </div>
  )
}
