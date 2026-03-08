import { ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShoppingList } from '@/hooks/useShoppingList'
import { toast } from '@/hooks/useToast'
import { useLocale } from '@/hooks/useLocale'
import type { Recipe } from '@/types'

interface AddToShoppingListProps {
  recipe: Recipe
}

export function AddToShoppingList({ recipe }: AddToShoppingListProps) {
  const { addRecipe, hasRecipe } = useShoppingList()
  const { t } = useLocale()
  const isAdded = hasRecipe(recipe.id)

  const handleClick = () => {
    if (isAdded) return
    addRecipe(recipe)
    toast({ title: t('recipe.addedToList'), description: `"${recipe.title}"` })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isAdded}
      aria-label={isAdded ? t('recipe.inList') : t('recipe.addToList')}
    >
      {isAdded ? (
        <>
          <Check className="mr-1 h-4 w-4 text-green-600" />
          {t('recipe.inList')}
        </>
      ) : (
        <>
          <ShoppingCart className="mr-1 h-4 w-4" />
          {t('recipe.addToList')}
        </>
      )}
    </Button>
  )
}
