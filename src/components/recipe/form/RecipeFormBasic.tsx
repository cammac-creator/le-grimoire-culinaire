import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RECIPE_CATEGORIES, DIETARY_TAGS, type RecipeCategory } from '@/types'
import type { RecipeFormData } from '@/lib/validators'

interface RecipeFormBasicProps {
  register: UseFormRegister<RecipeFormData>
  setValue: UseFormSetValue<RecipeFormData>
  watch: UseFormWatch<RecipeFormData>
  errors: FieldErrors<RecipeFormData>
}

export function RecipeFormBasic({ register, setValue, watch, errors }: RecipeFormBasicProps) {
  const tagsValue = watch('tags')
  const dietaryTagsValue = watch('dietary_tags')

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

  const toggleDietaryTag = (tag: string) => {
    const current = dietaryTagsValue ?? []
    setValue('dietary_tags', current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag])
  }

  return (
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
          <Textarea id="description" placeholder="Une courte description..." {...register('description')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={watch('category')} onValueChange={(val) => setValue('category', val as RecipeCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {RECIPE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="servings">Portions</Label>
            <Input id="servings" type="number" min={1} placeholder="4" {...register('servings', { setValueAs: (v: string) => (v === '' ? null : Number(v)) })} />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <Input placeholder="Ajouter un tag (Entrée)" onKeyDown={handleTagInput} />
            <div className="flex flex-wrap gap-1">
              {tagsValue.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {tag}
                  <button type="button" onClick={() => setValue('tags', tagsValue.filter((t) => t !== tag))} className="hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Régimes alimentaires</Label>
          <div className="flex flex-wrap gap-1">
            {DIETARY_TAGS.map((tag) => (
              <Badge key={tag} variant={(dietaryTagsValue ?? []).includes(tag) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleDietaryTag(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prep_time">Préparation (min)</Label>
            <Input id="prep_time" type="number" min={0} placeholder="30" {...register('prep_time', { setValueAs: (v: string) => (v === '' ? null : Number(v)) })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cook_time">Cuisson (min)</Label>
            <Input id="cook_time" type="number" min={0} placeholder="45" {...register('cook_time', { setValueAs: (v: string) => (v === '' ? null : Number(v)) })} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
