import { Heart } from 'lucide-react'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { useInfiniteFavorites } from '@/hooks/useInfiniteRecipes'
import { useAuth } from '@/hooks/useAuth'

export default function Favorites() {
  const { user } = useAuth()
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteFavorites(user?.id)
  const recipes = data?.pages.flat() ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Mes favoris</h1>

      {recipes.length > 0 || isLoading ? (
        <RecipeGrid
          recipes={recipes}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage ?? false}
          fetchNextPage={fetchNextPage}
        />
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
