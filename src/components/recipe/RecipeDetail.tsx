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
  PenTool,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
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
import { HandwritingText } from '@/components/font/HandwritingText'
import { formatDuration, formatDate, getImageUrl, getMainImage } from '@/lib/utils'
import { scaleIngredients } from '@/lib/portion-scaler'
import { extractTimers } from '@/lib/time-parser'
import { ServingsAdjuster } from '@/components/recipe/ServingsAdjuster'
import { StepTimer } from '@/components/timer/StepTimer'
import { TimerWidget } from '@/components/timer/TimerWidget'
import { useTimer } from '@/hooks/useTimer'
import { AddToShoppingList } from '@/components/recipe/AddToShoppingList'
import { STORAGE_BUCKETS, type Recipe } from '@/types'
import { useDeleteRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetailView({ recipe }: RecipeDetailProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const deleteRecipe = useDeleteRecipe()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [targetServings, setTargetServings] = useState(recipe.servings ?? 0)
  const isOwner = user?.id === recipe.user_id

  const { timers, addTimer, startTimer, pauseTimer, resetTimer, removeTimer } = useTimer()

  const parsedTimers = useMemo(
    () => extractTimers(recipe.steps ?? []),
    [recipe.steps]
  )

  const handleAddTimer = useCallback((stepIndex: number) => {
    const timer = parsedTimers.find((t) => t.stepIndex === stepIndex)
    if (!timer) return
    const id = `step-${stepIndex}`
    addTimer(id, timer.label, timer.seconds)
    startTimer(id)
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [parsedTimers, addTimer, startTimer])

  const scaledIngredients = useMemo(
    () => recipe.servings
      ? scaleIngredients(recipe.ingredients ?? [], recipe.servings, targetServings)
      : recipe.ingredients ?? [],
    [recipe.ingredients, recipe.servings, targetServings]
  )

  const mainImage = getMainImage(recipe)
  const sourceImages = useMemo(
    () => recipe.images?.filter((img) => img.type === 'source') ?? [],
    [recipe.images]
  )

  const handleDelete = async () => {
    await deleteRecipe.mutateAsync(recipe.id)
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      {/* Header */}
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
          <AddToShoppingList recipe={recipe} />
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
      {mainImage && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={getImageUrl(mainImage.storage_path, STORAGE_BUCKETS.photos)}
            alt={recipe.title}
            loading="lazy"
            decoding="async"
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
                <ServingsAdjuster
                  original={recipe.servings}
                  value={targetServings}
                  onChange={setTargetServings}
                />
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
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ingrédients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {scaledIngredients.map((ing, i) => (
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Préparation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recipe.steps?.map((step, i) => {
              const timer = parsedTimers.find((t) => t.stepIndex === i)
              return (
                <div key={i}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {step.number}
                    </div>
                    <p className="pt-1">
                      {step.text}
                      {timer && (
                        <StepTimer
                          minutes={Math.round(timer.seconds / 60)}
                          onClick={() => handleAddTimer(i)}
                        />
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
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
                Testée le {formatDate(recipe.tested_at)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Source images */}
      {sourceImages.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Images sources (manuscrit / magazine)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {sourceImages.map((img) => (
                <img
                  key={img.id}
                  src={getImageUrl(img.storage_path, STORAGE_BUCKETS.sources)}
                  alt="Source"
                  loading="lazy"
                  decoding="async"
                  className="rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <CommentSection recipeId={recipe.id} />
      </div>

      <TimerWidget
        timers={timers}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
        onRemove={removeTimer}
      />

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
