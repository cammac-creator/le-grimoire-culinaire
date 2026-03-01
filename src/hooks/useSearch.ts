import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RECIPE_SELECT } from '@/lib/queries'
import type { Recipe, SearchFilters } from '@/types'

export function isSearchActive(filters: SearchFilters): boolean {
  return !!filters.query || !!filters.category || filters.tags.length > 0 || filters.dietary_tags.length > 0 || filters.is_tested !== null || filters.favorites_only
}

export function useSearch(filters: SearchFilters, userId?: string) {
  return useQuery({
    queryKey: ['search', filters, userId],
    queryFn: async (): Promise<Recipe[]> => {
      // Call the smart search RPC
      const { data: ranked, error: rpcError } = await supabase.rpc('search_recipe_ids', {
        query_text: filters.query || '',
        category_filter: filters.category || null,
        tags_filter: filters.tags.length > 0 ? filters.tags : null,
        is_tested_filter: filters.is_tested,
        user_id_filter: userId ?? null,
        p_favorites_only: filters.favorites_only,
        p_limit: 50,
        p_offset: 0,
        dietary_filter: filters.dietary_tags.length > 0 ? filters.dietary_tags : null,
      })

      if (rpcError) throw rpcError
      if (!ranked || ranked.length === 0) return []

      const orderedIds = ranked.map((r: { recipe_id: string }) => r.recipe_id)

      // Fetch full recipe data with joins
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_SELECT)
        .in('id', orderedIds)

      if (error) throw error

      // Re-sort by relevance order from the RPC
      const recipeMap = new Map((data as Recipe[]).map((r) => [r.id, r]))
      return orderedIds.map((id: string) => recipeMap.get(id)).filter(Boolean) as Recipe[]
    },
    enabled: isSearchActive(filters),
  })
}
