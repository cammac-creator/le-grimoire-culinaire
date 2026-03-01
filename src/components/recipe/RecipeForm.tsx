import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { recipeSchema, type RecipeFormData } from '@/lib/validators'
import { RECIPE_CATEGORIES } from '@/types'

interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormData>
  onSubmit: (data: RecipeFormData) => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function RecipeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Enregistrer',
}: RecipeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: '',
      description: '',
      ingredients: [{ name: '', quantity: '', unit: '' }],
      steps: [{ number: 1, text: '' }],
      author_name: '',
      author_date: '',
      category: '',
      tags: [],
      servings: null,
      prep_time: null,
      cook_time: null,
      ...defaultValues,
    },
  })

  const {
    fields: ingredientFields,
    append: addIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: 'ingredients' })

  const {
    fields: stepFields,
    append: addStep,
    remove: removeStep,
  } = useFieldArray({ control, name: 'steps' })

  const tagsValue = watch('tags')
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = e.currentTarget
      const tag = input.value.trim()
      if (tag && !tagsValue.includes(tag)) {
        setValue('tags', [...tagsValue, tag])
      }
      input.value = ''
    }
  }

  const removeTag = (tag: string) => {
    setValue('tags', tagsValue.filter((t) => t !== tag))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Infos de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" placeholder="Nom de la recette" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Une courte description..."
              {...register('description')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select
                value={watch('category')}
                onValueChange={(val) => setValue('category', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {RECIPE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Portions</Label>
              <Input
                id="servings"
                type="number"
                min={1}
                placeholder="4"
                {...register('servings', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                placeholder="Ajouter un tag (Entrée)"
                onKeyDown={handleTagInput}
              />
              <div className="flex flex-wrap gap-1">
                {tagsValue.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prep_time">Préparation (min)</Label>
              <Input
                id="prep_time"
                type="number"
                min={0}
                placeholder="30"
                {...register('prep_time', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook_time">Cuisson (min)</Label>
              <Input
                id="cook_time"
                type="number"
                min={0}
                placeholder="45"
                {...register('cook_time', { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Origine */}
      <Card>
        <CardHeader>
          <CardTitle>Origine</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="author_name">Auteur original</Label>
            <Input
              id="author_name"
              placeholder="Grand-mère, magazine..."
              {...register('author_name')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author_date">Date d'origine</Label>
            <Input id="author_date" type="date" {...register('author_date')} />
          </div>
        </CardContent>
      </Card>

      {/* Ingrédients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingrédients</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addIngredient({ name: '', quantity: '', unit: '' })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <Input
                placeholder="Quantité"
                className="w-24"
                {...register(`ingredients.${index}.quantity`)}
              />
              <Input
                placeholder="Unité"
                className="w-20"
                {...register(`ingredients.${index}.unit`)}
              />
              <Input
                placeholder="Ingrédient"
                className="flex-1"
                {...register(`ingredients.${index}.name`)}
              />
              {ingredientFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {errors.ingredients && (
            <p className="text-sm text-destructive">
              {errors.ingredients.message ?? errors.ingredients.root?.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Étapes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Étapes</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addStep({ number: stepFields.length + 1, text: '' })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {stepFields.map((field, index) => (
            <div key={field.id}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <Textarea
                  placeholder={`Étape ${index + 1}...`}
                  className="flex-1"
                  {...register(`steps.${index}.text`)}
                />
                {stepFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {errors.steps && (
            <p className="text-sm text-destructive">
              {errors.steps.message ?? errors.steps.root?.message}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
