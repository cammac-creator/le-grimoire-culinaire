import { describe, it, expect } from 'vitest'
import { parseQuantity, formatQuantity, scaleIngredients } from '../portion-scaler'

describe('parseQuantity', () => {
  it('parse un entier', () => {
    expect(parseQuantity('3')).toBe(3)
  })

  it('parse un decimal avec virgule', () => {
    expect(parseQuantity('1,5')).toBe(1.5)
  })

  it('parse un decimal avec point', () => {
    expect(parseQuantity('2.5')).toBe(2.5)
  })

  it('parse une fraction simple', () => {
    expect(parseQuantity('1/2')).toBe(0.5)
    expect(parseQuantity('3/4')).toBe(0.75)
  })

  it('parse un nombre mixte', () => {
    expect(parseQuantity('1 1/2')).toBe(1.5)
  })

  it('retourne null pour une chaine vide', () => {
    expect(parseQuantity('')).toBeNull()
    expect(parseQuantity('  ')).toBeNull()
  })

  it('retourne null pour du texte', () => {
    expect(parseQuantity('abc')).toBeNull()
  })
})

describe('formatQuantity', () => {
  it('formate un entier', () => {
    expect(formatQuantity(2)).toBe('2')
  })

  it('formate une fraction', () => {
    expect(formatQuantity(0.5)).toBe('1/2')
    expect(formatQuantity(0.25)).toBe('1/4')
  })

  it('formate un nombre mixte', () => {
    expect(formatQuantity(1.5)).toBe('1 1/2')
  })

  it('formate un decimal', () => {
    expect(formatQuantity(1.3)).toBe('1,3')
  })
})

describe('scaleIngredients', () => {
  it('double les quantites', () => {
    const ingredients = [
      { name: 'farine', quantity: '250', unit: 'g' },
      { name: 'lait', quantity: '1/2', unit: 'L' },
    ]
    const result = scaleIngredients(ingredients, 4, 8)
    expect(result[0].quantity).toBe('500')
    expect(result[1].quantity).toBe('1')
  })

  it('ne modifie pas sans quantite', () => {
    const ingredients = [{ name: 'sel', quantity: '', unit: '' }]
    const result = scaleIngredients(ingredients, 4, 8)
    expect(result[0].quantity).toBe('')
  })

  it('retourne tel quel si meme nombre de portions', () => {
    const ingredients = [{ name: 'beurre', quantity: '100', unit: 'g' }]
    const result = scaleIngredients(ingredients, 4, 4)
    expect(result[0].quantity).toBe('100')
  })
})
