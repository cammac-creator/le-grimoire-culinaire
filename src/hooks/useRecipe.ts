import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Recipe } from '@/types'

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: async (): Promise<Recipe> => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profile:profiles(id, username, avatar_url),
          images:recipe_images(*)
        `)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as Recipe
    },
    enabled: !!id,
  })
}
