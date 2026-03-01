import { Link } from 'react-router-dom'
import { Clock, Users, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDuration, getImageUrl, getMainImage } from '@/lib/utils'
import { STORAGE_BUCKETS, type Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const sourceImage = getMainImage(recipe)

  return (
    <Link to={`/recipes/${recipe.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {sourceImage ? (
            <img
              src={getImageUrl(sourceImage.storage_path, STORAGE_BUCKETS.photos)}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
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

        <CardContent className="p-4">
          <h3 className="line-clamp-1 text-lg font-semibold group-hover:text-primary">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {recipe.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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

          <div className="mt-3 flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {recipe.category}
            </Badge>
            {recipe.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
