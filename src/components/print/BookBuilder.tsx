import { BookOpen, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Recipe } from '@/types'

interface BookBuilderProps {
  allRecipes: Recipe[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onExportPdf: () => void
  isExporting: boolean
}

export function BookBuilderView({
  allRecipes,
  selectedIds,
  onSelectionChange,
  onExportPdf,
  isExporting,
}: BookBuilderProps) {
  const selectedRecipes = selectedIds
    .map((id) => allRecipes.find((r) => r.id === id))
    .filter(Boolean) as Recipe[]

  const availableRecipes = allRecipes.filter((r) => !selectedIds.includes(r.id))

  const addRecipe = (id: string) => {
    onSelectionChange([...selectedIds, id])
  }

  const removeRecipe = (id: string) => {
    onSelectionChange(selectedIds.filter((sid) => sid !== id))
  }

  const moveRecipe = (index: number, direction: -1 | 1) => {
    const newIds = [...selectedIds]
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= newIds.length) return
    ;[newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]]
    onSelectionChange(newIds)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Recettes disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Recettes disponibles ({availableRecipes.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[60vh] space-y-2 overflow-y-auto">
          {availableRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
              onClick={() => addRecipe(recipe.id)}
            >
              <div>
                <p className="font-medium">{recipe.title}</p>
                <Badge variant="outline" className="text-xs">
                  {recipe.category}
                </Badge>
              </div>
              <span className="text-sm text-primary">+ Ajouter</span>
            </div>
          ))}
          {availableRecipes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Toutes les recettes sont dans le livre.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Livre */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Mon livre ({selectedRecipes.length} recettes)
          </CardTitle>
          <Button
            onClick={onExportPdf}
            disabled={selectedRecipes.length === 0 || isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Génération...' : 'Exporter PDF'}
          </Button>
        </CardHeader>
        <CardContent className="max-h-[60vh] space-y-2 overflow-y-auto">
          {selectedRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              className="flex items-center gap-2 rounded-lg border p-3"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveRecipe(index, -1)}
                  disabled={index === 0}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveRecipe(index, 1)}
                  disabled={index === selectedRecipes.length - 1}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {index + 1}.
              </span>
              <div className="flex-1">
                <p className="font-medium">{recipe.title}</p>
                <Badge variant="outline" className="text-xs">
                  {recipe.category}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRecipe(recipe.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {selectedRecipes.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cliquez sur les recettes à gauche pour les ajouter au livre.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
