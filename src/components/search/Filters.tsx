import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { RECIPE_CATEGORIES, DIETARY_TAGS, type RecipeCategory } from '@/types'
import { useLocale } from '@/hooks/useLocale'

interface FiltersProps {
  category: RecipeCategory | ''
  onCategoryChange: (cat: RecipeCategory | '') => void
  isTested: boolean | null
  onIsTestedChange: (val: boolean | null) => void
  favoritesOnly: boolean
  onFavoritesOnlyChange: (val: boolean) => void
  isAuthenticated: boolean
  dietaryTags?: string[]
  onDietaryTagsChange?: (tags: string[]) => void
}

export function Filters({
  category,
  onCategoryChange,
  isTested,
  onIsTestedChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  isAuthenticated,
  dietaryTags = [],
  onDietaryTagsChange,
}: FiltersProps) {
  const { t } = useLocale()
  const hasFilters = category || isTested !== null || favoritesOnly || dietaryTags.length > 0

  const toggleDietaryTag = (tag: string) => {
    if (!onDietaryTagsChange) return
    onDietaryTagsChange(
      dietaryTags.includes(tag)
        ? dietaryTags.filter((t) => t !== tag)
        : [...dietaryTags, tag]
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={category || 'all'}
        onValueChange={(v) => onCategoryChange(v === 'all' ? '' : (v as RecipeCategory))}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t('filter.category')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          {RECIPE_CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-1">
        <Badge
          variant={isTested === true ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onIsTestedChange(isTested === true ? null : true)}
          aria-pressed={isTested === true}
        >
          Testées
        </Badge>
        <Badge
          variant={isTested === false ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onIsTestedChange(isTested === false ? null : false)}
          aria-pressed={isTested === false}
        >
          {t('filter.notTested')}
        </Badge>
      </div>

      {isAuthenticated && (
        <Badge
          variant={favoritesOnly ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
        >
          Favoris
        </Badge>
      )}

      {onDietaryTagsChange && (
        <div className="flex flex-wrap gap-1">
          {DIETARY_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={dietaryTags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => toggleDietaryTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCategoryChange('')
            onIsTestedChange(null)
            onFavoritesOnlyChange(false)
            onDietaryTagsChange?.([])
          }}
        >
          <X className="mr-1 h-3 w-3" />
          Réinitialiser
        </Button>
      )}
    </div>
  )
}
