import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RECIPE_SELECT } from '@/lib/queries'
import type { Ingredient, OcrResult, Recipe } from '@/types'
import type { RecipeFormData } from '@/lib/validators'

/** Fire-and-forget: generate a photo of the finished dish via Gemini, then insert a recipe_images row. */
function fireGenerateRecipeImage(
  recipeId: string,
  title: string,
  category: string,
  ingredients: Ingredient[],
) {
  supabase.functions
    .invoke('generate-recipe-image', {
      body: { title, category, ingredients },
    })
    .then(({ data, error }) => {
      if (error || !data?.storage_path) {
        console.warn('[generate-image] Edge function failed:', error ?? 'no storage_path')
        return
      }
      return supabase.from('recipe_images').insert({
        recipe_id: recipeId,
        storage_path: data.storage_path,
        type: 'result' as const,
        position: 0,
      })
    })
    .then((res) => {
      if (res && res.error) {
        console.warn('[generate-image] Insert recipe_images failed:', res.error)
      }
    })
    .catch((err) => {
      console.warn('[generate-image] Unexpected error:', err)
    })
}

export function useMyRecipes(userId: string | undefined) {
  return useQuery({
    queryKey: ['recipes', 'mine', userId],
    queryFn: async (): Promise<Recipe[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_SELECT)
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
      // Clean up empty strings → null for nullable DB columns
      const { description, author_name, author_date, handwriting_font_id, ...rest } = recipe
      const cleaned = {
        ...rest,
        description: description || null,
        author_name: author_name || null,
        author_date: author_date || null,
        handwriting_font_id: handwriting_font_id || null,
      }

      const { data, error } = await supabase
        .from('recipes')
        .insert(cleaned)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      fireGenerateRecipeImage(data.id, variables.title, variables.category, variables.ingredients)
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...recipe }: RecipeFormData & { id: string }) => {
      const payload = {
        title: recipe.title,
        description: recipe.description || null,
        ingredients: recipe.ingredients,
        steps: recipe.steps.map(({ number, text }) => ({ number, text })),
        category: recipe.category,
        tags: recipe.tags ?? [],
        dietary_tags: recipe.dietary_tags ?? [],
        servings: recipe.servings ?? null,
        prep_time: recipe.prep_time ?? null,
        cook_time: recipe.cook_time ?? null,
        author_name: recipe.author_name || null,
        author_date: recipe.author_date || null,
        handwriting_font_id: recipe.handwriting_font_id || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('recipes')
        .update(payload)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] })
    },
  })
}

export function useCreateRecipes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      recipes,
    }: {
      userId: string
      recipes: { data: OcrResult; storagePath: string }[]
    }) => {
      const rows = recipes.map((r) => ({
        user_id: userId,
        title: r.data.title,
        ingredients: r.data.ingredients,
        steps: r.data.steps,
        servings: r.data.servings,
        prep_time: r.data.prep_time,
        cook_time: r.data.cook_time,
        category: r.data.category,
        author_name: r.data.author_name,
        tags: [],
      }))

      const { data, error } = await supabase
        .from('recipes')
        .insert(rows)
        .select()

      if (error) throw error

      // Insert source images for each recipe
      const imageRows = data.map((recipe: { id: string }, i: number) => ({
        recipe_id: recipe.id,
        storage_path: recipes[i].storagePath,
        type: 'source' as const,
        position: 0,
      }))

      const { error: imgError } = await supabase
        .from('recipe_images')
        .insert(imageRows)

      if (imgError) throw imgError

      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      // Fire-and-forget: generate image for each recipe in parallel
      data.forEach((recipe: { id: string }, i: number) => {
        const r = variables.recipes[i]
        fireGenerateRecipeImage(recipe.id, r.data.title, r.data.category, r.data.ingredients)
      })
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
