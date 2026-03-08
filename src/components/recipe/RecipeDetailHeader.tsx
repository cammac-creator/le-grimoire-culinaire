import { Link } from 'react-router-dom'
import { useRef } from 'react'
import {
  Edit,
  Trash2,
  CheckCircle,
  PenTool,
  ImagePlus,
  Camera,
  Loader2,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LikeButton } from '@/components/appreciation/LikeButton'
import { ShareMenu } from '@/components/recipe/ShareMenu'
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
  isUploading: boolean
  hasResultImage: boolean
  onGenerateImage: () => void
  onUploadPhoto: (file: File) => void
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
  isUploading,
  hasResultImage,
  onGenerateImage,
  onUploadPhoto,
  onDelete,
}: RecipeDetailHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUploadPhoto(file)
    e.target.value = ''
  }
  return (
    <div className="mb-6 space-y-4">
      {/* Titre et description */}
      <div>
        <HandwritingText fontId={recipe.handwriting_font_id} as="h1" className="text-2xl sm:text-3xl font-bold">
          {recipe.title}
        </HandwritingText>
        {recipe.description && (
          <HandwritingText fontId={recipe.handwriting_font_id} as="p" className="mt-2 text-base sm:text-lg text-muted-foreground">
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

      {/* Actions — wrap proprement sur mobile */}
      <div className="flex flex-wrap items-center gap-2">
        <LikeButton recipeId={recipe.id} />
        <ShareMenu title={recipe.title} text={recipe.description || undefined} />
        <AddToShoppingList recipe={recipe} />

        {isOwner && (
          <>
            {/* Input file caché — accept image/* ouvre caméra, galerie, fichiers */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Desktop : boutons visibles */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-1 h-4 w-4" />
                )}
                Ma photo
              </Button>
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
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {/* Mobile : dropdown menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Camera className="mr-2 h-4 w-4" />
                    {isUploading ? 'Upload en cours...' : 'Ajouter ma photo'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateImage} disabled={isGenerating}>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {hasResultImage ? 'Regénérer la photo' : 'Générer la photo'}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/recipes/${recipe.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
