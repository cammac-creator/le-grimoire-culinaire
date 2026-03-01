import { useEffect, useState } from 'react'
import { SearchX } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { Filters } from '@/components/search/Filters'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { useInfiniteSearch } from '@/hooks/useInfiniteRecipes'
import { isSearchActive } from '@/hooks/useSearch'
import { useAuth } from '@/hooks/useAuth'
import type { SearchFilters } from '@/types'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function SearchPage() {
  const { user, isAuthenticated } = useAuth()
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    tags: [],
    is_tested: null,
    favorites_only: false,
  })

  const debouncedFilters = useDebouncedValue(filters, 300)
  const hasActiveSearch = isSearchActive(filters)
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteSearch(debouncedFilters, user?.id, hasActiveSearch)
  const recipes = data?.pages.flat() ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Rechercher</h1>

      <div className="mb-6 space-y-4">
        <SearchBar
          value={filters.query}
          onChange={(query) => setFilters((f) => ({ ...f, query }))}
        />
        <Filters
          category={filters.category}
          onCategoryChange={(category) => setFilters((f) => ({ ...f, category }))}
          isTested={filters.is_tested}
          onIsTestedChange={(is_tested) => setFilters((f) => ({ ...f, is_tested }))}
          favoritesOnly={filters.favorites_only}
          onFavoritesOnlyChange={(favorites_only) =>
            setFilters((f) => ({ ...f, favorites_only }))
          }
          isAuthenticated={isAuthenticated}
        />
      </div>

      {!hasActiveSearch ? (
        <p className="py-12 text-center text-muted-foreground">
          Tapez un mot-cle ou utilisez les filtres pour rechercher des recettes.
        </p>
      ) : recipes.length > 0 || isLoading ? (
        <>
          {recipes.length > 0 && (
            <p className="mb-4 text-sm text-muted-foreground">
              {recipes.length} resultat{recipes.length > 1 ? 's' : ''}
            </p>
          )}
          <RecipeGrid
            recipes={recipes}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage ?? false}
            fetchNextPage={fetchNextPage}
          />
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Aucun resultat</h3>
          <p className="mt-2 text-muted-foreground">
            Essayez avec d'autres mots-cles ou filtres.
          </p>
        </div>
      )}
    </div>
  )
}
