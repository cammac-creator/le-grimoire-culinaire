import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { RECIPE_CATEGORIES, type RecipeCategory } from '@/types'

interface FiltersProps {
  category: RecipeCategory | ''
  onCategoryChange: (cat: RecipeCategory | '') => void
  isTested: boolean | null
  onIsTestedChange: (val: boolean | null) => void
  favoritesOnly: boolean
  onFavoritesOnlyChange: (val: boolean) => void
  isAuthenticated: boolean
}

export function Filters({
  category,
  onCategoryChange,
  isTested,
  onIsTestedChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  isAuthenticated,
}: FiltersProps) {
  const hasFilters = category || isTested !== null || favoritesOnly

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={category || 'all'}
        onValueChange={(v) => onCategoryChange(v === 'all' ? '' : (v as RecipeCategory))}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Catégorie" />
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
        >
          Testées
        </Badge>
        <Badge
          variant={isTested === false ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onIsTestedChange(isTested === false ? null : false)}
        >
          Non testées
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

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCategoryChange('')
            onIsTestedChange(null)
            onFavoritesOnlyChange(false)
          }}
        >
          <X className="mr-1 h-3 w-3" />
          Réinitialiser
        </Button>
      )}
    </div>
  )
}
