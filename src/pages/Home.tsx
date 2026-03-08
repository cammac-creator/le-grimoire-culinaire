import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SEO } from '@/components/SEO'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { EmptyState } from '@/components/EmptyState'
import { useInfiniteMyRecipes } from '@/hooks/useInfiniteRecipes'
import { useFavorites } from '@/hooks/useLikes'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useAuth } from '@/hooks/useAuth'
import { MotionDiv, fadeIn, slideUp, useReducedMotion } from '@/lib/motion'
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
  const { user, profile, isAuthenticated } = useAuth()
  const myRecipes = useInfiniteMyRecipes(user?.id)
  const { data: favorites } = useFavorites(user?.id)
  const { recentlyViewed } = useRecentlyViewed()
  const reduced = useReducedMotion()

  const myList = myRecipes.data?.pages.flat() ?? []
  const favCount = favorites?.length ?? 0
  const initial = (profile?.username ?? user?.email ?? '?').charAt(0).toUpperCase()

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
    <div className="mx-auto max-w-7xl pb-24 md:pb-6">
      <SEO description="Numérisez vos recettes manuscrites, organisez votre collection et composez votre propre livre de cuisine." />

      {isAuthenticated ? (
        <>
          {/* Premium hero with fade gradient */}
          <MotionDiv
            variants={reduced ? undefined : fadeIn}
            initial={reduced ? undefined : 'hidden'}
            animate={reduced ? undefined : 'visible'}
            className="relative overflow-hidden"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/4 to-transparent dark:from-primary/15 dark:via-primary/5" />
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
            <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-400/5 blur-3xl dark:bg-amber-400/10" />

            <div className="relative px-5 pt-6 pb-6">
              {/* Hero title with avatar */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl dark:from-amber-400 dark:via-yellow-300 dark:to-amber-400">
                    Le Grimoire Culinaire
                  </h1>
                  <p className="mt-1.5 max-w-[260px] text-[13px] leading-snug text-muted-foreground">
                    Vos recettes numérisées, organisées et toujours à portée de main.
                  </p>
                </div>
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Stats */}
              {myList.length > 0 && (
                <MotionDiv
                  variants={reduced ? undefined : slideUp}
                  initial={reduced ? undefined : 'hidden'}
                  animate={reduced ? undefined : 'visible'}
                  className="mt-4 flex gap-3"
                >
                  <div className="flex-1 rounded-2xl border border-border bg-card/80 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-bold text-primary">{myList.length}</p>
                    <p className="text-xs text-muted-foreground">recette{myList.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-border bg-card/80 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-bold text-primary">{favCount}</p>
                    <p className="text-xs text-muted-foreground">favori{favCount > 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-border bg-card/80 px-4 py-3 backdrop-blur">
                    <p className="text-2xl font-bold text-primary">{activeCategories.length}</p>
                    <p className="text-xs text-muted-foreground">catégorie{activeCategories.length > 1 ? 's' : ''}</p>
                  </div>
                </MotionDiv>
              )}
            </div>
          </MotionDiv>

          <div className="px-4">
            {/* Recently viewed - horizontal scroll */}
            {recentWithData.length > 0 && (
              <section className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Consultées récemment</h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {recentWithData.length} recette{recentWithData.length > 1 ? 's' : ''}
                  </span>
                </div>
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
                        <div className="relative h-36 w-[188px] overflow-hidden rounded-2xl bg-muted sm:h-[168px] sm:w-[208px]">
                          {img ? (
                            <img
                              src={getImageUrl(img.storage_path, STORAGE_BUCKETS.photos)}
                              alt={entry.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-3xl">
                              {CATEGORY_EMOJIS[entry.category] ?? '🍽️'}
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8">
                            <p className="line-clamp-1 text-xs font-semibold text-white">{entry.title}</p>
                          </div>
                          <div className="absolute top-2 right-2">
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

            {/* Categories - horizontal scroll pills (V3 style) */}
            {activeCategories.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-3 text-lg font-bold">Catégories</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {activeCategories.map((cat) => (
                    <Link
                      key={cat.key}
                      to={`/search?category=${cat.key}`}
                      className="flex flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-5 py-3.5 transition-all hover:border-primary hover:bg-muted active:scale-95"
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-[11px] font-semibold">{cat.label}</span>
                      <span className="text-[10px] text-muted-foreground">{cat.count}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recipe grid */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Toutes mes recettes</h2>
                {myList.length > 0 && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {myList.length}
                  </span>
                )}
              </div>
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
          </div>
        </>
      ) : (
        /* Landing for non-authenticated users */
        <div className="px-4">
          <MotionDiv
            variants={reduced ? undefined : fadeIn}
            initial={reduced ? undefined : 'hidden'}
            animate={reduced ? undefined : 'visible'}
            className="relative overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-amber-500/5 to-transparent" />
            <div className="relative px-6 py-16 text-center sm:py-20">
              <h1 className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl dark:from-amber-400 dark:via-yellow-300 dark:to-amber-400">
                Le Grimoire Culinaire
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
                Numérisez vos recettes manuscrites, organisez votre collection
                et composez votre propre livre de cuisine.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Button size="lg" asChild>
                  <Link to="/register" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Commencer
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/search" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Explorer
                  </Link>
                </Button>
              </div>
            </div>
          </MotionDiv>
        </div>
      )}
    </div>
  )
}
