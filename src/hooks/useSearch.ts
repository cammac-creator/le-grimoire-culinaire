import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Recipe, SearchFilters } from '@/types'

export function useSearch(filters: SearchFilters, userId?: string) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: async (): Promise<Recipe[]> => {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          profile:profiles(id, username, avatar_url),
          images:recipe_images(*)
        `)

      if (filters.query) {
        query = query.textSearch('search_vector', filters.query, {
          type: 'websearch',
          config: 'french',
        })
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.is_tested !== null) {
        query = query.eq('is_tested', filters.is_tested)
      }

      if (filters.favorites_only && userId) {
        const { data: likedIds } = await supabase
          .from('likes')
          .select('recipe_id')
          .eq('user_id', userId)
        if (likedIds) {
          query = query.in('id', likedIds.map((l) => l.recipe_id))
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data as Recipe[]
    },
    enabled: !!filters.query || !!filters.category || filters.tags.length > 0 || filters.is_tested !== null || filters.favorites_only,
  })
}
