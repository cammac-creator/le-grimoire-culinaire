import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchBar } from '@/components/search/SearchBar'
import { Filters } from '@/components/search/Filters'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { EmptyState } from '@/components/EmptyState'
import { useInfiniteSearch } from '@/hooks/useInfiniteRecipes'
import { isSearchActive } from '@/hooks/useSearch'
import { useAuth } from '@/hooks/useAuth'
import { RECIPE_CATEGORY_VALUES, type SearchFilters, type RecipeCategory } from '@/types'

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
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const cat = searchParams.get('category') ?? ''
    const validCategory = (RECIPE_CATEGORY_VALUES as readonly string[]).includes(cat) ? (cat as RecipeCategory) : '' as const
    return {
      query: '',
      category: validCategory,
      tags: [],
      dietary_tags: [],
      is_tested: null,
      favorites_only: false,
    }
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
          autoFocus
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
          dietaryTags={filters.dietary_tags}
          onDietaryTagsChange={(dietary_tags) => setFilters((f) => ({ ...f, dietary_tags }))}
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
        <EmptyState
          icon="search"
          title="Aucun resultat"
          description="Essayez avec d'autres mots-cles ou filtres."
        />
      )}
    </div>
  )
}
