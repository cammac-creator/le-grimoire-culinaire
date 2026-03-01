import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RECIPE_SELECT } from '@/lib/queries'
import type { Recipe } from '@/types'

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: async (): Promise<Recipe> => {
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_SELECT)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as Recipe
    },
    enabled: !!id,
  })
}
