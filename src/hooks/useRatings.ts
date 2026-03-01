import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useRecipeRating(recipeId: string) {
  const { user } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['rating-stats', recipeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recipe_rating', { rid: recipeId })
      if (error) throw error
      const row = data?.[0] ?? { avg_score: 0, ratings_count: 0 }
      return { avgScore: Number(row.avg_score), count: Number(row.ratings_count) }
    },
  })

  const { data: userRating } = useQuery({
    queryKey: ['rating-user', recipeId, user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('ratings')
        .select('score')
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data?.score ?? null
    },
    enabled: !!user,
  })

  return {
    avgScore: stats?.avgScore ?? 0,
    count: stats?.count ?? 0,
    userRating: userRating ?? null,
  }
}

export function useRateRecipe() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ recipeId, score }: { recipeId: string; score: number }) => {
      if (!user) throw new Error('Non authentifié')
      const { error } = await supabase
        .from('ratings')
        .upsert({ user_id: user.id, recipe_id: recipeId, score }, { onConflict: 'user_id,recipe_id' })
      if (error) throw error
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['rating-stats', recipeId] })
      queryClient.invalidateQueries({ queryKey: ['rating-user', recipeId] })
    },
  })
}
