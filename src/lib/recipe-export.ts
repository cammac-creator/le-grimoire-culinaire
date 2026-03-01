import type { Recipe } from '@/types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportAsJson(recipes: Recipe[]) {
  const data = recipes.map((r) => ({
    title: r.title,
    description: r.description,
    category: r.category,
    tags: r.tags,
    dietary_tags: r.dietary_tags,
    ingredients: r.ingredients,
    steps: r.steps,
    servings: r.servings,
    prep_time: r.prep_time,
    cook_time: r.cook_time,
    author_name: r.author_name,
    author_date: r.author_date,
    is_tested: r.is_tested,
    tested_notes: r.tested_notes,
    nutrition: r.nutrition,
  }))

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const date = new Date().toISOString().split('T')[0]
  downloadBlob(blob, `grimoire-recettes-${date}.json`)
}

export async function exportAsPdf(recipes: Recipe[]) {
  const { pdf } = await import('@react-pdf/renderer')
  const { RecipePrintDocument } = await import('@/components/print/RecipePrintLayout')
  const { createElement } = await import('react')

  const doc = createElement(RecipePrintDocument, {
    recipes,
    title: 'Le Grimoire Culinaire',
  })

  const blob = await pdf(doc).toBlob()
  const date = new Date().toISOString().split('T')[0]
  downloadBlob(blob, `grimoire-recettes-${date}.pdf`)
}
