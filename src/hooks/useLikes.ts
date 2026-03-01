import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RECIPE_SELECT } from '@/lib/queries'
import { toast } from '@/hooks/useToast'
import type { Recipe } from '@/types'

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
    mutationFn: async ({ wasLiked }: { wasLiked: boolean }) => {
      if (!userId) throw new Error('Non authentifie')

      if (wasLiked) {
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
    onMutate: async ({ wasLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['likes', 'count', recipeId] })
      await queryClient.cancelQueries({ queryKey: ['likes', 'user', recipeId, userId] })

      // Snapshot previous values
      const prevCount = queryClient.getQueryData<number>(['likes', 'count', recipeId])
      const prevLiked = queryClient.getQueryData<boolean>(['likes', 'user', recipeId, userId])

      // Optimistically update
      queryClient.setQueryData(['likes', 'count', recipeId], (old: number | undefined) =>
        wasLiked ? Math.max(0, (old ?? 1) - 1) : (old ?? 0) + 1
      )
      queryClient.setQueryData(['likes', 'user', recipeId, userId], !wasLiked)

      return { prevCount, prevLiked }
    },
    onError: (_err, _vars, context) => {
      // Rollback
      if (context) {
        queryClient.setQueryData(['likes', 'count', recipeId], context.prevCount)
        queryClient.setQueryData(['likes', 'user', recipeId, userId], context.prevLiked)
      }
      toast({ title: 'Erreur', description: 'Le like n\'a pas pu etre enregistre.', variant: 'destructive' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', 'count', recipeId] })
      queryClient.invalidateQueries({ queryKey: ['likes', 'user', recipeId, userId] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  return {
    count: likesCount.data ?? 0,
    hasLiked: userHasLiked.data ?? false,
    toggleLike: (wasLiked: boolean) => toggleLike.mutate({ wasLiked }),
    isToggling: toggleLike.isPending,
  }
}

export function useFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async (): Promise<Recipe[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('likes')
        .select(`recipe:recipes(${RECIPE_SELECT})`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map((d) => d.recipe).filter(Boolean) as unknown as Recipe[]
    },
    enabled: !!userId,
  })
}
