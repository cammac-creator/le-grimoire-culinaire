import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecipeFormData } from '@/lib/validators'

interface RecipeFormIngredientsProps {
  control: Control<RecipeFormData>
  register: UseFormRegister<RecipeFormData>
  errors: FieldErrors<RecipeFormData>
}

export function RecipeFormIngredients({ control, register, errors }: RecipeFormIngredientsProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ingrédients</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', quantity: '', unit: '' })}>
          <Plus className="mr-1 h-4 w-4" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <Input placeholder="Quantité" className="w-24" {...register(`ingredients.${index}.quantity`)} />
            <Input placeholder="Unité" className="w-20" {...register(`ingredients.${index}.unit`)} />
            <Input placeholder="Ingrédient" className="flex-1" {...register(`ingredients.${index}.name`)} />
            {fields.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {errors.ingredients && (
          <p className="text-sm text-destructive">{errors.ingredients.message ?? errors.ingredients.root?.message}</p>
        )}
      </CardContent>
    </Card>
  )
}
