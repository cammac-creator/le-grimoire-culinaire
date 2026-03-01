import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLikes(recipeId: string, userId?: string) {
  const queryClient = useQueryClient()

  const likesCount = useQuery({
    queryKey: ['likes', 'count', recipeId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId)

      if (error) throw error
      return count ?? 0
    },
  })

  const userHasLiked = useQuery({
    queryKey: ['likes', 'user', recipeId, userId],
    queryFn: async () => {
      if (!userId) return false
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return !!data
    },
    enabled: !!userId,
  })

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Non authentifié')

      if (userHasLiked.data) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ recipe_id: recipeId, user_id: userId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', 'count', recipeId] })
      queryClient.invalidateQueries({ queryKey: ['likes', 'user', recipeId, userId] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  return {
    count: likesCount.data ?? 0,
    hasLiked: userHasLiked.data ?? false,
    toggleLike: toggleLike.mutate,
    isToggling: toggleLike.isPending,
  }
}

export function useFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('likes')
        .select(`
          recipe:recipes(
            *,
            profile:profiles(id, username, avatar_url),
            images:recipe_images(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map((d) => d.recipe).filter(Boolean)
    },
    enabled: !!userId,
  })
}
