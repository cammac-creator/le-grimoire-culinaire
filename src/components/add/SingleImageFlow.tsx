import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OcrPreview } from '@/components/upload/OcrPreview'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { useOcr } from '@/hooks/useOcr'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS, type OcrResult } from '@/types'
import { toast } from '@/hooks/useToast'
import type { RecipeFormData } from '@/lib/validators'

interface SingleImageFlowProps {
  file: File
  onBack: () => void
}

export function SingleImageFlow({ file, onBack }: SingleImageFlowProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const ocr = useOcr()
  const createRecipe = useCreateRecipe()

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Upload file to storage on mount
  useEffect(() => {
    let cancelled = false

    async function upload() {
      setUploading(true)
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `ocr/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.sources)
        .upload(fileName, file)

      if (cancelled) return

      if (uploadError) {
        toast({
          title: 'Erreur',
          description: `Upload echoue : ${uploadError.message}`,
          variant: 'destructive',
        })
        setUploading(false)
        return
      }

      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.sources)
        .getPublicUrl(fileName)

      setImagePath(fileName)
      setImageUrl(data.publicUrl)
      setUploading(false)
    }

    upload()
    return () => { cancelled = true }
  }, [file])

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

    try {
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
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : "Impossible d'enregistrer la recette",
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <h2 className="text-2xl font-bold">Scanner une recette</h2>

      {uploading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Upload de l'image...</p>
        </div>
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
          <h3 className="mb-4 text-xl font-semibold">
            Corriger et completer la recette
          </h3>
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
