import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { RecipeFormData } from '@/lib/validators'

export default function RecipeCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createRecipe = useCreateRecipe()
  const [sourceImagePath, setSourceImagePath] = useState<string | null>(null)
  const [resultImagePath, setResultImagePath] = useState<string | null>(null)

  const onSubmit = async (data: RecipeFormData) => {
    if (!user) return

    const recipe = await createRecipe.mutateAsync({
      ...data,
      user_id: user.id,
    })

    // Save images
    const images = []
    if (sourceImagePath) {
      images.push({
        recipe_id: recipe.id,
        storage_path: sourceImagePath,
        type: 'source',
        position: 0,
      })
    }
    if (resultImagePath) {
      images.push({
        recipe_id: recipe.id,
        storage_path: resultImagePath,
        type: 'result',
        position: 0,
      })
    }

    if (images.length > 0) {
      await supabase.from('recipe_images').insert(images)
    }

    navigate(`/recipes/${recipe.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Nouvelle recette</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Image source (manuscrit)</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              bucket="recipe-sources"
              folder="sources"
              onUpload={(path) => setSourceImagePath(path)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photo du plat</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              bucket="recipe-photos"
              folder="results"
              onUpload={(path) => setResultImagePath(path)}
            />
          </CardContent>
        </Card>
      </div>

      <RecipeForm
        onSubmit={onSubmit}
        isSubmitting={createRecipe.isPending}
        submitLabel="Créer la recette"
      />
    </div>
  )
}
