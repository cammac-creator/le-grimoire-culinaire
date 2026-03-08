import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HandwritingFont } from '@/types'
import type { RecipeFormData } from '@/lib/validators'
import { useLocale } from '@/hooks/useLocale'

interface RecipeFormMetaProps {
  register: UseFormRegister<RecipeFormData>
  setValue: UseFormSetValue<RecipeFormData>
  watch: UseFormWatch<RecipeFormData>
  readyFonts: HandwritingFont[]
}

export function RecipeFormMeta({ register, setValue, watch, readyFonts }: RecipeFormMetaProps) {
  const { t } = useLocale()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Origine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="author_name">Auteur original</Label>
            <Input id="author_name" placeholder={t('form.authorPlaceholder')} {...register('author_name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author_date">Date d'origine</Label>
            <Input id="author_date" type="date" {...register('author_date')} />
          </div>
        </div>
        {readyFonts.length > 0 && (
          <div className="space-y-2">
            <Label>Police manuscrite</Label>
            <Select value={watch('handwriting_font_id') ?? ''} onValueChange={(val) => setValue('handwriting_font_id', val || null)}>
              <SelectTrigger>
                <SelectValue placeholder={t('form.noFont')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('form.none')}</SelectItem>
                {readyFonts.map((font) => (
                  <SelectItem key={font.id} value={font.id}>{font.font_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
