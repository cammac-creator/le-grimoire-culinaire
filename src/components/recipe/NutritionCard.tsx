import { useState } from 'react'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEstimateNutrition, useSaveNutrition } from '@/hooks/useNutrition'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import type { Ingredient, NutritionInfo } from '@/types'

interface NutritionCardProps {
  recipeId: string
  userId: string
  nutrition: NutritionInfo | null
  ingredients: Ingredient[]
  servings: number | null
}

const MACROS: { key: keyof NutritionInfo; label: string; color: string; max: number }[] = [
  { key: 'calories', label: 'Calories', color: 'bg-amber-500', max: 800 },
  { key: 'protein', label: 'Protéines', color: 'bg-red-500', max: 50 },
  { key: 'carbs', label: 'Glucides', color: 'bg-blue-500', max: 100 },
  { key: 'fat', label: 'Lipides', color: 'bg-yellow-500', max: 50 },
  { key: 'fiber', label: 'Fibres', color: 'bg-green-500', max: 30 },
]

export function NutritionCard({ recipeId, userId, nutrition, ingredients, servings }: NutritionCardProps) {
  const { user } = useAuth()
  const estimate = useEstimateNutrition()
  const save = useSaveNutrition()
  const isOwner = user?.id === userId
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleEstimate = async () => {
    setErrorMsg(null)
    try {
      const result = await estimate.mutateAsync({ ingredients, servings: servings || 1 })
      await save.mutateAsync({ recipeId, nutrition: result })
      toast({ title: 'Nutrition estimée avec succès !' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de contacter le service.'
      setErrorMsg(msg)
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    }
  }

  if (!nutrition && !isOwner) return null

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Nutrition par portion</span>
          {nutrition && (
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Estimation IA
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {nutrition ? (
          <div className="space-y-3">
            {MACROS.map(({ key, label, color, max }) => {
              const value = nutrition[key]
              if (value === undefined) return null
              const percent = Math.min((value / max) * 100, 100)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium">
                      {value}{key === 'calories' ? ' kcal' : ' g'}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${color} transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              Estimez les informations nutritionnelles avec l'IA.
            </p>
            {errorMsg && (
              <div className="mb-3 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <Button
              onClick={handleEstimate}
              disabled={estimate.isPending || save.isPending}
            >
              {estimate.isPending || save.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {errorMsg ? 'Réessayer' : 'Estimer la nutrition'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
