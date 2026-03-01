import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useScrape } from '@/hooks/useScrape'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import type { OcrResult } from '@/types'
import type { RecipeFormData } from '@/lib/validators'

export default function ImportUrl() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const scrape = useScrape()
  const createRecipe = useCreateRecipe()
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<OcrResult | null>(null)

  const handleScrape = async () => {
    if (!url.trim()) return
    try {
      const data = await scrape.mutateAsync(url.trim())
      setResult(data)
    } catch {
      // L'erreur est deja affichee via scrape.isError
    }
  }

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
        handwriting_font_id: null,
      }
      const created = await createRecipe.mutateAsync(recipeData)
      navigate(`/recipes/${created.id}`)
    } catch {
      // Erreur geree par React Query
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Importer depuis une URL</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            URL de la recette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.marmiton.org/recettes/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            />
            <Button
              onClick={handleScrape}
              disabled={!url.trim() || scrape.isPending}
            >
              {scrape.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Importer'
              )}
            </Button>
          </div>
          {scrape.isError && (
            <p className="mt-2 text-sm text-destructive">
              {scrape.error instanceof Error ? scrape.error.message : 'Erreur'}
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>{result.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Ingredients ({result.ingredients.length})</h3>
              <ul className="space-y-1">
                {result.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{ing.quantity} {ing.unit}</span> {ing.name}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Etapes ({result.steps.length})</h3>
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
                {createRecipe.error instanceof Error ? createRecipe.error.message : 'Erreur lors de la sauvegarde'}
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
