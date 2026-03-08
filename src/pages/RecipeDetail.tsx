import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { RecipeDetailView } from '@/components/recipe/RecipeDetail'
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { useRecipe } from '@/hooks/useRecipe'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

function RecipeDetailContent() {
  const { id } = useParams<{ id: string }>()
  const { data: recipe, isLoading, error } = useRecipe(id)
  const { addEntry } = useRecentlyViewed()

  useEffect(() => {
    if (recipe) {
      addEntry({ id: recipe.id, title: recipe.title, category: recipe.category })
    }
  }, [recipe, addEntry])

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

export default function RecipeDetailPage() {
  return (
    <QueryErrorBoundary>
      <ScrollProgress />
      <RecipeDetailContent />
    </QueryErrorBoundary>
  )
}
