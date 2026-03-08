import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MealSlot } from '@/components/meal/MealSlot'
import { RecipePickerDialog } from '@/components/meal/RecipePickerDialog'
import { useMealPlan, useAddMeal, useRemoveMeal, useAddMealIngredientsToCart } from '@/hooks/useMealPlanner'
import { toast } from '@/hooks/useToast'
import { useLocale } from '@/hooks/useLocale'
import type { MealType } from '@/types'

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

export default function MealPlanner() {
  const { t } = useLocale()
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const weekEnd = addDays(weekStart, 6)

  const { data: plans = [] } = useMealPlan(formatDate(weekStart), formatDate(weekEnd))
  const addMeal = useAddMeal()
  const removeMeal = useRemoveMeal()
  const addToCart = useAddMealIngredientsToCart()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<{ date: string; mealType: MealType } | null>(null)

  const MEAL_TYPES: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: t('meal.breakfast') },
    { value: 'lunch', label: t('meal.lunch') },
    { value: 'dinner', label: t('meal.dinner') },
    { value: 'snack', label: t('meal.snack') },
  ]

  const DAY_LABELS = [
    t('meal.mon'), t('meal.tue'), t('meal.wed'), t('meal.thu'),
    t('meal.fri'), t('meal.sat'), t('meal.sun'),
  ]

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const weekLabel = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const handleAdd = (date: string, mealType: MealType) => {
    setPickerTarget({ date, mealType })
    setPickerOpen(true)
  }

  const handleAddToCart = () => {
    addToCart(plans)
    toast({ title: t('meal.addedToShop') })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('meal.title')}</h1>
        <Button variant="outline" onClick={handleAddToCart} disabled={plans.length === 0}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {t('meal.addToShop')}
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-lg font-medium">{weekLabel}</span>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">Grille de la semaine</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-[auto_repeat(7,1fr)] gap-2">
            {/* Header row */}
            <div />
            {days.map((day, i) => (
              <div key={i} className="text-center text-sm font-medium">
                <div>{DAY_LABELS[i]}</div>
                <div className="text-muted-foreground">{day.getDate()}</div>
              </div>
            ))}

            {/* Meal rows */}
            {MEAL_TYPES.map((meal) => (
              <>
                <div key={meal.value} className="flex items-center text-sm font-medium text-muted-foreground">
                  {meal.label}
                </div>
                {days.map((day, i) => {
                  const dateStr = formatDate(day)
                  const plan = plans.find(
                    (p) => p.date === dateStr && p.meal_type === meal.value
                  )
                  return (
                    <MealSlot
                      key={`${meal.value}-${i}`}
                      plan={plan}
                      onAdd={() => handleAdd(dateStr, meal.value)}
                      onRemove={(id) => removeMeal.mutate(id)}
                    />
                  )
                })}
              </>
            ))}
          </div>
        </CardContent>
      </Card>

      <RecipePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(recipe) => {
          if (pickerTarget) {
            addMeal.mutate({
              date: pickerTarget.date,
              mealType: pickerTarget.mealType,
              recipeId: recipe.id,
            })
          }
        }}
      />
    </div>
  )
}
