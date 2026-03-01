import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/hooks/useSearch'
import type { Recipe } from '@/types'

interface RecipePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (recipe: Recipe) => void
}

export function RecipePickerDialog({ open, onOpenChange, onSelect }: RecipePickerDialogProps) {
  const [query, setQuery] = useState('')
  const { data: recipes } = useSearch(
    { query, category: '', tags: [], dietary_tags: [], is_tested: null, favorites_only: false },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choisir une recette</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="pl-10"
            autoFocus
          />
        </div>
        <div className="mt-2 space-y-1">
          {(recipes ?? []).map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => {
                onSelect(recipe)
                onOpenChange(false)
                setQuery('')
              }}
              className="w-full rounded p-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="font-medium">{recipe.title}</span>
              <span className="ml-2 text-muted-foreground">{recipe.category}</span>
            </button>
          ))}
          {query && recipes?.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Aucun résultat</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
