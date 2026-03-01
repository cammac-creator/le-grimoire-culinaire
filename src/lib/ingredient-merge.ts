import type { Recipe } from '@/types'
import { parseQuantity, formatQuantity } from './portion-scaler'

export interface ShoppingItem {
  name: string
  quantity: string
  unit: string
  checked: boolean
  sourceRecipes: string[]
}

const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  'kg': { base: 'g', factor: 1000 },
  'l': { base: 'ml', factor: 1000 },
  'cl': { base: 'ml', factor: 10 },
  'dl': { base: 'ml', factor: 100 },
  'c. a soupe': { base: 'ml', factor: 15 },
  'c. a cafe': { base: 'ml', factor: 5 },
}

function normalizeUnit(unit: string): { unit: string; factor: number } {
  const lower = unit.toLowerCase().trim()
  const conversion = UNIT_CONVERSIONS[lower]
  if (conversion) return { unit: conversion.base, factor: conversion.factor }
  return { unit: lower, factor: 1 }
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/s$/, '') // singulier
    .replace(/^(de|du|des|d'|le|la|les|l')\s+/i, '') // articles
}

function formatBack(quantity: number, unit: string): { quantity: string; unit: string } {
  if (unit === 'g' && quantity >= 1000) {
    return { quantity: formatQuantity(quantity / 1000), unit: 'kg' }
  }
  if (unit === 'ml' && quantity >= 1000) {
    return { quantity: formatQuantity(quantity / 1000), unit: 'L' }
  }
  if (unit === 'ml' && quantity >= 100 && quantity % 10 === 0) {
    return { quantity: formatQuantity(quantity / 10), unit: 'cl' }
  }
  return { quantity: formatQuantity(quantity), unit }
}

/**
 * Fusionne les ingredients de plusieurs recettes.
 */
export function mergeIngredients(recipes: Recipe[]): ShoppingItem[] {
  const map = new Map<string, { total: number; unit: string; originalName: string; recipes: Set<string> }>()

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients ?? []) {
      const key = normalizeName(ing.name)
      const { unit: normalizedUnit, factor } = normalizeUnit(ing.unit)
      const parsed = parseQuantity(ing.quantity)

      const existing = map.get(key)
      if (existing && existing.unit === normalizedUnit && parsed !== null) {
        existing.total += parsed * factor
        existing.recipes.add(recipe.title)
      } else if (!existing) {
        map.set(key, {
          total: parsed !== null ? parsed * factor : 0,
          unit: normalizedUnit,
          originalName: ing.name,
          recipes: new Set([recipe.title]),
        })
      } else {
        // Incompatible units: create separate entry
        const altKey = `${key}__${normalizedUnit}`
        const altExisting = map.get(altKey)
        if (altExisting && parsed !== null) {
          altExisting.total += parsed * factor
          altExisting.recipes.add(recipe.title)
        } else {
          map.set(altKey, {
            total: parsed !== null ? parsed * factor : 0,
            unit: normalizedUnit,
            originalName: ing.name,
            recipes: new Set([recipe.title]),
          })
        }
      }
    }
  }

  return Array.from(map.values()).map((item) => {
    const formatted = item.total > 0 ? formatBack(item.total, item.unit) : { quantity: '', unit: item.unit }
    return {
      name: item.originalName,
      quantity: formatted.quantity,
      unit: formatted.unit,
      checked: false,
      sourceRecipes: Array.from(item.recipes),
    }
  })
}
