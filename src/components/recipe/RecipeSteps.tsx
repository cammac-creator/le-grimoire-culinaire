import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StepTimer } from '@/components/timer/StepTimer'
import { convertTemperatureInText, type UnitSystem } from '@/lib/unit-converter'
import type { Step } from '@/types'
import type { ParsedTimer } from '@/lib/time-parser'

interface RecipeStepsProps {
  steps: Step[]
  parsedTimers: ParsedTimer[]
  onAddTimer: (stepIndex: number) => void
  unitSystem?: UnitSystem
}

export function RecipeSteps({ steps, parsedTimers, onAddTimer, unitSystem = 'metric' }: RecipeStepsProps) {
  const convertedSteps = useMemo(
    () => unitSystem === 'metric' ? steps : steps.map((s) => ({ ...s, text: convertTemperatureInText(s.text, unitSystem) })),
    [steps, unitSystem]
  )

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Préparation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {convertedSteps.map((step, i) => {
          const timer = parsedTimers.find((t) => t.stepIndex === i)
          return (
            <div key={i}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.number}
                </div>
                <p className="pt-1">
                  {step.text}
                  {timer && (
                    <StepTimer
                      minutes={Math.round(timer.seconds / 60)}
                      onClick={() => onAddTimer(i)}
                    />
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
