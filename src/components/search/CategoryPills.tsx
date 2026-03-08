import { cn } from '@/lib/utils'
import type { RecipeCategory } from '@/types'

const categories: { value: RecipeCategory; label: string; emoji: string }[] = [
  { value: 'entree', label: 'Entrées', emoji: '🥗' },
  { value: 'plat', label: 'Plats', emoji: '🍲' },
  { value: 'dessert', label: 'Desserts', emoji: '🍰' },
  { value: 'boisson', label: 'Boissons', emoji: '🥤' },
  { value: 'sauce', label: 'Sauces', emoji: '🫙' },
  { value: 'accompagnement', label: 'Accomp.', emoji: '🥦' },
  { value: 'pain', label: 'Pains', emoji: '🍞' },
  { value: 'autre', label: 'Autre', emoji: '🍽️' },
]

interface CategoryPillsProps {
  selected: RecipeCategory | ''
  onSelect: (category: RecipeCategory | '') => void
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const isActive = selected === cat.value
        return (
          <button
            key={cat.value}
            onClick={() => onSelect(isActive ? '' : cat.value)}
            className={cn(
              'flex flex-shrink-0 flex-col items-center gap-1 rounded-2xl border px-4 py-2.5 transition-all active:scale-95',
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:border-primary hover:bg-muted',
            )}
          >
            <span className="text-xl">{cat.emoji}</span>
            <span className="text-[11px] font-semibold">{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
