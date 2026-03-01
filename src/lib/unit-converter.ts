export type UnitSystem = 'metric' | 'imperial'

interface ConversionRule {
  from: string
  to: string
  factor: number
}

const conversions: ConversionRule[] = [
  // Weight
  { from: 'g', to: 'oz', factor: 0.03527396 },
  { from: 'kg', to: 'lb', factor: 2.20462 },
  // Volume
  { from: 'ml', to: 'fl oz', factor: 0.033814 },
  { from: 'cl', to: 'fl oz', factor: 0.33814 },
  { from: 'l', to: 'qt', factor: 1.05669 },
  // Length
  { from: 'cm', to: 'in', factor: 0.393701 },
]

const reverseConversions: ConversionRule[] = conversions.map((c) => ({
  from: c.to,
  to: c.from,
  factor: 1 / c.factor,
}))

function round(n: number, decimals = 1): string {
  const r = Math.round(n * 10 ** decimals) / 10 ** decimals
  return r % 1 === 0 ? String(Math.round(r)) : r.toFixed(decimals)
}

export function convertIngredient(
  ingredient: { quantity: string; unit: string; name: string },
  targetSystem: UnitSystem
): { quantity: string; unit: string; name: string } {
  if (targetSystem === 'metric') {
    // Convert imperial to metric
    const rule = reverseConversions.find((c) => c.from.toLowerCase() === ingredient.unit.toLowerCase())
    if (!rule || !ingredient.quantity) return ingredient
    const qty = parseFloat(ingredient.quantity)
    if (isNaN(qty)) return ingredient
    return { ...ingredient, quantity: round(qty * rule.factor), unit: rule.to }
  }

  // Convert metric to imperial
  const rule = conversions.find((c) => c.from.toLowerCase() === ingredient.unit.toLowerCase())
  if (!rule || !ingredient.quantity) return ingredient
  const qty = parseFloat(ingredient.quantity)
  if (isNaN(qty)) return ingredient
  return { ...ingredient, quantity: round(qty * rule.factor), unit: rule.to }
}

export function convertTemperatureInText(text: string, targetSystem: UnitSystem): string {
  if (targetSystem === 'imperial') {
    // °C → °F
    return text.replace(/(\d+)\s*°\s*C/gi, (_, n) => {
      const f = Math.round(parseFloat(n) * 9 / 5 + 32)
      return `${f}°F`
    })
  }
  // °F → °C
  return text.replace(/(\d+)\s*°\s*F/gi, (_, n) => {
    const c = Math.round((parseFloat(n) - 32) * 5 / 9)
    return `${c}°C`
  })
}
