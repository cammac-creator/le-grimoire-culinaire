import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { recipeSchema, type RecipeFormData } from '@/lib/validators'
import type { RecipeCategory } from '@/types'
import { useHandwritingFonts } from '@/hooks/useHandwritingFont'
import { RecipeFormBasic } from '@/components/recipe/form/RecipeFormBasic'
import { RecipeFormIngredients } from '@/components/recipe/form/RecipeFormIngredients'
import { RecipeFormSteps } from '@/components/recipe/form/RecipeFormSteps'
import { RecipeFormMeta } from '@/components/recipe/form/RecipeFormMeta'
import { toast } from '@/hooks/useToast'

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
  const { data: fonts } = useHandwritingFonts()
  const readyFonts = fonts?.filter((f) => f.status === 'ready') ?? []

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipeFormData>({
    // zodResolver types expect zod v3 but we use zod v4 — cast needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recipeSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      ingredients: [{ name: '', quantity: '', unit: '' }],
      steps: [{ number: 1, text: '' }],
      author_name: '',
      author_date: '',
      category: undefined as unknown as RecipeCategory,
      tags: [],
      dietary_tags: [],
      servings: null,
      prep_time: null,
      cook_time: null,
      handwriting_font_id: null,
      ...defaultValues,
    },
  })

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
    const messages = Object.entries(fieldErrors)
      .map(([key, err]) => {
        const e = err as { message?: string }
        return e?.message ? `${key}: ${e.message}` : key
      })
      .join(', ')
    toast({
      title: 'Erreur de validation',
      description: messages || 'Veuillez vérifier les champs du formulaire.',
      variant: 'destructive',
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <RecipeFormBasic register={register} setValue={setValue} watch={watch} errors={errors} />
      <RecipeFormMeta register={register} setValue={setValue} watch={watch} readyFonts={readyFonts} />
      <RecipeFormIngredients control={control} register={register} errors={errors} />
      <RecipeFormSteps control={control} register={register} setValue={setValue} errors={errors} />

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
