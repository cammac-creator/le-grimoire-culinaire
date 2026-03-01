import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FileStack } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PdfUploader } from '@/components/batch/PdfUploader'
import { PageThumbnailGrid } from '@/components/batch/PageThumbnailGrid'
import { BatchProgressPanel } from '@/components/batch/BatchProgressPanel'
import { BatchReviewPanel, type ReviewRecipe } from '@/components/batch/BatchReviewPanel'
import { extractPagesFromPdf, type PdfPage } from '@/lib/pdf-extractor'
import { useBatchOcr } from '@/hooks/useBatchOcr'
import { useCreateRecipes } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import type { OcrResult } from '@/types'

type Step = 'upload' | 'pages' | 'analyze' | 'review'

const STEP_ORDER: Step[] = ['upload', 'pages', 'analyze', 'review']
const STEP_LABELS: Record<Step, string> = {
  upload: 'Upload',
  pages: 'Pages',
  analyze: 'Analyse',
  review: 'Revue',
}

export default function BatchImportPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createRecipes = useCreateRecipes()
  const batch = useBatchOcr()

  const [step, setStep] = useState<Step>('upload')
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [extracting, setExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState({ done: 0, total: 0 })

  // Overrides for edited OCR results
  const [reviewOverrides, setReviewOverrides] = useState<Map<number, OcrResult>>(new Map())

  const stepIndex = STEP_ORDER.indexOf(step)

  // Step 1: Upload PDF
  const handleFileSelected = useCallback(async (file: File) => {
    setExtracting(true)
    try {
      const pages = await extractPagesFromPdf(file, {
        onProgress: (done, total) => setExtractProgress({ done, total }),
      })
      setPdfPages(pages)
      setSelected(new Set(pages.map((p) => p.pageNumber)))
      setStep('pages')
    } finally {
      setExtracting(false)
    }
  }, [])

  // Step 2: Page selection
  const togglePage = (pageNumber: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(pageNumber)) next.delete(pageNumber)
      else next.add(pageNumber)
      return next
    })
  }

  // Step 3: Launch OCR
  const handleStartOcr = useCallback(async () => {
    batch.initPages(pdfPages, selected)
    setStep('analyze')
    // Wait a tick for state to settle, then process
    await new Promise((r) => setTimeout(r, 50))
  }, [batch, pdfPages, selected])

  // After initPages, trigger processAll via effect-like callback
  const handleAnalyzeStep = useCallback(async () => {
    await batch.processAll()
  }, [batch])

  // Step 4: Review & save
  const reviewRecipes: ReviewRecipe[] = batch.pages
    .filter((p) => p.status === 'done' && p.ocrResult)
    .map((p) => ({
      pageNumber: p.pageNumber,
      thumbnailUrl: p.thumbnailUrl,
      storagePath: p.storagePath!,
      data: reviewOverrides.get(p.pageNumber) ?? p.ocrResult!,
    }))

  const handleUpdateRecipe = (pageNumber: number, data: OcrResult) => {
    setReviewOverrides((prev) => new Map(prev).set(pageNumber, data))
  }

  const handleRemoveRecipe = (pageNumber: number) => {
    batch.removePage(pageNumber)
    setReviewOverrides((prev) => {
      const next = new Map(prev)
      next.delete(pageNumber)
      return next
    })
  }

  const handleSaveAll = async () => {
    if (!user) return

    const recipesToSave = reviewRecipes.map((r) => ({
      data: r.data,
      storagePath: r.storagePath,
    }))

    await createRecipes.mutateAsync({
      userId: user.id,
      recipes: recipesToSave,
    })

    navigate('/')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <FileStack className="h-7 w-7" />
        Import PDF multi-pages
      </h1>
      <p className="mb-6 text-muted-foreground">
        Scannez plusieurs recettes en un seul PDF, puis importez-les toutes d'un coup.
      </p>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2">
        {STEP_ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-border" />}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                i < stepIndex
                  ? 'bg-primary text-primary-foreground'
                  : i === stepIndex
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                i === stepIndex ? 'font-medium' : 'text-muted-foreground'
              }`}
            >
              {STEP_LABELS[s]}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 'upload' && (
        <div className="space-y-4">
          {extracting ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Extraction des pages...{' '}
                  {extractProgress.total > 0 &&
                    `${extractProgress.done}/${extractProgress.total}`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <PdfUploader onFileSelected={handleFileSelected} />
          )}
        </div>
      )}

      {step === 'pages' && (
        <div className="space-y-4">
          <PageThumbnailGrid
            pages={pdfPages}
            selected={selected}
            onToggle={togglePage}
            onSelectAll={() =>
              setSelected(new Set(pdfPages.map((p) => p.pageNumber)))
            }
            onDeselectAll={() => setSelected(new Set())}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Retour
            </Button>
            <Button
              onClick={handleStartOcr}
              disabled={selected.size === 0}
            >
              Analyser {selected.size} page{selected.size > 1 ? 's' : ''}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 'analyze' && (
        <div className="space-y-4">
          <BatchProgressPanel pages={batch.pages} onRetry={batch.retryPage} />
          {!batch.isProcessing && batch.pages.length > 0 && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('pages')}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={batch.doneCount === 0}
              >
                Revoir {batch.doneCount} recette{batch.doneCount > 1 ? 's' : ''}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
          {/* Auto-trigger OCR processing */}
          <AutoProcess onProcess={handleAnalyzeStep} pages={batch.pages} />
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setStep('analyze')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour à l'analyse
          </Button>
          <BatchReviewPanel
            recipes={reviewRecipes}
            onUpdateRecipe={handleUpdateRecipe}
            onRemoveRecipe={handleRemoveRecipe}
            onSaveAll={handleSaveAll}
            isSaving={createRecipes.isPending}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Tiny component that triggers OCR processing once when the analyze step mounts.
 * Using a component avoids needing useEffect in the parent with complex deps.
 */
function AutoProcess({
  onProcess,
  pages,
}: {
  onProcess: () => Promise<void>
  pages: { status: string }[]
}) {
  const [triggered, setTriggered] = useState(false)

  if (!triggered && pages.length > 0 && pages.every((p) => p.status === 'pending')) {
    setTriggered(true)
    onProcess()
  }

  return null
}
