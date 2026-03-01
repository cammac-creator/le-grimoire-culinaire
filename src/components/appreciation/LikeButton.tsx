import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLikes } from '@/hooks/useLikes'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  recipeId: string
}

export function LikeButton({ recipeId }: LikeButtonProps) {
  const { user } = useAuth()
  const { count, hasLiked, toggleLike, isToggling } = useLikes(recipeId, user?.id)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleLike()
      }}
      disabled={!user || isToggling}
      className="flex items-center gap-1"
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-colors',
          hasLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
        )}
      />
      <span className="text-sm">{count}</span>
    </Button>
  )
}
