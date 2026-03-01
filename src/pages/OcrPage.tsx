import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { OcrPreview } from '@/components/upload/OcrPreview'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOcr } from '@/hooks/useOcr'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { OcrResult } from '@/types'
import type { RecipeFormData } from '@/lib/validators'

export default function OcrPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const ocr = useOcr()
  const createRecipe = useCreateRecipe()

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleUpload = (path: string, url: string) => {
    setImagePath(path)
    setImageUrl(url)
    setOcrResult(null)
    setShowForm(false)
  }

  const handleProcess = async () => {
    if (!imageUrl) return
    const result = await ocr.mutateAsync(imageUrl)
    setOcrResult(result)
  }

  const handleAcceptOcr = () => {
    setShowForm(true)
  }

  const handleSubmit = async (data: RecipeFormData) => {
    if (!user) return

    const recipe = await createRecipe.mutateAsync({
      ...data,
      user_id: user.id,
    })

    if (imagePath) {
      await supabase.from('recipe_images').insert({
        recipe_id: recipe.id,
        storage_path: imagePath,
        type: 'source',
        position: 0,
      })
    }

    navigate(`/recipes/${recipe.id}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Scanner une recette</h1>
      <p className="mb-6 text-muted-foreground">
        Photographiez une recette manuscrite ou découpée dans un magazine.
        L'IA extraira le texte automatiquement.
      </p>

      {!imageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Uploader une image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              bucket="recipe-sources"
              folder="ocr"
              onUpload={handleUpload}
            />
          </CardContent>
        </Card>
      )}

      {imageUrl && !showForm && (
        <OcrPreview
          imageUrl={imageUrl}
          ocrResult={ocrResult}
          isProcessing={ocr.isPending}
          error={ocr.error?.message ?? null}
          onProcess={handleProcess}
          onAccept={handleAcceptOcr}
        />
      )}

      {showForm && ocrResult && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Corriger et compléter la recette
          </h2>
          <RecipeForm
            defaultValues={{
              title: ocrResult.title,
              ingredients: ocrResult.ingredients,
              steps: ocrResult.steps,
              servings: ocrResult.servings,
              prep_time: ocrResult.prep_time,
              cook_time: ocrResult.cook_time,
              category: ocrResult.category,
              author_name: ocrResult.author_name ?? '',
              tags: [],
            }}
            onSubmit={handleSubmit}
            isSubmitting={createRecipe.isPending}
            submitLabel="Enregistrer la recette"
          />
        </div>
      )}
    </div>
  )
}
