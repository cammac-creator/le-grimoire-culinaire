import { useState, useCallback } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Loader2 } from 'lucide-react'
import { BookBuilderView } from '@/components/print/BookBuilder'
import { RecipePrintDocument } from '@/components/print/RecipePrintLayout'
import { useMyRecipes } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import type { Recipe } from '@/types'

export default function BookBuilderPage() {
  const { user } = useAuth()
  const { data: recipes, isLoading } = useMyRecipes(user?.id)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPdf = useCallback(async () => {
    if (!recipes) return
    setIsExporting(true)

    const selectedRecipes = selectedIds
      .map((id) => recipes.find((r) => r.id === id))
      .filter(Boolean) as Recipe[]

    const blob = await pdf(
      <RecipePrintDocument recipes={selectedRecipes} />
    ).toBlob()

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'le-grimoire-culinaire.pdf'
    link.click()
    URL.revokeObjectURL(url)

    setIsExporting(false)
  }, [recipes, selectedIds])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Composer mon livre</h1>
      <p className="mb-6 text-muted-foreground">
        Sélectionnez et ordonnez les recettes pour votre livre PDF.
      </p>
      <BookBuilderView
        allRecipes={recipes ?? []}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
      />
    </div>
  )
}
