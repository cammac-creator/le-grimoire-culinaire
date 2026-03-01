import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Ingredient, NutritionInfo } from '@/types'

export function useEstimateNutrition() {
  return useMutation({
    mutationFn: async ({ ingredients, servings }: { ingredients: Ingredient[]; servings: number }) => {
      const { data, error } = await supabase.functions.invoke('estimate-nutrition', {
        body: { ingredients, servings },
      })
      if (error) throw error
      return data as NutritionInfo
    },
  })
}

export function useSaveNutrition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recipeId, nutrition }: { recipeId: string; nutrition: NutritionInfo }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ nutrition })
        .eq('id', recipeId)
      if (error) throw error
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
    },
  })
}
