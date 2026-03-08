import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { EmptyState } from '@/components/EmptyState'
import { useInfiniteFavorites } from '@/hooks/useInfiniteRecipes'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

export default function Favorites() {
  const { t } = useLocale()
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
        <EmptyState
          icon="favorites"
          title={t('fav.noFavorites')}
          description={t('fav.noFavoritesDesc')}
        />
      )}
    </div>
  )
}
