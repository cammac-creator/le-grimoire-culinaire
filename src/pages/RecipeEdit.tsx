import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { useRecipe } from '@/hooks/useRecipe'
import { useUpdateRecipe } from '@/hooks/useRecipes'
import { toast } from '@/hooks/useToast'
import type { RecipeFormData } from '@/lib/validators'

export default function RecipeEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: recipe, isLoading } = useRecipe(id)
  const updateRecipe = useUpdateRecipe()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Recette introuvable.</p>
      </div>
    )
  }

  const onSubmit = (data: RecipeFormData) => {
    updateRecipe.mutate(
      { ...data, id: recipe.id },
      {
        onSuccess: () => navigate(`/recipes/${recipe.id}`),
        onError: (err) => {
          console.error('[RecipeEdit] Update failed:', err)
          toast({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Impossible de modifier la recette.',
            variant: 'destructive',
          })
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Modifier la recette</h1>
      <RecipeForm
        defaultValues={{
          title: recipe.title,
          description: recipe.description ?? '',
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          author_name: recipe.author_name ?? '',
          author_date: recipe.author_date ?? '',
          category: recipe.category,
          tags: recipe.tags ?? [],
          dietary_tags: recipe.dietary_tags ?? [],
          servings: recipe.servings,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          handwriting_font_id: recipe.handwriting_font_id ?? null,
        }}
        onSubmit={onSubmit}
        isSubmitting={updateRecipe.isPending}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  )
}
