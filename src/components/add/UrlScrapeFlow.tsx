import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useScrape } from '@/hooks/useScrape'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS, type OcrResult } from '@/types'
import type { RecipeFormData } from '@/lib/validators'

interface UrlScrapeFlowProps {
  url: string
  onBack: () => void
}

export function UrlScrapeFlow({ url, onBack }: UrlScrapeFlowProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const scrape = useScrape()
  const createRecipe = useCreateRecipe()
  const [result, setResult] = useState<OcrResult | null>(null)
  const startedRef = useRef(false)

  // Auto-launch scrape on mount
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    scrape.mutateAsync(url).then(setResult).catch(() => {
      // Error shown via scrape.isError
    })
  }, [url, scrape])

  const handleSave = async () => {
    if (!result || !user) return

    try {
      const recipeData: RecipeFormData & { user_id: string } = {
        user_id: user.id,
        title: result.title,
        description: '',
        ingredients: result.ingredients,
        steps: result.steps,
        servings: result.servings ?? null,
        prep_time: result.prep_time ?? null,
        cook_time: result.cook_time ?? null,
        category: result.category || 'autre',
        author_name: result.author_name || undefined,
        author_date: undefined,
        tags: [],
        dietary_tags: [],
        handwriting_font_id: null,
      }
      const created = await createRecipe.mutateAsync(recipeData)

      if (result.image_storage_path) {
        await supabase.from('recipe_images').insert({
          recipe_id: created.id,
          storage_path: result.image_storage_path,
          type: 'result' as const,
          position: 0,
        })
      }

      navigate(`/recipes/${created.id}`)
    } catch {
      // Error handled by React Query
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <h2 className="text-2xl font-bold">Importer depuis une URL</h2>
      <p className="text-sm text-muted-foreground truncate">{url}</p>

      {scrape.isPending && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Extraction de la recette...</p>
        </div>
      )}

      {scrape.isError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">
              {scrape.error instanceof Error ? scrape.error.message : 'Erreur'}
            </p>
            <Button variant="outline" className="mt-4" onClick={onBack}>
              Reessayer avec une autre URL
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>{result.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.image_storage_path && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={
                    supabase.storage
                      .from(STORAGE_BUCKETS.photos)
                      .getPublicUrl(result.image_storage_path).data.publicUrl
                  }
                  alt={result.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            <div>
              <h3 className="mb-2 font-semibold">
                Ingredients ({result.ingredients.length})
              </h3>
              <ul className="space-y-1">
                {result.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">
                      {ing.quantity} {ing.unit}
                    </span>{' '}
                    {ing.name}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">
                Etapes ({result.steps.length})
              </h3>
              <ol className="space-y-1">
                {result.steps.map((step, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{step.number}.</span> {step.text}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {result.servings && <span>{result.servings} portions</span>}
              {result.prep_time && <span>Prep: {result.prep_time} min</span>}
              {result.cook_time && <span>Cuisson: {result.cook_time} min</span>}
              <span className="capitalize">{result.category}</span>
            </div>

            {createRecipe.isError && (
              <p className="text-sm text-destructive">
                {createRecipe.error instanceof Error
                  ? createRecipe.error.message
                  : 'Erreur lors de la sauvegarde'}
              </p>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={createRecipe.isPending}>
                {createRecipe.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Sauvegarder la recette
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
