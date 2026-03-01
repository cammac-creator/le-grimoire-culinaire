import { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { RecipeCard } from './RecipeCard'
import { MotionDiv, staggerContainer, staggerItem, useReducedMotion } from '@/lib/motion'
import type { Recipe } from '@/types'

interface RecipeGridProps {
  recipes: Recipe[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
}

export function RecipeGrid({
  recipes,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: RecipeGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const grid = gridRef.current
    if (!grid) return

    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[role="gridcell"]'))
    const currentIndex = cards.findIndex((c) => c === document.activeElement || c.contains(document.activeElement))
    if (currentIndex === -1) return

    const cols = Math.round(grid.offsetWidth / cards[0].offsetWidth)
    let nextIndex = -1

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = Math.min(currentIndex + 1, cards.length - 1)
        break
      case 'ArrowLeft':
        nextIndex = Math.max(currentIndex - 1, 0)
        break
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + cols, cards.length - 1)
        break
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - cols, 0)
        break
      case 'Enter': {
        const link = cards[currentIndex].querySelector('a')
        if (link) link.click()
        return
      }
      default:
        return
    }

    if (nextIndex !== -1 && nextIndex !== currentIndex) {
      e.preventDefault()
      cards[nextIndex].focus()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <>
      <MotionDiv
        ref={gridRef}
        role="grid"
        aria-label="Grille de recettes"
        onKeyDown={handleGridKeyDown}
        className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'visible'}
      >
        {recipes.map((recipe) => (
          <MotionDiv
            key={recipe.id}
            role="gridcell"
            tabIndex={0}
            variants={reduced ? undefined : staggerItem}
          >
            <RecipeCard recipe={recipe} />
          </MotionDiv>
        ))}
      </MotionDiv>
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}
      </div>
    </>
  )
}
