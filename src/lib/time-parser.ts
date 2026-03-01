export interface ParsedTimer {
  stepIndex: number
  label: string
  seconds: number
}

const PATTERNS: { regex: RegExp; extract: (m: RegExpMatchArray) => number }[] = [
  // "1h30", "2h", "1h15min"
  {
    regex: /(\d+)\s*h\s*(\d+)?\s*(?:min(?:ute)?s?)?/gi,
    extract: (m) => parseInt(m[1]) * 60 + (parseInt(m[2]) || 0),
  },
  // "pendant 30 minutes", "cuire 15 min", "repos 10 minutes"
  {
    regex: /(\d+)\s+(?:à\s+(\d+)\s+)?min(?:ute)?s?/gi,
    extract: (m) => {
      if (m[2]) return Math.round((parseInt(m[1]) + parseInt(m[2])) / 2)
      return parseInt(m[1])
    },
  },
  // "pendant 5 secondes"
  {
    regex: /(\d+)\s+secondes?/gi,
    extract: (m) => Math.ceil(parseInt(m[1]) / 60),
  },
]

/**
 * Extrait les minuteurs des etapes d'une recette.
 * Retourne un tableau de timers avec la duree en secondes.
 */
export function extractTimers(steps: { number: number; text: string }[]): ParsedTimer[] {
  const timers: ParsedTimer[] = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    for (const { regex, extract } of PATTERNS) {
      regex.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = regex.exec(step.text)) !== null) {
        const minutes = extract(match)
        if (minutes > 0 && minutes <= 600) {
          timers.push({
            stepIndex: i,
            label: `Etape ${step.number} — ${minutes} min`,
            seconds: minutes * 60,
          })
        }
      }
    }
  }

  return timers
}
