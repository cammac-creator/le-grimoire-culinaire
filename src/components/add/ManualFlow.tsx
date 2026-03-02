import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/types'
import type { RecipeFormData } from '@/lib/validators'

interface ManualFlowProps {
  onBack: () => void
}

export function ManualFlow({ onBack }: ManualFlowProps) {
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

    const images = []
    if (sourceImagePath) {
      images.push({
        recipe_id: recipe.id,
        storage_path: sourceImagePath,
        type: 'source' as const,
        position: 0,
      })
    }
    if (resultImagePath) {
      images.push({
        recipe_id: recipe.id,
        storage_path: resultImagePath,
        type: 'result' as const,
        position: 0,
      })
    }

    if (images.length > 0) {
      await supabase.from('recipe_images').insert(images)
    }

    navigate(`/recipes/${recipe.id}`)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <h2 className="text-2xl font-bold">Nouvelle recette</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Image source (manuscrit)</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              bucket={STORAGE_BUCKETS.sources}
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
              bucket={STORAGE_BUCKETS.photos}
              folder="results"
              onUpload={(path) => setResultImagePath(path)}
            />
          </CardContent>
        </Card>
      </div>

      <RecipeForm
        onSubmit={onSubmit}
        isSubmitting={createRecipe.isPending}
        submitLabel="Creer la recette"
      />
    </div>
  )
}
