import { Link } from 'react-router-dom'
import {
  Edit,
  Trash2,
  CheckCircle,
  PenTool,
  ImagePlus,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LikeButton } from '@/components/appreciation/LikeButton'
import { ShareButton } from '@/components/recipe/ShareButton'
import { AddToShoppingList } from '@/components/recipe/AddToShoppingList'
import { StarRating } from '@/components/recipe/StarRating'
import { HandwritingText } from '@/components/font/HandwritingText'
import type { Recipe } from '@/types'

interface RecipeDetailHeaderProps {
  recipe: Recipe
  isOwner: boolean
  avgScore: number
  ratingCount: number
  userRating: number | null
  onRate?: (score: number) => void
  isGenerating: boolean
  hasResultImage: boolean
  onGenerateImage: () => void
  onDelete: () => void
}

export function RecipeDetailHeader({
  recipe,
  isOwner,
  avgScore,
  ratingCount,
  userRating,
  onRate,
  isGenerating,
  hasResultImage,
  onGenerateImage,
  onDelete,
}: RecipeDetailHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <HandwritingText fontId={recipe.handwriting_font_id} as="h1" className="text-3xl font-bold">
          {recipe.title}
        </HandwritingText>
        {recipe.description && (
          <HandwritingText fontId={recipe.handwriting_font_id} as="p" className="mt-2 text-lg text-muted-foreground">
            {recipe.description}
          </HandwritingText>
        )}
        {recipe.handwriting_font?.author_name && (
          <Badge variant="outline" className="mt-2 flex w-fit items-center gap-1 border-primary/30 text-primary">
            <PenTool className="h-3 w-3" />
            Écriture de {recipe.handwriting_font.author_name}
          </Badge>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{recipe.category}</Badge>
          {recipe.tags?.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
          {recipe.dietary_tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="border-green-500 text-green-700">
              {tag}
            </Badge>
          ))}
          {recipe.is_tested && (
            <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-700">
              <CheckCircle className="h-3 w-3" />
              Testée
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <StarRating
            value={userRating ?? avgScore}
            onChange={onRate}
            readonly={!onRate}
            count={ratingCount}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LikeButton recipeId={recipe.id} />
        <ShareButton title={recipe.title} text={recipe.description || undefined} />
        <AddToShoppingList recipe={recipe} />
        {isOwner && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateImage}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-1 h-4 w-4" />
              )}
              {hasResultImage ? 'Regénérer la photo' : 'Générer la photo'}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/recipes/${recipe.id}/edit`}>
                <Edit className="mr-1 h-4 w-4" />
                Modifier
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="mr-1 h-4 w-4 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
