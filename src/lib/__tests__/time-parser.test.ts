import { describe, it, expect } from 'vitest'
import { extractTimers } from '../time-parser'

describe('extractTimers', () => {
  it('detecte "cuire 15 minutes"', () => {
    const steps = [{ number: 1, text: 'Faire cuire 15 minutes a feu doux.' }]
    const timers = extractTimers(steps)
    expect(timers).toHaveLength(1)
    expect(timers[0].seconds).toBe(15 * 60)
    expect(timers[0].stepIndex).toBe(0)
  })

  it('detecte "1h30"', () => {
    const steps = [{ number: 1, text: 'Enfourner pendant 1h30.' }]
    const timers = extractTimers(steps)
    expect(timers).toHaveLength(1)
    expect(timers[0].seconds).toBe(90 * 60)
  })

  it('detecte une plage "20 a 25 min"', () => {
    const steps = [{ number: 1, text: 'Cuire 20 a 25 minutes.' }]
    const timers = extractTimers(steps)
    expect(timers.length).toBeGreaterThanOrEqual(1)
    // Le premier timer detecte est soit 20 min (premier pattern) soit la moyenne
    expect(timers[0].seconds).toBeGreaterThanOrEqual(20 * 60)
    expect(timers[0].seconds).toBeLessThanOrEqual(25 * 60)
  })

  it('retourne vide sans duree', () => {
    const steps = [{ number: 1, text: 'Melanger les ingredients.' }]
    expect(extractTimers(steps)).toHaveLength(0)
  })

  it('detecte plusieurs timers sur differentes etapes', () => {
    const steps = [
      { number: 1, text: 'Cuire 10 min.' },
      { number: 2, text: 'Laisser refroidir.' },
      { number: 3, text: 'Gratiner 5 minutes.' },
    ]
    const timers = extractTimers(steps)
    expect(timers).toHaveLength(2)
    expect(timers[0].stepIndex).toBe(0)
    expect(timers[1].stepIndex).toBe(2)
  })
})
