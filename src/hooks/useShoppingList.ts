import { useCallback, useSyncExternalStore } from 'react'
import type { Recipe } from '@/types'
import { mergeIngredients, type ShoppingItem } from '@/lib/ingredient-merge'

const STORAGE_KEY = 'grimoire-shopping-list'

interface ShoppingListState {
  recipes: { id: string; title: string }[]
  items: ShoppingItem[]
}

function getState(): ShoppingListState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { recipes: [], items: [] }
  } catch {
    return { recipes: [], items: [] }
  }
}

function setState(state: ShoppingListState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((l) => l())
}

const listeners = new Set<() => void>()
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let snapshot = getState()
function getSnapshot() {
  const current = getState()
  if (JSON.stringify(current) !== JSON.stringify(snapshot)) {
    snapshot = current
  }
  return snapshot
}

export function useShoppingList() {
  const state = useSyncExternalStore(subscribe, getSnapshot)

  const addRecipe = useCallback((recipe: Recipe) => {
    const current = getState()
    if (current.recipes.some((r) => r.id === recipe.id)) return
    const updatedRecipes = [...current.recipes, { id: recipe.id, title: recipe.title }]
    // Rebuild the merged list from all stored recipe data
    // For simplicity, we store merged items directly
    const newItems = mergeIngredients([
      // Fake recipe from existing items
      ...current.items.length > 0
        ? [{ ingredients: current.items.map((it) => ({ name: it.name, quantity: it.quantity, unit: it.unit })) } as Recipe]
        : [],
      recipe,
    ])
    setState({ recipes: updatedRecipes, items: newItems })
  }, [])

  const removeRecipe = useCallback((recipeId: string) => {
    const current = getState()
    setState({
      recipes: current.recipes.filter((r) => r.id !== recipeId),
      items: current.items.filter((item) =>
        item.sourceRecipes.length > 1 || !item.sourceRecipes.includes(
          current.recipes.find((r) => r.id === recipeId)?.title ?? ''
        )
      ),
    })
  }, [])

  const toggleItem = useCallback((index: number) => {
    const current = getState()
    const items = [...current.items]
    if (items[index]) {
      items[index] = { ...items[index], checked: !items[index].checked }
      setState({ ...current, items })
    }
  }, [])

  const clearList = useCallback(() => {
    setState({ recipes: [], items: [] })
  }, [])

  const hasRecipe = useCallback((recipeId: string) => {
    return state.recipes.some((r) => r.id === recipeId)
  }, [state.recipes])

  return {
    recipes: state.recipes,
    items: state.items,
    count: state.recipes.length,
    addRecipe,
    removeRecipe,
    toggleItem,
    clearList,
    hasRecipe,
  }
}
