import { Link, useNavigate } from 'react-router-dom'
import {
  Clock,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Calendar,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LikeButton } from '@/components/appreciation/LikeButton'
import { CommentSection } from '@/components/appreciation/CommentSection'
import { formatDuration, getImageUrl } from '@/lib/utils'
import { useDeleteRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import type { Recipe } from '@/types'

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetailView({ recipe }: RecipeDetailProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const deleteRecipe = useDeleteRecipe()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isOwner = user?.id === recipe.user_id

  const sourceImage = recipe.images?.find((img) => img.type === 'result') ??
    recipe.images?.find((img) => img.type === 'source')

  const handleDelete = async () => {
    await deleteRecipe.mutateAsync(recipe.id)
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back button */}
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
          {recipe.description && (
            <p className="mt-2 text-lg text-muted-foreground">{recipe.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{recipe.category}</Badge>
            {recipe.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
            {recipe.is_tested && (
              <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-700">
                <CheckCircle className="h-3 w-3" />
                Testée
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LikeButton recipeId={recipe.id} />
          {isOwner && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/recipes/${recipe.id}/edit`}>
                  <Edit className="mr-1 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-1 h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Image */}
      {sourceImage && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={getImageUrl(sourceImage.storage_path, 'recipe-photos')}
            alt={recipe.title}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Infos */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {recipe.prep_time && (
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Préparation</div>
                <div className="font-medium">{formatDuration(recipe.prep_time)}</div>
              </div>
            </CardContent>
          </Card>
        )}
        {recipe.cook_time && (
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <div className="text-sm text-muted-foreground">Cuisson</div>
                <div className="font-medium">{formatDuration(recipe.cook_time)}</div>
              </div>
            </CardContent>
          </Card>
        )}
        {recipe.servings && (
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Portions</div>
                <div className="font-medium">{recipe.servings} personnes</div>
              </div>
            </CardContent>
          </Card>
        )}
        {recipe.author_name && (
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <User className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Auteur</div>
                <div className="font-medium">{recipe.author_name}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Ingrédients */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ingrédients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="font-medium">
                    {ing.quantity} {ing.unit}
                  </span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Étapes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Préparation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recipe.steps?.map((step, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  <p className="pt-1">{step.text}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Notes de test */}
      {recipe.is_tested && recipe.tested_notes && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Notes après test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{recipe.tested_notes}</p>
            {recipe.tested_at && (
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Testée le {new Date(recipe.tested_at).toLocaleDateString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Source images */}
      {recipe.images && recipe.images.filter((img) => img.type === 'source').length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Images sources (manuscrit / magazine)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {recipe.images
                .filter((img) => img.type === 'source')
                .map((img) => (
                  <img
                    key={img.id}
                    src={getImageUrl(img.storage_path, 'recipe-sources')}
                    alt="Source"
                    className="rounded-lg"
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commentaires */}
      <div className="mt-8">
        <CommentSection recipeId={recipe.id} />
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette recette ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La recette « {recipe.title} » sera
              définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRecipe.isPending}
            >
              {deleteRecipe.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
