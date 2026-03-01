import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MealPlan } from '@/types'

interface MealSlotProps {
  plan?: MealPlan
  onAdd: () => void
  onRemove?: (id: string) => void
}

export function MealSlot({ plan, onAdd, onRemove }: MealSlotProps) {
  if (!plan) {
    return (
      <button
        onClick={onAdd}
        className="flex h-full min-h-[3rem] w-full items-center justify-center rounded border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div className="group relative rounded bg-primary/10 p-1.5 text-xs">
      <span className="line-clamp-2 font-medium">{plan.recipe?.title ?? 'Recette'}</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-1 -top-1 hidden h-5 w-5 rounded-full bg-destructive text-white group-hover:flex"
          onClick={() => onRemove(plan.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
