import { cn } from '@/lib/utils'
import { useLocale } from '@/hooks/useLocale'
import type { RecipeCategory } from '@/types'
import type { TranslationKey } from '@/lib/i18n'

const categories: { value: RecipeCategory; key: TranslationKey; emoji: string }[] = [
  { value: 'entree', key: 'cat.entree', emoji: '🥗' },
  { value: 'plat', key: 'cat.plat', emoji: '🍲' },
  { value: 'dessert', key: 'cat.dessert', emoji: '🍰' },
  { value: 'boisson', key: 'cat.boisson', emoji: '🥤' },
  { value: 'sauce', key: 'cat.sauce', emoji: '🫙' },
  { value: 'accompagnement', key: 'cat.accompagnement', emoji: '🥦' },
  { value: 'pain', key: 'cat.pain', emoji: '🍞' },
  { value: 'autre', key: 'cat.autre', emoji: '🍽️' },
]

interface CategoryPillsProps {
  selected: RecipeCategory | ''
  onSelect: (category: RecipeCategory | '') => void
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  const { t } = useLocale()

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
            <span className="text-[11px] font-semibold">{t(cat.key)}</span>
          </button>
        )
      })}
    </div>
  )
}
