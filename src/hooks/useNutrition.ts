import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Ingredient, NutritionInfo } from '@/types'

export function useEstimateNutrition() {
  return useMutation({
    mutationFn: async ({ ingredients, servings }: { ingredients: Ingredient[]; servings: number }) => {
      const { data, error } = await supabase.functions.invoke('estimate-nutrition', {
        body: { ingredients, servings },
      })

      if (error) {
        console.error('[estimate-nutrition] error:', error)
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Erreur lors de l\'appel à l\'estimation nutritionnelle'
        )
      }

      // Vérifier que data contient les champs attendus
      if (!data || typeof data.calories !== 'number') {
        console.error('[estimate-nutrition] invalid data:', data)
        throw new Error('Réponse invalide du service de nutrition')
      }

      return data as NutritionInfo
    },
  })
}

export function useSaveNutrition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recipeId, nutrition }: { recipeId: string; nutrition: NutritionInfo }) => {
      const { data, error } = await supabase
        .from('recipes')
        .update({ nutrition })
        .eq('id', recipeId)
        .select('id')

      if (error) {
        console.error('[save-nutrition] error:', error)
        throw new Error(error.message)
      }

      if (!data || data.length === 0) {
        throw new Error('Impossible de sauvegarder : vérifiez que vous êtes le propriétaire de cette recette.')
      }
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
    },
  })
}
