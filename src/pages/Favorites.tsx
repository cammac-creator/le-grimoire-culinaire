import { Loader2, Heart } from 'lucide-react'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { useFavorites } from '@/hooks/useLikes'
import { useAuth } from '@/hooks/useAuth'
import type { Recipe } from '@/types'

export default function Favorites() {
  const { user } = useAuth()
  const { data: recipes, isLoading } = useFavorites(user?.id)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Mes favoris</h1>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : recipes && recipes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(recipes as unknown as Recipe[]).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Aucun favori</h3>
          <p className="mt-2 text-muted-foreground">
            Ajoutez des recettes en favoris en cliquant sur le coeur.
          </p>
        </div>
      )}
    </div>
  )
}
