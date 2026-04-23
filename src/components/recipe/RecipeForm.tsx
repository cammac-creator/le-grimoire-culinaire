import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { recipeSchema, type RecipeFormData } from '@/lib/validators'
import type { RecipeCategory } from '@/types'
import { useHandwritingFonts } from '@/hooks/useHandwritingFont'
import { useLocale } from '@/hooks/useLocale'
import { useFormDraft } from '@/hooks/useFormDraft'
import { RecipeFormBasic } from '@/components/recipe/form/RecipeFormBasic'
import { RecipeFormIngredients } from '@/components/recipe/form/RecipeFormIngredients'
import { RecipeFormSteps } from '@/components/recipe/form/RecipeFormSteps'
import { RecipeFormMeta } from '@/components/recipe/form/RecipeFormMeta'
import { toast } from '@/hooks/useToast'

interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormData>
  onSubmit: (data: RecipeFormData) => void | Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  /** Si fourni, persiste un brouillon dans localStorage sous cette clé */
  draftKey?: string
}

const EMPTY_DEFAULTS: RecipeFormData = {
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
}

export function RecipeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  draftKey,
}: RecipeFormProps) {
  const { t } = useLocale()
  const submitText = submitLabel ?? t('common.save')
  const { data: fonts } = useHandwritingFonts()
  const readyFonts = fonts?.filter((f) => f.status === 'ready') ?? []
  const [draftRestored, setDraftRestored] = useState(false)

  const form = useForm<RecipeFormData>({
    // zodResolver types expect zod v3 but we use zod v4 — cast needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recipeSchema) as any,
    defaultValues: {
      ...EMPTY_DEFAULTS,
      ...defaultValues,
    },
  })
  const { register, handleSubmit, control, setValue, watch, formState: { errors }, reset } = form

  const { clearDraft } = useFormDraft<RecipeFormData>({
    key: draftKey ?? '',
    form,
    enabled: !!draftKey,
    onRestored: () => setDraftRestored(true),
  })

  const handleDiscardDraft = () => {
    clearDraft()
    reset({ ...EMPTY_DEFAULTS, ...defaultValues })
    setDraftRestored(false)
  }

  const wrappedSubmit = async (data: RecipeFormData) => {
    await onSubmit(data)
    if (draftKey) clearDraft()
  }

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
    const messages = Object.entries(fieldErrors)
      .map(([key, err]) => {
        const e = err as { message?: string }
        return e?.message ? `${key}: ${e.message}` : key
      })
      .join(', ')
    toast({
      title: t('form.validationError'),
      description: messages || t('form.checkFields'),
      variant: 'destructive',
    })
  }

  return (
    <form onSubmit={handleSubmit(wrappedSubmit, onInvalid)} className="space-y-6">
      {draftRestored && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          <span>{t('form.draftRestored')}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDiscardDraft}
            className="gap-1 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('form.discardDraft')}
          </Button>
        </div>
      )}
      <RecipeFormBasic register={register} setValue={setValue} watch={watch} errors={errors} />
      <RecipeFormMeta register={register} setValue={setValue} watch={watch} readyFonts={readyFonts} />
      <RecipeFormIngredients control={control} register={register} errors={errors} />
      <RecipeFormSteps control={control} register={register} setValue={setValue} errors={errors} />

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : submitText}
        </Button>
      </div>
    </form>
  )
}
