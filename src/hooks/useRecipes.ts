import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Recipe } from '@/types'
import type { RecipeFormData } from '@/lib/validators'

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async (): Promise<Recipe[]> => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profile:profiles(id, username, avatar_url),
          images:recipe_images(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Recipe[]
    },
  })
}

export function useMyRecipes(userId: string | undefined) {
  return useQuery({
    queryKey: ['recipes', 'mine', userId],
    queryFn: async (): Promise<Recipe[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profile:profiles(id, username, avatar_url),
          images:recipe_images(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Recipe[]
    },
    enabled: !!userId,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recipe: RecipeFormData & { user_id: string }) => {
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipe)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...recipe }: RecipeFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('recipes')
        .update({ ...recipe, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
