import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RECIPE_SELECT } from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import { useShoppingList } from '@/hooks/useShoppingList'
import type { MealPlan, MealType, Recipe } from '@/types'

export function useMealPlan(startDate: string, endDate: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['meal-plans', user?.id, startDate, endDate],
    queryFn: async (): Promise<MealPlan[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`*, recipe:recipes(${RECIPE_SELECT})`)
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
      if (error) throw error
      return data as unknown as MealPlan[]
    },
    enabled: !!user,
  })
}

export function useAddMeal() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ date, mealType, recipeId }: { date: string; mealType: MealType; recipeId: string }) => {
      if (!user) throw new Error('Non authentifié')
      const { error } = await supabase
        .from('meal_plans')
        .insert({ user_id: user.id, date, meal_type: mealType, recipe_id: recipeId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] })
    },
  })
}

export function useRemoveMeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meal_plans').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] })
    },
  })
}

export function useAddMealIngredientsToCart() {
  const { addRecipe } = useShoppingList()

  return (plans: MealPlan[]) => {
    const recipes = plans
      .map((p) => p.recipe)
      .filter((r): r is Recipe => !!r)
    const unique = [...new Map(recipes.map((r) => [r.id, r])).values()]
    unique.forEach((recipe) => addRecipe(recipe))
  }
}
