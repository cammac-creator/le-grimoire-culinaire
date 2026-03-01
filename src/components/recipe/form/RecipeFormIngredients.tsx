import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecipeFormData } from '@/lib/validators'

interface RecipeFormIngredientsProps {
  control: Control<RecipeFormData>
  register: UseFormRegister<RecipeFormData>
  errors: FieldErrors<RecipeFormData>
}

function SortableIngredient({
  id,
  index,
  register,
  canRemove,
  onRemove,
}: {
  id: string
  index: number
  register: UseFormRegister<RecipeFormData>
  canRemove: boolean
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button
        type="button"
        className="mt-2.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Réordonner"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input placeholder="Quantité" className="w-24" {...register(`ingredients.${index}.quantity`)} />
      <Input placeholder="Unité" className="w-20" {...register(`ingredients.${index}.unit`)} />
      <Input placeholder="Ingrédient" className="flex-1" {...register(`ingredients.${index}.name`)} />
      {canRemove && (
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  )
}

export function RecipeFormIngredients({ control, register, errors }: RecipeFormIngredientsProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'ingredients' })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      move(oldIndex, newIndex)
    }
  }

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((field, index) => (
              <SortableIngredient
                key={field.id}
                id={field.id}
                index={index}
                register={register}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {errors.ingredients && (
          <p className="text-sm text-destructive">{errors.ingredients.message ?? errors.ingredients.root?.message}</p>
        )}
      </CardContent>
    </Card>
  )
}
