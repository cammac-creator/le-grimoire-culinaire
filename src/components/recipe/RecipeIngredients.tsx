import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ingredient } from '@/types'

interface RecipeIngredientsProps {
  ingredients: Ingredient[]
}

export function RecipeIngredients({ ingredients }: RecipeIngredientsProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Ingrédients</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {ingredients.map((ing, i) => (
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
