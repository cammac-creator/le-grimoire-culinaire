import { useEffect } from 'react'
import type { Control, UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { RecipeFormData } from '@/lib/validators'
import { useLocale } from '@/hooks/useLocale'

interface RecipeFormStepsProps {
  control: Control<RecipeFormData>
  register: UseFormRegister<RecipeFormData>
  setValue: UseFormSetValue<RecipeFormData>
  errors: FieldErrors<RecipeFormData>
}

function SortableStep({
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
  const { t } = useLocale()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {index > 0 && <Separator className="mb-4" />}
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-2.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={t('form.reorder')}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {index + 1}
        </div>
        <Textarea placeholder={`${t('form.stepPlaceholder')} ${index + 1}...`} className="flex-1" {...register(`steps.${index}.text`)} />
        {canRemove && (
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function RecipeFormSteps({ control, register, setValue, errors }: RecipeFormStepsProps) {
  const { t } = useLocale()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'steps' })

  // Keep step numbers in sync after any reorder
  useEffect(() => {
    fields.forEach((_, i) => {
      setValue(`steps.${i}.number`, i + 1)
    })
  }, [fields, setValue])

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
        <CardTitle>{t('form.steps')}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ number: fields.length + 1, text: '' })}>
          <Plus className="mr-1 h-4 w-4" />
          {t('form.add')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((field, index) => (
              <SortableStep
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
        {errors.steps && (
          <p className="text-sm text-destructive">{errors.steps.message ?? errors.steps.root?.message}</p>
        )}
      </CardContent>
    </Card>
  )
}
