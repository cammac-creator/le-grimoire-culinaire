import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { RecipeFormData } from '@/lib/validators'

interface RecipeFormStepsProps {
  control: Control<RecipeFormData>
  register: UseFormRegister<RecipeFormData>
  errors: FieldErrors<RecipeFormData>
}

export function RecipeFormSteps({ control, register, errors }: RecipeFormStepsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'steps' })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Étapes</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ number: fields.length + 1, text: '' })}>
          <Plus className="mr-1 h-4 w-4" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id}>
            {index > 0 && <Separator className="mb-4" />}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </div>
              <Textarea placeholder={`Étape ${index + 1}...`} className="flex-1" {...register(`steps.${index}.text`)} />
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {errors.steps && (
          <p className="text-sm text-destructive">{errors.steps.message ?? errors.steps.root?.message}</p>
        )}
      </CardContent>
    </Card>
  )
}
