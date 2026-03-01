import type { UnitSystem } from '@/lib/unit-converter'

export type { UnitSystem }

interface UnitToggleProps {
  value: UnitSystem
  onChange: (system: UnitSystem) => void
}

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-border text-sm" role="radiogroup" aria-label="Système d'unités">
      <button
        role="radio"
        aria-checked={value === 'metric'}
        className={`px-3 py-1 rounded-l-md transition-colors ${value === 'metric' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        onClick={() => onChange('metric')}
      >
        Métrique
      </button>
      <button
        role="radio"
        aria-checked={value === 'imperial'}
        className={`px-3 py-1 rounded-r-md transition-colors ${value === 'imperial' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        onClick={() => onChange('imperial')}
      >
        Impérial
      </button>
    </div>
  )
}
