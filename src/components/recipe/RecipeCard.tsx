import { memo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, CheckCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDuration, getImageUrl, getMainImage } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { RECIPE_SELECT } from '@/lib/queries'
import { STORAGE_BUCKETS, type Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

export const RecipeCard = memo(function RecipeCard({ recipe }: RecipeCardProps) {
  const queryClient = useQueryClient()
  const sourceImage = getMainImage(recipe)

  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['recipe', recipe.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select(RECIPE_SELECT)
          .eq('id', recipe.id)
          .single()
        if (error) throw error
        return data as Recipe
      },
      staleTime: 30_000,
    })
  }, [queryClient, recipe.id])

  return (
    <Link to={`/recipes/${recipe.id}`} onMouseEnter={prefetch} onTouchStart={prefetch}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {sourceImage ? (
            <img
              src={getImageUrl(sourceImage.storage_path, STORAGE_BUCKETS.photos)}
              alt={`Photo de ${recipe.title}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.innerHTML = '<div class="flex h-full items-center justify-center text-4xl text-muted-foreground">🍽️</div>'
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
              🍽️
            </div>
          )}
          {recipe.is_tested && (
            <div className="absolute right-2 top-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Testée
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3 sm:p-4">
          <h3 className="line-clamp-1 text-base sm:text-lg font-semibold group-hover:text-primary">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {recipe.description}
            </p>
          )}

          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
            {(recipe.prep_time || recipe.cook_time) && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration((recipe.prep_time ?? 0) + (recipe.cook_time ?? 0))}
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings} pers.
              </span>
            )}
          </div>

          <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {recipe.category}
            </Badge>
            {recipe.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {recipe.dietary_tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-green-500 text-green-700">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})
