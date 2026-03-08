import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEO } from '@/components/SEO'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { EmptyState } from '@/components/EmptyState'
import { useInfiniteMyRecipes } from '@/hooks/useInfiniteRecipes'
import { useFavorites } from '@/hooks/useLikes'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { motion, useInView } from 'framer-motion'
import { MotionDiv, fadeIn, useReducedMotion } from '@/lib/motion'
import { getImageUrl, getMainImage } from '@/lib/utils'
import { STORAGE_BUCKETS, type Recipe } from '@/types'
import type { TranslationKey } from '@/lib/i18n'
import { useRef } from 'react'

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

function formatTimeAgo(timestamp: number, t: (k: TranslationKey) => string): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return t('home.timeJustNow')
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}j`
}

interface RecentEntry {
  id: string
  title: string
  category: string
  viewedAt: number
  recipe?: Recipe
}

function RecentSection({ recentWithData, reduced }: { recentWithData: RecentEntry[]; reduced: boolean | null }) {
  const { t } = useLocale()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.section
      ref={ref}
      className="mb-6"
      initial={reduced ? undefined : { opacity: 0, y: 20 }}
      animate={reduced ? undefined : inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('home.recentlyViewed')}</h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {recentWithData.length} {recentWithData.length > 1 ? t('home.recipesPlural') : t('home.recipes')}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
        {recentWithData.map((entry, i) => {
          const img = entry.recipe ? getMainImage(entry.recipe) : undefined
          return (
            <motion.div
              key={entry.id}
              className="flex-shrink-0"
              initial={reduced ? undefined : { opacity: 0, scale: 0.92 }}
              animate={reduced ? undefined : inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Link
                to={`/recipes/${entry.id}`}
                className="group block"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="relative h-36 w-[188px] overflow-hidden rounded-2xl bg-muted shadow-sm transition-shadow duration-300 group-hover:shadow-lg sm:h-[168px] sm:w-[208px]">
                  {img ? (
                    <img
                      src={getImageUrl(img.storage_path, STORAGE_BUCKETS.photos)}
                      alt={entry.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                      {formatTimeAgo(entry.viewedAt, t)}
                    </Badge>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}

function RecipeSection({ myList, myRecipes, reduced }: {
  myList: Recipe[]
  myRecipes: ReturnType<typeof useInfiniteMyRecipes>
  reduced: boolean | null
}) {
  const { t } = useLocale()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.section
      ref={ref}
      initial={reduced ? undefined : { opacity: 0, y: 20 }}
      animate={reduced ? undefined : inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('home.allRecipes')}</h2>
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
          title={t('home.noRecipes')}
          description={t('home.noRecipesDesc')}
          action={{ label: t('home.addRecipe'), to: '/recipes/new' }}
        />
      )}
    </motion.section>
  )
}

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLocale()
  const myRecipes = useInfiniteMyRecipes(user?.id)
  const { data: favorites } = useFavorites(user?.id)
  const { recentlyViewed } = useRecentlyViewed()
  const reduced = useReducedMotion()

  const myList = myRecipes.data?.pages.flat() ?? []
  const favCount = favorites?.length ?? 0

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
          {/* Premium hero */}
          <div className="relative overflow-hidden px-5 pt-8 pb-8">
            {/* Animated glow orbs */}
            {!reduced && (
              <>
                <motion.div
                  className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-400/8 blur-3xl dark:bg-orange-400/15"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                />
                <motion.div
                  className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/5 blur-3xl dark:bg-yellow-400/10"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                />
              </>
            )}

            <div className="relative">
              {/* Title with stagger animation */}
              <div className="relative inline-block">
                <motion.h1
                  className="text-4xl font-black tracking-tight sm:text-5xl"
                  style={{
                    background: 'linear-gradient(135deg, #b45309, #d97706, #f59e0b, #d97706, #b45309)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={reduced ? undefined : { opacity: 0, y: 16, filter: 'blur(8px)' }}
                  animate={reduced ? undefined : {
                    opacity: 1, y: 0, filter: 'blur(0px)',
                    backgroundPosition: ['0% center', '200% center'],
                  }}
                  transition={{
                    opacity: { duration: 0.6 },
                    y: { duration: 0.6, ease: 'easeOut' },
                    filter: { duration: 0.6 },
                    backgroundPosition: { duration: 6, repeat: Infinity, ease: 'linear' },
                  }}
                >
                  {t('home.title').split('\n').map((line, i) => (
                    <span key={i}>{i > 0 && <br />}{line}</span>
                  ))}
                </motion.h1>
                {!reduced && (
                  <motion.div
                    className="absolute -top-2 -right-6"
                    initial={{ opacity: 0, scale: 0, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.8, type: 'spring', stiffness: 200 }}
                  >
                    <Sparkles className="h-5 w-5 text-amber-400/60" />
                  </motion.div>
                )}
              </div>

              <motion.p
                className="mt-3 max-w-[300px] text-sm leading-relaxed text-muted-foreground sm:text-base"
                initial={reduced ? undefined : { opacity: 0, y: 10 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {t('home.subtitle')}
              </motion.p>

              {myList.length > 0 && (
                <motion.div
                  className="mt-3 flex items-center gap-3"
                  initial={reduced ? undefined : { opacity: 0, x: -10 }}
                  animate={reduced ? undefined : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 dark:bg-amber-500/20">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {myList.length} {myList.length > 1 ? t('home.recipesPlural') : t('home.recipes')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 dark:bg-rose-500/20">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {favCount} {favCount > 1 ? t('home.favoritesPlural') : t('home.favorites')}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Decorative gradient divider */}
            <motion.div
              className="absolute bottom-0 inset-x-5 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
              initial={reduced ? undefined : { scaleX: 0, opacity: 0 }}
              animate={reduced ? undefined : { scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </div>

          <div className="px-4">
            {/* Recently viewed - horizontal scroll */}
            {recentWithData.length > 0 && (
              <RecentSection recentWithData={recentWithData} reduced={reduced} />
            )}

            {/* Recipe grid */}
            <RecipeSection myList={myList} myRecipes={myRecipes} reduced={reduced} />
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
                {t('landing.title')}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
                {t('landing.subtitle')}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Button size="lg" asChild>
                  <Link to="/register" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {t('landing.getStarted')}
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/login" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {t('landing.signIn')}
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
