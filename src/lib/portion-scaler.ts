import type { Ingredient } from '@/types'

const FRACTION_MAP: Record<string, number> = {
  '½': 0.5, '⅓': 1/3, '⅔': 2/3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1/6, '⅚': 5/6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

/**
 * Parse une chaîne de quantité en nombre.
 * Gère : "1/2", "1,5", "1.5", "½", "1 1/2", "", etc.
 */
export function parseQuantity(str: string): number | null {
  if (!str || !str.trim()) return null
  const s = str.trim()

  // Fraction unicode directe
  if (FRACTION_MAP[s] !== undefined) return FRACTION_MAP[s]

  // Nombre entier + fraction unicode ("1½")
  const unicodeFracMatch = s.match(/^(\d+)\s*([\u00BC-\u00BE\u2150-\u215E])$/)
  if (unicodeFracMatch) {
    return parseInt(unicodeFracMatch[1]) + (FRACTION_MAP[unicodeFracMatch[2]] ?? 0)
  }

  // Fraction simple "1/2", "3/4"
  const fracMatch = s.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fracMatch) {
    const denom = parseInt(fracMatch[2])
    return denom === 0 ? null : parseInt(fracMatch[1]) / denom
  }

  // Nombre entier + fraction "1 1/2"
  const mixedMatch = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixedMatch) {
    const denom = parseInt(mixedMatch[3])
    return denom === 0 ? null : parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / denom
  }

  // Nombre décimal (virgule ou point)
  const num = parseFloat(s.replace(',', '.'))
  return isNaN(num) ? null : num
}

/**
 * Formate un nombre en quantité lisible.
 * 0.5 → "1/2", 0.25 → "1/4", 1.5 → "1 1/2", 2 → "2"
 */
export function formatQuantity(value: number): string {
  if (value <= 0) return ''

  const whole = Math.floor(value)
  const frac = value - whole
  const tolerance = 0.01

  const fractions: [number, string][] = [
    [1/4, '1/4'], [1/3, '1/3'], [1/2, '1/2'], [2/3, '2/3'], [3/4, '3/4'],
  ]

  for (const [f, label] of fractions) {
    if (Math.abs(frac - f) < tolerance) {
      return whole > 0 ? `${whole} ${label}` : label
    }
  }

  if (frac < tolerance) return `${whole}`

  // Arrondi intelligent
  const rounded = Math.round(value * 10) / 10
  return rounded % 1 === 0 ? `${rounded}` : `${rounded}`.replace('.', ',')
}

/**
 * Recalcule les ingrédients pour un nombre de portions cible.
 */
export function scaleIngredients(
  ingredients: Ingredient[],
  originalServings: number,
  targetServings: number,
): Ingredient[] {
  if (originalServings <= 0 || targetServings <= 0) return ingredients
  if (originalServings === targetServings) return ingredients

  const ratio = targetServings / originalServings

  return ingredients.map((ing) => {
    const parsed = parseQuantity(ing.quantity)
    if (parsed === null) return ing

    const scaled = parsed * ratio
    return { ...ing, quantity: formatQuantity(scaled) }
  })
}
