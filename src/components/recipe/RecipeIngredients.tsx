import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { convertIngredient, type UnitSystem } from '@/lib/unit-converter'
import type { Ingredient } from '@/types'

interface RecipeIngredientsProps {
  ingredients: Ingredient[]
  unitSystem?: UnitSystem
}

export function RecipeIngredients({ ingredients, unitSystem = 'metric' }: RecipeIngredientsProps) {
  const converted = useMemo(
    () => unitSystem === 'metric' ? ingredients : ingredients.map((ing) => convertIngredient(ing, unitSystem)),
    [ingredients, unitSystem]
  )

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Ingrédients</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {converted.map((ing, i) => (
            <li key={i} className="flex items-baseline gap-2">
              <span className="font-medium">
                {ing.quantity} {ing.unit}
              </span>
              <span>{ing.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
