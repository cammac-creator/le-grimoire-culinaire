import { useState, useCallback } from 'react'
import { PenTool, ArrowLeft, ArrowRight, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { CharacterGrid } from '@/components/font/CharacterGrid'
import { FontPreview } from '@/components/font/FontPreview'
import {
  guidedExtraction,
  prepareImageForTranscription,
  processImageForExtraction,
  buildGlyphMap,
  type CroppedGlyph,
} from '@/lib/character-extractor'
import {
  useCreateHandwritingFont,
  useTranscribeImage,
  useLabelCharacters,
  useGenerateFont,
  useHandwritingFonts,
  useDeleteHandwritingFont,
} from '@/hooks/useHandwritingFont'
import { useAuth } from '@/hooks/useAuth'
import { STORAGE_BUCKETS, type HandwritingFont } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'

type Step = 'author' | 'images' | 'characters' | 'result'
const STEPS: Step[] = ['author', 'images', 'characters', 'result']
const STEP_LABELS: Record<Step, string> = {
  author: 'Auteur',
  images: 'Images',
  characters: 'Caractères',
  result: 'Résultat',
}

export default function FontCreator() {
  const { user } = useAuth()
  const { data: fonts } = useHandwritingFonts()
  const createFont = useCreateHandwritingFont()
  const transcribeImage = useTranscribeImage()
  const labelChars = useLabelCharacters()
  const generateFont = useGenerateFont()
  const deleteFont = useDeleteHandwritingFont()

  const [step, setStep] = useState<Step>('author')
  const [authorName, setAuthorName] = useState('')
  const [currentFont, setCurrentFont] = useState<HandwritingFont | null>(null)
  const [uploadedImages, setUploadedImages] = useState<{ path: string; url: string }[]>([])
  const [glyphs, setGlyphs] = useState<Map<string, CroppedGlyph>>(new Map())
  const [validated, setValidated] = useState<Set<string>>(new Set())
  const [extractionProgress, setExtractionProgress] = useState('')
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

  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  const handleExtractAll = async () => {
    if (uploadedImages.length === 0) return

    setIsExtracting(true)
    setExtractError(null)
    const allGlyphs = new Map<string, CroppedGlyph>()

    try {
      for (let i = 0; i < uploadedImages.length; i++) {
        const img = uploadedImages[i]

        // ─── Approche guidée par transcription (v4) ─────────
        // 1. Préparer l'image pour Claude
        setExtractionProgress(`Image ${i + 1}/${uploadedImages.length} — Préparation...`)
        const imageBase64 = await prepareImageForTranscription(img.url)

        // 2. Claude transcrit tout le texte ligne par ligne
        setExtractionProgress(`Image ${i + 1}/${uploadedImages.length} — Claude transcrit le texte...`)
        let transcribedLines: string[]
        try {
          transcribedLines = await transcribeImage.mutateAsync(imageBase64)
        } catch {
          // Fallback sur l'ancien pipeline si la transcription échoue
          setExtractionProgress(`Image ${i + 1} — Transcription échouée, utilisation du mode classique...`)
          const processed = await processImageForExtraction(img.url, (msg) => {
            setExtractionProgress(`Image ${i + 1}/${uploadedImages.length} — ${msg}`)
          })
          if (processed.componentCount > 0) {
            setExtractionProgress(`Image ${i + 1} — Claude identifie ${processed.componentCount} caractères...`)
            const labels = await labelChars.mutateAsync(processed.montageBase64)
            const glyphMap = buildGlyphMap(labels, processed.componentImages)
            for (const [char, glyph] of glyphMap) {
              if (!allGlyphs.has(char)) allGlyphs.set(char, glyph)
            }
          }
          continue
        }

        if (transcribedLines.length === 0) {
          setExtractionProgress(`Image ${i + 1} : aucun texte trouvé, passage à la suivante...`)
          continue
        }

        // Afficher les lignes transcrites
        const totalChars = transcribedLines.join('').replace(/[▪ ]/g, '').length
        setExtractionProgress(
          `Image ${i + 1}/${uploadedImages.length} — ${transcribedLines.length} lignes, ~${totalChars} caractères transcrits. Extraction guidée...`
        )

        // 3. Extraction guidée : aligner composants ↔ transcription
        const imageGlyphs = await guidedExtraction(img.url, transcribedLines, (msg) => {
          setExtractionProgress(`Image ${i + 1}/${uploadedImages.length} — ${msg}`)
        })

        // 4. Fusionner (ne pas écraser les glyphes déjà trouvés)
        for (const [char, glyph] of imageGlyphs) {
          if (!allGlyphs.has(char)) {
            allGlyphs.set(char, glyph)
          }
        }

        setExtractionProgress(
          `Image ${i + 1} terminée — ${allGlyphs.size} caractères uniques au total`
        )
      }

      setGlyphs(allGlyphs)
      setValidated(new Set(allGlyphs.keys()))
      setExtractionProgress('')
      setStep('characters')
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Erreur inconnue')
      setExtractionProgress('')
    } finally {
      setIsExtracting(false)
    }
  }

  // ─── Étape 3 : Caractères ──────────────

  const handleToggle = (char: string) => {
    setValidated((prev) => {
      const next = new Set(prev)
      if (next.has(char)) next.delete(char)
      else next.add(char)
      return next
    })
  }

  const handleGenerate = async () => {
    if (!currentFont) return

    // Ne garder que les glyphes validés
    const validGlyphs = new Map<string, CroppedGlyph>()
    for (const [char, glyph] of glyphs) {
      if (validated.has(char)) validGlyphs.set(char, glyph)
    }

    setGenerationProgress('Démarrage...')
    const result = await generateFont.mutateAsync({
      fontId: currentFont.id,
      glyphs: validGlyphs,
      fontName: currentFont.font_name,
      authorName: currentFont.author_name,
      onProgress: (phase, current, total) => {
        setGenerationProgress(`${phase} : ${current}/${total}`)
      },
    })

    setCurrentFont(result)
    setGenerationProgress('')
    setStep('result')
  }

  // ─── Rendu ─────────────────────────────

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
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
              Uploadez 2-3 photos de recettes écrites à la main. Plus il y a de texte varié,
              meilleure sera la police.
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

            {extractionProgress && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {extractionProgress}
              </div>
            )}

            {extractError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Erreur lors de l'extraction : {extractError}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('author')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={handleExtractAll}
                disabled={uploadedImages.length === 0 || isExtracting}
              >
                {isExtracting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Extraire les caractères ({uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3 : Caractères */}
      {step === 'characters' && (
        <Card>
          <CardHeader>
            <CardTitle>Validation des caractères</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CharacterGrid
              glyphs={glyphs}
              validated={validated}
              onToggle={handleToggle}
            />

            {generationProgress && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {generationProgress}
              </div>
            )}

            {generateFont.isError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Erreur : {generateFont.error?.message}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('images')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={validated.size === 0 || generateFont.isPending}
              >
                {generateFont.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PenTool className="mr-2 h-4 w-4" />
                )}
                Générer la police ({validated.size} caractères)
              </Button>
            </div>
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
