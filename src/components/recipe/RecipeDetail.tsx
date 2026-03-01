import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Users,
  CheckCircle,
  ArrowLeft,
  Calendar,
  User,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SEO } from '@/components/SEO'
import { CommentSection } from '@/components/appreciation/CommentSection'
import { RecipeDetailHeader } from '@/components/recipe/RecipeDetailHeader'
import { RecipeIngredients } from '@/components/recipe/RecipeIngredients'
import { RecipeSteps } from '@/components/recipe/RecipeSteps'
import { NutritionCard } from '@/components/recipe/NutritionCard'
import { AssistantWidget } from '@/components/assistant/AssistantWidget'
import { TimerWidget } from '@/components/timer/TimerWidget'
import { ServingsAdjuster } from '@/components/recipe/ServingsAdjuster'
import { CookingMode } from '@/components/recipe/CookingMode'
import { Lightbox } from '@/components/ui/Lightbox'
import { formatDuration, formatDate, getImageUrl, getMainImage } from '@/lib/utils'
import { scaleIngredients } from '@/lib/portion-scaler'
import { extractTimers } from '@/lib/time-parser'
import { useTimer } from '@/hooks/useTimer'
import { useDeleteRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import { useRecipeRating, useRateRecipe } from '@/hooks/useRatings'
import { STORAGE_BUCKETS, type Recipe } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetailView({ recipe }: RecipeDetailProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deleteRecipe = useDeleteRecipe()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [targetServings, setTargetServings] = useState(recipe.servings ?? 0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showCookingMode, setShowCookingMode] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const isOwner = user?.id === recipe.user_id

  const hasResultImage = recipe.images?.some((img) => img.type === 'result') ?? false
  const { avgScore, count, userRating } = useRecipeRating(recipe.id)
  const rateRecipe = useRateRecipe()

  const handleGenerateImage = async () => {
    setIsGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipe-image', {
        body: { title: recipe.title, category: recipe.category, ingredients: recipe.ingredients },
      })
      if (error || !data?.storage_path) throw new Error(error?.message ?? 'Pas de chemin image retourné')
      if (hasResultImage) {
        await supabase.from('recipe_images').delete().eq('recipe_id', recipe.id).eq('type', 'result')
      }
      await supabase.from('recipe_images').insert({
        recipe_id: recipe.id, storage_path: data.storage_path, type: 'result' as const, position: 0,
      })
      queryClient.invalidateQueries({ queryKey: ['recipe', recipe.id] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      toast({ title: 'Photo générée avec succès !' })
    } catch (err) {
      toast({ title: 'Erreur de génération', description: err instanceof Error ? err.message : 'Erreur inconnue', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  const { timers, addTimer, startTimer, pauseTimer, resetTimer, removeTimer } = useTimer()
  const parsedTimers = useMemo(() => extractTimers(recipe.steps ?? []), [recipe.steps])

  const handleAddTimer = useCallback((stepIndex: number) => {
    const timer = parsedTimers.find((t) => t.stepIndex === stepIndex)
    if (!timer) return
    const id = `step-${stepIndex}`
    addTimer(id, timer.label, timer.seconds)
    startTimer(id)
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
  }, [parsedTimers, addTimer, startTimer])

  const scaledIngredients = useMemo(
    () => recipe.servings ? scaleIngredients(recipe.ingredients ?? [], recipe.servings, targetServings) : recipe.ingredients ?? [],
    [recipe.ingredients, recipe.servings, targetServings]
  )

  const mainImage = getMainImage(recipe)
  const sourceImages = useMemo(() => recipe.images?.filter((img) => img.type === 'source') ?? [], [recipe.images])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <SEO
        title={recipe.title}
        description={recipe.description || `Recette : ${recipe.title}`}
        image={mainImage ? getImageUrl(mainImage.storage_path, STORAGE_BUCKETS.photos) : undefined}
        url={`${window.location.origin}/recipes/${recipe.id}`}
        type="article"
        recipe={{ title: recipe.title, description: recipe.description, ingredients: recipe.ingredients, category: recipe.category, prep_time: recipe.prep_time, cook_time: recipe.cook_time, servings: recipe.servings, author_name: recipe.author_name }}
      />

      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <RecipeDetailHeader
        recipe={recipe}
        isOwner={isOwner}
        avgScore={avgScore}
        ratingCount={count}
        userRating={userRating}
        onRate={user ? (score) => rateRecipe.mutate({ recipeId: recipe.id, score }) : undefined}
        isGenerating={isGenerating}
        hasResultImage={hasResultImage}
        onGenerateImage={handleGenerateImage}
        onDelete={() => setShowDeleteDialog(true)}
      />

      {mainImage && (
        <div className="mb-8 overflow-hidden rounded-lg cursor-pointer" onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}>
          <img src={getImageUrl(mainImage.storage_path, STORAGE_BUCKETS.photos)} alt={recipe.title} loading="lazy" decoding="async" className="w-full object-cover" />
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
                <ServingsAdjuster original={recipe.servings} value={targetServings} onChange={setTargetServings} />
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
        <RecipeIngredients ingredients={scaledIngredients} />
        <RecipeSteps steps={recipe.steps ?? []} parsedTimers={parsedTimers} onAddTimer={handleAddTimer} />
      </div>

      <NutritionCard recipeId={recipe.id} userId={recipe.user_id} nutrition={recipe.nutrition ?? null} ingredients={recipe.ingredients ?? []} servings={recipe.servings} />

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

      {sourceImages.length > 0 && (
        <Card className="mt-8">
          <CardHeader><CardTitle>Images sources (manuscrit / magazine)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {sourceImages.map((img, idx) => (
                <img
                  key={img.id}
                  src={getImageUrl(img.storage_path, STORAGE_BUCKETS.sources)}
                  alt="Source"
                  loading="lazy"
                  decoding="async"
                  className="cursor-pointer rounded-lg hover:opacity-90 transition-opacity"
                  onClick={() => { setLightboxIndex(idx + (mainImage ? 1 : 0)); setLightboxOpen(true) }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <CommentSection recipeId={recipe.id} />
      </div>

      <TimerWidget timers={timers} onStart={startTimer} onPause={pauseTimer} onReset={resetTimer} onRemove={removeTimer} />
      <AssistantWidget recipe={recipe} onPlayCooking={() => setShowCookingMode(true)} />

      <Lightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
        images={[
          ...(mainImage ? [{ src: getImageUrl(mainImage.storage_path, STORAGE_BUCKETS.photos), alt: recipe.title }] : []),
          ...sourceImages.map((img) => ({ src: getImageUrl(img.storage_path, STORAGE_BUCKETS.sources), alt: 'Source' })),
        ]}
      />

      {showCookingMode && (
        <CookingMode
          steps={recipe.steps ?? []}
          parsedTimers={parsedTimers}
          onAddTimer={handleAddTimer}
          onClose={() => setShowCookingMode(false)}
        />
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette recette ?</DialogTitle>
            <DialogDescription>Cette action est irréversible. La recette « {recipe.title} » sera définitivement supprimée.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={async () => { await deleteRecipe.mutateAsync(recipe.id); navigate('/') }} disabled={deleteRecipe.isPending}>
              {deleteRecipe.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
