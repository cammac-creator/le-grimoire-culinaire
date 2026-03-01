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
    queryKey: ['search', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }): Promise<Recipe[]> => {
      const from = pageParam * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('recipes')
        .select(RECIPE_SELECT)

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

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return data as Recipe[]
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
