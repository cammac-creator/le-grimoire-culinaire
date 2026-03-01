import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { RecipeDetailView } from '@/components/recipe/RecipeDetail'
import { useRecipe } from '@/hooks/useRecipe'

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: recipe, isLoading, error } = useRecipe(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Recette introuvable.</p>
      </div>
    )
  }

  return <RecipeDetailView recipe={recipe} />
}
