import { describe, it, expect } from 'vitest'
import { formatDuration, formatDate, getInitial } from '../utils'

describe('formatDuration', () => {
  it('retourne vide pour null', () => {
    expect(formatDuration(null)).toBe('')
  })

  it('retourne vide pour 0', () => {
    expect(formatDuration(0)).toBe('')
  })

  it('formate les minutes seules', () => {
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(45)).toBe('45 min')
  })

  it('formate les heures', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })

  it('formate heures + minutes', () => {
    expect(formatDuration(90)).toBe('1h30')
    expect(formatDuration(65)).toBe('1h05')
  })
})

describe('formatDate', () => {
  it('formate une date ISO en français', () => {
    const result = formatDate('2024-03-15T12:00:00Z')
    expect(result).toContain('15')
  })
})

describe('getInitial', () => {
  it('retourne la premiere lettre en majuscule', () => {
    expect(getInitial('alice')).toBe('A')
    expect(getInitial('Bob')).toBe('B')
  })

  it('retourne le fallback pour null', () => {
    expect(getInitial(null)).toBe('?')
    expect(getInitial(undefined, 'X')).toBe('X')
  })
})
