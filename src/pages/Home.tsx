import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpen, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEO } from '@/components/SEO'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { EmptyState } from '@/components/EmptyState'
import { useInfiniteMyRecipes } from '@/hooks/useInfiniteRecipes'
import { useFavorites } from '@/hooks/useLikes'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useAuth } from '@/hooks/useAuth'
import { MotionDiv, slideUp, useReducedMotion } from '@/lib/motion'
import { getImageUrl, getMainImage } from '@/lib/utils'
import { STORAGE_BUCKETS } from '@/types'

const CATEGORY_EMOJIS: Record<string, string> = {
  entree: '🥗',
  plat: '🍲',
  dessert: '🍰',
  boisson: '🥤',
  sauce: '🫙',
  accompagnement: '🥦',
  pain: '🍞',
  autre: '🍽️',
}

const CATEGORY_LABELS: Record<string, string> = {
  entree: 'Entrées',
  plat: 'Plats',
  dessert: 'Desserts',
  boisson: 'Boissons',
  sauce: 'Sauces',
  accompagnement: 'Accomp.',
  pain: 'Pains',
  autre: 'Autre',
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "A l'instant"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}j`
}

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const myRecipes = useInfiniteMyRecipes(user?.id)
  const { data: favorites } = useFavorites(user?.id)
  const { recentlyViewed } = useRecentlyViewed()
  const reduced = useReducedMotion()

  const myList = myRecipes.data?.pages.flat() ?? []
  const favCount = favorites?.length ?? 0

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of myList) {
      counts[r.category] = (counts[r.category] ?? 0) + 1
    }
    return counts
  }, [myList])

  const activeCategories = useMemo(() => {
    return Object.entries(CATEGORY_EMOJIS)
      .map(([key, emoji]) => ({
        key,
        emoji,
        label: CATEGORY_LABELS[key],
        count: categoryCounts[key] ?? 0,
      }))
      .filter((c) => c.count > 0)
  }, [categoryCounts])

  // Build recently viewed with recipe data for images
  const recentWithData = useMemo(() => {
    const recipeMap = new Map(myList.map((r) => [r.id, r]))
    return recentlyViewed
      .slice(0, 8)
      .map((entry) => ({
        ...entry,
        recipe: recipeMap.get(entry.id),
      }))
  }, [recentlyViewed, myList])

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 md:pb-6">
      <SEO description="Numérisez vos recettes manuscrites, organisez votre collection et composez votre propre livre de cuisine." />

      {/* Hero - V2 gradient style */}
      <MotionDiv
        variants={reduced ? undefined : slideUp}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'visible'}
        className="pt-6 pb-4 text-center sm:pt-8 sm:pb-6"
      >
        <h1 className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl dark:from-amber-400 dark:via-yellow-300 dark:to-amber-400">
          Le Grimoire Culinaire
        </h1>
        {isAuthenticated && myList.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {myList.length} recette{myList.length > 1 ? 's' : ''} · {favCount} favori{favCount > 1 ? 's' : ''}
          </p>
        )}
        {!isAuthenticated && (
          <>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Numérisez vos recettes manuscrites, organisez votre collection
              et composez votre propre livre de cuisine.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <Button asChild>
                <Link to="/register" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Commencer
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Explorer
                </Link>
              </Button>
            </div>
          </>
        )}
      </MotionDiv>

      {isAuthenticated && (
        <>
          {/* Recently viewed - V1 horizontal scroll */}
          {recentWithData.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">Consultées récemment</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                {recentWithData.map((entry) => {
                  const img = entry.recipe ? getMainImage(entry.recipe) : undefined
                  return (
                    <Link
                      key={entry.id}
                      to={`/recipes/${entry.id}`}
                      className="group flex-shrink-0"
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className="relative h-28 w-36 overflow-hidden rounded-xl bg-muted sm:h-32 sm:w-40">
                        {img ? (
                          <img
                            src={getImageUrl(img.storage_path, STORAGE_BUCKETS.photos)}
                            alt={entry.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-3xl">
                            {CATEGORY_EMOJIS[entry.category] ?? '🍽️'}
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                          <p className="line-clamp-1 text-xs font-medium text-white">{entry.title}</p>
                        </div>
                        <div className="absolute top-1.5 right-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            <Clock className="mr-0.5 h-2.5 w-2.5" />
                            {formatTimeAgo(entry.viewedAt)}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Categories grid - V3 style */}
          {activeCategories.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-semibold">Catégories</h2>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {activeCategories.map((cat) => (
                  <Link
                    key={cat.key}
                    to={`/search?category=${cat.key}`}
                    className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary hover:bg-muted"
                  >
                    <span className="text-2xl sm:text-3xl">{cat.emoji}</span>
                    <span className="text-xs font-medium sm:text-sm">{cat.label}</span>
                    <span className="text-[10px] text-muted-foreground">{cat.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recipe grid - V3 style */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Toutes mes recettes</h2>
            {myList.length > 0 || myRecipes.isLoading ? (
              <RecipeGrid
                recipes={myList}
                isLoading={myRecipes.isLoading}
                isFetchingNextPage={myRecipes.isFetchingNextPage}
                hasNextPage={myRecipes.hasNextPage ?? false}
                fetchNextPage={myRecipes.fetchNextPage}
              />
            ) : (
              <EmptyState
                icon="recipes"
                title="Vous n'avez pas encore de recettes"
                description="Ajoutez votre premiere recette pour commencer votre grimoire !"
                action={{ label: 'Ajouter une recette', to: '/recipes/new' }}
              />
            )}
          </section>
        </>
      )}

      {!isAuthenticated && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Connectez-vous pour accéder à vos recettes.
          </p>
        </div>
      )}
    </div>
  )
}
