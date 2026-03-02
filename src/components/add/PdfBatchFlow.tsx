import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageThumbnailGrid } from '@/components/batch/PageThumbnailGrid'
import { BatchProgressPanel } from '@/components/batch/BatchProgressPanel'
import { BatchReviewPanel, type ReviewRecipe } from '@/components/batch/BatchReviewPanel'
import { extractPagesFromPdf, type PdfPage } from '@/lib/pdf-extractor'
import { useBatchOcr } from '@/hooks/useBatchOcr'
import { useCreateRecipes } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import type { OcrResult } from '@/types'

type Step = 'extracting' | 'pages' | 'analyze' | 'review'

const STEP_ORDER: Step[] = ['extracting', 'pages', 'analyze', 'review']
const STEP_LABELS: Record<Step, string> = {
  extracting: 'Extraction',
  pages: 'Pages',
  analyze: 'Analyse',
  review: 'Revue',
}

interface PdfBatchFlowProps {
  file: File
  onBack: () => void
}

export function PdfBatchFlow({ file, onBack }: PdfBatchFlowProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createRecipes = useCreateRecipes()
  const batch = useBatchOcr()

  const [step, setStep] = useState<Step>('extracting')
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [extractProgress, setExtractProgress] = useState({ done: 0, total: 0 })
  const [reviewOverrides, setReviewOverrides] = useState<Map<number, OcrResult>>(new Map())

  const stepIndex = STEP_ORDER.indexOf(step)

  // Extract pages on mount (triggered via AutoExtract component)
  const handleExtract = useCallback(async () => {
    try {
      const pages = await extractPagesFromPdf(file, {
        onProgress: (done, total) => setExtractProgress({ done, total }),
      })
      setPdfPages(pages)
      setSelected(new Set(pages.map((p) => p.pageNumber)))
      setStep('pages')
    } catch {
      // Stay on extracting step, user can go back
    }
  }, [file])

  // Page selection
  const togglePage = (pageNumber: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(pageNumber)) next.delete(pageNumber)
      else next.add(pageNumber)
      return next
    })
  }

  // Launch OCR
  const handleStartOcr = useCallback(async () => {
    batch.initPages(pdfPages, selected)
    setStep('analyze')
    await new Promise((r) => setTimeout(r, 50))
  }, [batch, pdfPages, selected])

  const handleAnalyzeStep = useCallback(async () => {
    await batch.processAll()
  }, [batch])

  // Review
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
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <h2 className="text-2xl font-bold">Import PDF multi-pages</h2>

      {/* Stepper */}
      <div className="flex items-center gap-2">
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
      {step === 'extracting' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">
              Extraction des pages...{' '}
              {extractProgress.total > 0 &&
                `${extractProgress.done}/${extractProgress.total}`}
            </p>
            <AutoExtract onExtract={handleExtract} />
          </CardContent>
        </Card>
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
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Retour
            </Button>
            <Button onClick={handleStartOcr} disabled={selected.size === 0}>
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
          <AutoProcess onProcess={handleAnalyzeStep} pages={batch.pages} />
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setStep('analyze')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour a l'analyse
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

/** Triggers PDF page extraction once on mount. */
function AutoExtract({ onExtract }: { onExtract: () => Promise<void> }) {
  const [triggered, setTriggered] = useState(false)

  if (!triggered) {
    setTriggered(true)
    onExtract()
  }

  return null
}

/** Triggers OCR processing once when the analyze step mounts. */
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
