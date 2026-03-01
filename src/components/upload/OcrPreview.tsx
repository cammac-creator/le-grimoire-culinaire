import { Loader2, Wand2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OcrResult } from '@/types'

interface OcrPreviewProps {
  imageUrl: string | null
  ocrResult: OcrResult | null
  isProcessing: boolean
  error: string | null
  onProcess: () => void
  onAccept: () => void
}

export function OcrPreview({
  imageUrl,
  ocrResult,
  isProcessing,
  error,
  onProcess,
  onAccept,
}: OcrPreviewProps) {
  if (!imageUrl) return null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Image source */}
      <Card>
        <CardHeader>
          <CardTitle>Image source</CardTitle>
        </CardHeader>
        <CardContent>
          <img
            src={imageUrl}
            alt="Recette scannée"
            className="w-full rounded-lg"
          />
          {!ocrResult && !isProcessing && (
            <Button onClick={onProcess} className="mt-4 w-full">
              <Wand2 className="mr-2 h-4 w-4" />
              Lancer la reconnaissance (OCR)
            </Button>
          )}
          {isProcessing && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse en cours avec Claude Vision...
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultat OCR */}
      {ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle>Texte reconnu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Titre</h4>
              <p className="text-lg font-semibold">{ocrResult.title}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Ingrédients ({ocrResult.ingredients.length})
              </h4>
              <ul className="mt-1 space-y-1">
                {ocrResult.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm">
                    {ing.quantity} {ing.unit} {ing.name}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Étapes ({ocrResult.steps.length})
              </h4>
              <ol className="mt-1 list-inside list-decimal space-y-1">
                {ocrResult.steps.map((step, i) => (
                  <li key={i} className="text-sm">{step.text}</li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              {ocrResult.servings && (
                <div>
                  <span className="text-muted-foreground">Portions : </span>
                  {ocrResult.servings}
                </div>
              )}
              {ocrResult.prep_time && (
                <div>
                  <span className="text-muted-foreground">Prép : </span>
                  {ocrResult.prep_time} min
                </div>
              )}
              {ocrResult.cook_time && (
                <div>
                  <span className="text-muted-foreground">Cuisson : </span>
                  {ocrResult.cook_time} min
                </div>
              )}
            </div>

            <Button onClick={onAccept} className="w-full">
              Corriger et enregistrer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
