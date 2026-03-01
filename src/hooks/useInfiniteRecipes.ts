import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RECIPE_SELECT } from '@/lib/queries'
import type { Recipe, SearchFilters } from '@/types'

const PAGE_SIZE = 12

export function useInfiniteRecipes() {
  return useInfiniteQuery({
    queryKey: ['recipes', 'infinite'],
    queryFn: async ({ pageParam = 0 }): Promise<Recipe[]> => {
      const from = pageParam * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_SELECT)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return data as Recipe[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
  })
}

export function useInfiniteMyRecipes(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['recipes', 'mine', 'infinite', userId],
    queryFn: async ({ pageParam = 0 }): Promise<Recipe[]> => {
      if (!userId) return []
      const from = pageParam * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return data as Recipe[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
    enabled: !!userId,
  })
}

export function useInfiniteSearch(filters: SearchFilters, userId?: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['search', 'infinite', filters, userId],
    queryFn: async ({ pageParam = 0 }): Promise<Recipe[]> => {
      // Call the smart search RPC (handles FTS + trigram + ILIKE + filters)
      const { data: ranked, error: rpcError } = await supabase.rpc('search_recipe_ids', {
        query_text: filters.query || '',
        category_filter: filters.category || null,
        tags_filter: filters.tags.length > 0 ? filters.tags : null,
        is_tested_filter: filters.is_tested,
        user_id_filter: userId ?? null,
        p_favorites_only: filters.favorites_only,
        p_limit: PAGE_SIZE,
        p_offset: pageParam * PAGE_SIZE,
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
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
    enabled,
  })
}

export function useInfiniteFavorites(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['favorites', 'infinite', userId],
    queryFn: async ({ pageParam = 0 }): Promise<Recipe[]> => {
      if (!userId) return []
      const from = pageParam * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await supabase
        .from('likes')
        .select(`recipe:recipes(${RECIPE_SELECT})`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return data.map((d) => d.recipe).filter(Boolean) as unknown as Recipe[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
    enabled: !!userId,
  })
}
