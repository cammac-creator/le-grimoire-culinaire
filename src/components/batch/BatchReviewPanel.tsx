import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { RECIPE_CATEGORIES, type RecipeCategory, type OcrResult } from '@/types'

export interface ReviewRecipe {
  pageNumber: number
  thumbnailUrl: string
  storagePath: string
  data: OcrResult
}

interface BatchReviewPanelProps {
  recipes: ReviewRecipe[]
  onUpdateRecipe: (pageNumber: number, data: OcrResult) => void
  onRemoveRecipe: (pageNumber: number) => void
  onSaveAll: () => void
  isSaving: boolean
}

export function BatchReviewPanel({
  recipes,
  onUpdateRecipe,
  onRemoveRecipe,
  onSaveAll,
  isSaving,
}: BatchReviewPanelProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggle = (pageNumber: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(pageNumber)) next.delete(pageNumber)
      else next.add(pageNumber)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {recipes.length} recette{recipes.length > 1 ? 's' : ''} reconnue
        {recipes.length > 1 ? 's' : ''}. Vérifiez et corrigez avant d'enregistrer.
      </p>

      {recipes.map((recipe) => {
        const isOpen = expanded.has(recipe.pageNumber)
        const cat = RECIPE_CATEGORIES.find((c) => c.value === recipe.data.category)

        return (
          <Card key={recipe.pageNumber}>
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left"
              onClick={() => toggle(recipe.pageNumber)}
            >
              <img
                src={recipe.thumbnailUrl}
                alt=""
                className="h-12 w-9 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">
                  {recipe.data.title || `Page ${recipe.pageNumber}`}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {cat && <Badge variant="secondary">{cat.label}</Badge>}
                  {recipe.data.servings && (
                    <span className="text-xs text-muted-foreground">
                      {recipe.data.servings} portions
                    </span>
                  )}
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <CardContent className="border-t pt-4 space-y-4">
                <RecipeEditor
                  data={recipe.data}
                  onChange={(data) => onUpdateRecipe(recipe.pageNumber, data)}
                />
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemoveRecipe(recipe.pageNumber)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Supprimer cette recette
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {recipes.length > 0 && (
        <div className="sticky bottom-4 flex justify-center pt-4">
          <Button
            size="lg"
            className="shadow-lg"
            onClick={onSaveAll}
            disabled={isSaving || recipes.length === 0}
          >
            {isSaving
              ? 'Enregistrement...'
              : `Tout enregistrer dans le Grimoire (${recipes.length})`}
          </Button>
        </div>
      )}
    </div>
  )
}

function RecipeEditor({
  data,
  onChange,
}: {
  data: OcrResult
  onChange: (data: OcrResult) => void
}) {
  const update = <K extends keyof OcrResult>(key: K, value: OcrResult[K]) => {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Title & category */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Titre</Label>
          <Input
            value={data.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Catégorie</Label>
          <Select
            value={data.category}
            onValueChange={(val) => update('category', val as RecipeCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECIPE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Portions, prep, cook */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Portions</Label>
          <Input
            type="number"
            min={1}
            value={data.servings ?? ''}
            onChange={(e) =>
              update('servings', e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Prép. (min)</Label>
          <Input
            type="number"
            min={0}
            value={data.prep_time ?? ''}
            onChange={(e) =>
              update('prep_time', e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Cuisson (min)</Label>
          <Input
            type="number"
            min={0}
            value={data.cook_time ?? ''}
            onChange={(e) =>
              update('cook_time', e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
      </div>

      {/* Author */}
      <div className="space-y-1">
        <Label>Auteur</Label>
        <Input
          value={data.author_name ?? ''}
          onChange={(e) => update('author_name', e.target.value || null)}
          placeholder="Grand-mère, magazine..."
        />
      </div>

      {/* Ingredients */}
      <div className="space-y-1">
        <Label>Ingrédients</Label>
        <div className="space-y-2">
          {data.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="w-20"
                placeholder="Qté"
                value={ing.quantity}
                onChange={(e) => {
                  const next = [...data.ingredients]
                  next[i] = { ...next[i], quantity: e.target.value }
                  update('ingredients', next)
                }}
              />
              <Input
                className="w-16"
                placeholder="Unité"
                value={ing.unit}
                onChange={(e) => {
                  const next = [...data.ingredients]
                  next[i] = { ...next[i], unit: e.target.value }
                  update('ingredients', next)
                }}
              />
              <Input
                className="flex-1"
                placeholder="Ingrédient"
                value={ing.name}
                onChange={(e) => {
                  const next = [...data.ingredients]
                  next[i] = { ...next[i], name: e.target.value }
                  update('ingredients', next)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        <Label>Étapes</Label>
        <div className="space-y-2">
          {data.steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground mt-1">
                {step.number}
              </div>
              <Textarea
                className="flex-1 min-h-[60px]"
                value={step.text}
                onChange={(e) => {
                  const next = [...data.steps]
                  next[i] = { ...next[i], text: e.target.value }
                  update('steps', next)
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
