import { Heart } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useLikes } from '@/hooks/useLikes'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  recipeId: string
}

export function LikeButton({ recipeId }: LikeButtonProps) {
  const { user } = useAuth()
  const { count, hasLiked, toggleLike, isToggling } = useLikes(recipeId, user?.id)
  const { t } = useLocale()
  const reduced = useReducedMotion()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleLike(hasLiked)
      }}
      disabled={!user || isToggling}
      className="flex items-center gap-1"
      aria-label={hasLiked ? `${t('fav.removeFromFav')} (${count})` : `${t('fav.addToFav')} (${count})`}
    >
      <motion.div
        whileTap={reduced ? undefined : { scale: 1.3 }}
        animate={
          reduced
            ? undefined
            : hasLiked
              ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] }
              : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors',
            hasLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
          )}
        />
      </motion.div>
      <span className="text-sm">{count}</span>
    </Button>
  )
}
