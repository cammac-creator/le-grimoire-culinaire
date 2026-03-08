import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Clock, Users, X } from 'lucide-react'
import { useInfiniteSearch } from '@/hooks/useInfiniteRecipes'
import { isSearchActive } from '@/hooks/useSearch'
import { useAuth } from '@/hooks/useAuth'
import { formatDuration, getImageUrl, getMainImage } from '@/lib/utils'
import { STORAGE_BUCKETS, type SearchFilters, type RecipeCategory } from '@/types'
import { useLocale } from '@/hooks/useLocale'
import { CategoryPills } from './CategoryPills'

interface MobileSearchOverlayProps {
  open: boolean
  onClose: () => void
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function MobileSearchOverlay({ open, onClose }: MobileSearchOverlayProps) {
  const { user } = useAuth()
  const { t } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<RecipeCategory | ''>('')

  const filters: SearchFilters = {
    query,
    category,
    tags: [],
    dietary_tags: [],
    is_tested: null,
    favorites_only: false,
  }

  const debouncedFilters = useDebouncedValue(filters, 300)
  const hasActive = isSearchActive(debouncedFilters)
  const { data, isLoading } = useInfiniteSearch(debouncedFilters, user?.id, hasActive)
  const results = data?.pages.flat() ?? []

  useEffect(() => {
    if (open) {
      setQuery('')
      setCategory('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Search header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 safe-area-top">
        <button
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted"
          aria-label={t('search.close')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-10 pr-10 text-[15px] outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-border px-4 py-3">
        <CategoryPills selected={category} onSelect={setCategory} />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!query && !category ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t('search.hint')}
          </p>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex animate-pulse gap-3">
                <div className="h-16 w-16 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 && hasActive ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t('search.noResults')} &laquo;{query}&raquo;
          </p>
        ) : (
          <div className="space-y-1">
            {results.map((recipe) => {
              const img = getMainImage(recipe)
              const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
              return (
                <Link
                  key={recipe.id}
                  to={`/recipes/${recipe.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors active:bg-muted"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {img ? (
                      <img
                        src={getImageUrl(img.storage_path, STORAGE_BUCKETS.photos)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{recipe.title}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{recipe.category}</span>
                      {totalTime > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDuration(totalTime)}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {recipe.servings}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
