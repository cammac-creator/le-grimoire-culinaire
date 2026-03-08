import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useLocale } from '@/hooks/useLocale'
import type { Ingredient } from '@/types'

interface RecipeIngredientsProps {
  ingredients: Ingredient[]
}

export function RecipeIngredients({ ingredients }: RecipeIngredientsProps) {
  const { t } = useLocale()
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle>{t('recipe.ingredients')}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <ul className="divide-y divide-border">
          {ingredients.map((ing, i) => {
            const qty = [ing.quantity, ing.unit].filter(Boolean).join(' ')
            const done = checked.has(i)
            return (
              <li
                key={i}
                onClick={() => toggle(i)}
                className={cn(
                  'flex cursor-pointer items-baseline gap-3 py-2.5 transition-colors',
                  done && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 shrink-0 rounded border border-border transition-colors mt-0.5',
                    done && 'bg-primary border-primary',
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  {qty && (
                    <span className="font-semibold">{qty} </span>
                  )}
                  <span className={cn(done && 'line-through')}>{ing.name}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
