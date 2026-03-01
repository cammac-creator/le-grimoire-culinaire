import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ServingsAdjusterProps {
  original: number
  value: number
  onChange: (value: number) => void
}

export function ServingsAdjuster({ original, value, onChange }: ServingsAdjusterProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="min-w-[4ch] text-center font-medium">{value}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-3 w-3" />
      </Button>
      {value !== original && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(original)}
          title="Réinitialiser"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
