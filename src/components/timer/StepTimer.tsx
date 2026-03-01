import { Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepTimerProps {
  minutes: number
  onClick: () => void
}

export function StepTimer({ minutes, onClick }: StepTimerProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-2 inline-flex h-6 items-center gap-1 px-2 text-xs"
      onClick={onClick}
    >
      <Timer className="h-3 w-3" />
      {minutes} min
    </Button>
  )
}
