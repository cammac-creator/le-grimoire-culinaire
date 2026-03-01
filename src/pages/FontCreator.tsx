import { useState, useCallback } from 'react'
import { PenTool, ArrowLeft, ArrowRight, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { CharacterPicker } from '@/components/font/CharacterPicker'
import { FontPreview } from '@/components/font/FontPreview'
import type { CroppedGlyph } from '@/lib/character-extractor'
import {
  useCreateHandwritingFont,
  useGenerateFont,
  useHandwritingFonts,
  useDeleteHandwritingFont,
} from '@/hooks/useHandwritingFont'
import { useAuth } from '@/hooks/useAuth'
import { STORAGE_BUCKETS, type HandwritingFont } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'

type Step = 'author' | 'images' | 'pick' | 'result'
const STEPS: Step[] = ['author', 'images', 'pick', 'result']
const STEP_LABELS: Record<Step, string> = {
  author: 'Auteur',
  images: 'Images',
  pick: 'Caractères',
  result: 'Résultat',
}

export default function FontCreator() {
  const { user } = useAuth()
  const { data: fonts } = useHandwritingFonts()
  const createFont = useCreateHandwritingFont()
  const generateFont = useGenerateFont()
  const deleteFont = useDeleteHandwritingFont()

  const [step, setStep] = useState<Step>('author')
  const [authorName, setAuthorName] = useState('')
  const [currentFont, setCurrentFont] = useState<HandwritingFont | null>(null)
  const [uploadedImages, setUploadedImages] = useState<{ path: string; url: string }[]>([])
  const [generationProgress, setGenerationProgress] = useState('')

  const stepIndex = STEPS.indexOf(step)

  // ─── Étape 1 : Auteur ──────────────────

  const handleCreateFont = async () => {
    if (!authorName.trim() || !user) return
    const font = await createFont.mutateAsync({
      authorName: authorName.trim(),
      userId: user.id,
    })
    setCurrentFont(font)
    setStep('images')
  }

  // ─── Étape 2 : Images ──────────────────

  const handleImageUpload = useCallback(
    (path: string, url: string) => {
      setUploadedImages((prev) => [...prev, { path, url }])
    },
    []
  )

  // ─── Étape 3 : Sélection manuelle ──────

  const handlePickComplete = async (glyphs: Map<string, CroppedGlyph>) => {
    if (!currentFont) return

    setGenerationProgress('Démarrage de la génération...')
    try {
      const result = await generateFont.mutateAsync({
        fontId: currentFont.id,
        glyphs,
        fontName: currentFont.font_name,
        authorName: currentFont.author_name,
        onProgress: (phase, current, total) => {
          setGenerationProgress(`${phase} : ${current}/${total}`)
        },
      })
      setCurrentFont(result)
      setGenerationProgress('')
      setStep('result')
    } catch {
      setGenerationProgress('')
    }
  }

  // ─── Rendu ─────────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <PenTool className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Polices manuscrites</h1>
          <p className="text-muted-foreground">
            Reproduisez l'écriture de vos proches à partir de photos de recettes
          </p>
        </div>
      </div>

      {/* Indicateur d'étapes */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            {i > 0 && <div className="mx-2 h-px w-6 bg-border" />}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i < stepIndex
                  ? 'bg-primary text-primary-foreground'
                  : i === stepIndex
                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="ml-2 hidden text-sm sm:inline">{STEP_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* Étape 1 : Auteur */}
      {step === 'author' && (
        <Card>
          <CardHeader>
            <CardTitle>Qui a écrit ces recettes ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="author">Nom du proche</Label>
              <Input
                id="author"
                placeholder="Grand-mère, Tante Marie..."
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCreateFont}
                disabled={!authorName.trim() || createFont.isPending}
              >
                {createFont.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 2 : Images */}
      {step === 'images' && (
        <Card>
          <CardHeader>
            <CardTitle>Photos de recettes manuscrites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Uploadez 1 à 5 photos de recettes écrites à la main. Vous sélectionnerez ensuite
              chaque caractère directement dans les photos.
            </p>

            {uploadedImages.map((img, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-2">
                <img
                  src={img.url}
                  alt={`Image ${i + 1}`}
                  className="h-16 w-16 rounded object-cover"
                />
                <span className="text-sm text-muted-foreground">Image {i + 1}</span>
              </div>
            ))}

            {uploadedImages.length < 5 && (
              <ImageUploader
                bucket={STORAGE_BUCKETS.fonts}
                folder={currentFont?.id ?? 'temp'}
                onUpload={handleImageUpload}
              />
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('author')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={() => setStep('pick')}
                disabled={uploadedImages.length === 0}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Sélectionner les caractères
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3 : Sélection manuelle des caractères */}
      {step === 'pick' && (
        <Card>
          <CardHeader>
            <CardTitle>Sélection des caractères</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generationProgress ? (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {generationProgress}
              </div>
            ) : (
              <>
                <CharacterPicker
                  imageUrls={uploadedImages.map((img) => img.url)}
                  onComplete={handlePickComplete}
                />

                {generateFont.isError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Erreur : {generateFont.error?.message}
                  </div>
                )}

                <Button variant="outline" onClick={() => setStep('images')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux images
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Étape 4 : Résultat */}
      {step === 'result' && currentFont && (
        <FontPreview font={currentFont} />
      )}

      {/* Liste des polices existantes */}
      {fonts && fonts.length > 0 && step === 'author' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Mes polices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fonts.map((font) => (
                <div
                  key={font.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{font.font_name}</p>
                    <p className="text-sm text-muted-foreground">
                      par {font.author_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={font.status === 'ready' ? 'default' : font.status === 'error' ? 'destructive' : 'secondary'}
                    >
                      {font.status === 'ready' ? 'Prête' : font.status === 'error' ? 'Erreur' : font.status === 'processing' ? 'En cours' : 'Brouillon'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFont.mutate(font)}
                      disabled={deleteFont.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
