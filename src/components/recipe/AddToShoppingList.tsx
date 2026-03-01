import { ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShoppingList } from '@/hooks/useShoppingList'
import { toast } from '@/hooks/useToast'
import type { Recipe } from '@/types'

interface AddToShoppingListProps {
  recipe: Recipe
}

export function AddToShoppingList({ recipe }: AddToShoppingListProps) {
  const { addRecipe, hasRecipe } = useShoppingList()
  const isAdded = hasRecipe(recipe.id)

  const handleClick = () => {
    if (isAdded) return
    addRecipe(recipe)
    toast({ title: 'Ajoute !', description: `"${recipe.title}" ajoute a la liste de courses.` })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isAdded}
      aria-label={isAdded ? 'Déjà dans la liste de courses' : 'Ajouter à la liste de courses'}
    >
      {isAdded ? (
        <>
          <Check className="mr-1 h-4 w-4 text-green-600" />
          Dans la liste
        </>
      ) : (
        <>
          <ShoppingCart className="mr-1 h-4 w-4" />
          Liste de courses
        </>
      )}
    </Button>
  )
}
