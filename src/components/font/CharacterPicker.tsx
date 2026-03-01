import { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { binarize, type CroppedGlyph } from '@/lib/character-extractor'

const CATEGORIES = [
  { label: 'Minuscules', chars: 'abcdefghijklmnopqrstuvwxyz'.split('') },
  { label: 'Majuscules', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
  { label: 'Chiffres', chars: '0123456789'.split('') },
  { label: 'Accents', chars: 'éèêëàâùûôîïçÉÈÊËÀÂÙÛÔÎÏÇ'.split('') },
  { label: 'Ponctuation', chars: `.,;:!?'-"()`.split('') },
]

interface CharacterPickerProps {
  imageUrls: string[]
  onComplete: (glyphs: Map<string, CroppedGlyph>) => void
}

export function CharacterPicker({ imageUrls, onComplete }: CharacterPickerProps) {
  const [activeChar, setActiveChar] = useState<string | null>(null)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [cropSize, setCropSize] = useState(60)
  const [zoom, setZoom] = useState(1)
  const [glyphs, setGlyphs] = useState<Map<string, CroppedGlyph>>(new Map())
  const [pendingCrop, setPendingCrop] = useState<{ char: string; dataUrl: string; imageData: ImageData } | null>(null)

  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Charger l'image naturelle en mémoire pour le crop
  const [naturalImages, setNaturalImages] = useState<HTMLImageElement[]>([])

  useEffect(() => {
    const imgs: HTMLImageElement[] = []
    let loaded = 0
    for (const url of imageUrls) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        loaded++
        if (loaded === imageUrls.length) setNaturalImages([...imgs])
      }
      img.src = url
      imgs.push(img)
    }
  }, [imageUrls])

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!activeChar || !imgRef.current) return

      const natImg = naturalImages[activeImageIdx]
      if (!natImg) return

      const rect = imgRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      // Convertir en coordonnées image naturelle
      const scaleX = natImg.naturalWidth / rect.width
      const scaleY = natImg.naturalHeight / rect.height
      const natX = clickX * scaleX
      const natY = clickY * scaleY

      // Taille du crop dans l'espace image naturelle
      const halfCrop = (cropSize * scaleX) / 2

      const srcX = Math.max(0, Math.round(natX - halfCrop))
      const srcY = Math.max(0, Math.round(natY - halfCrop))
      const srcW = Math.min(Math.round(halfCrop * 2), natImg.naturalWidth - srcX)
      const srcH = Math.min(Math.round(halfCrop * 2), natImg.naturalHeight - srcY)

      // Cropper via canvas
      const canvas = document.createElement('canvas')
      canvas.width = srcW
      canvas.height = srcH
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(natImg, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)

      const imageData = ctx.getImageData(0, 0, srcW, srcH)
      const dataUrl = canvas.toDataURL('image/png')

      setPendingCrop({ char: activeChar, dataUrl, imageData })
    },
    [activeChar, activeImageIdx, cropSize, naturalImages]
  )

  const confirmCrop = useCallback(() => {
    if (!pendingCrop) return

    const binData = binarize(pendingCrop.imageData)

    setGlyphs((prev) => {
      const next = new Map(prev)
      next.set(pendingCrop.char, {
        character: pendingCrop.char,
        imageData: pendingCrop.imageData,
        binarized: binData,
        dataUrl: pendingCrop.dataUrl,
        confidence: 1.0,
      })
      return next
    })

    setPendingCrop(null)

    // Passer au caractère suivant non collecté
    const allChars = CATEGORIES.flatMap((c) => c.chars)
    const currentIdx = allChars.indexOf(pendingCrop.char)
    for (let i = 1; i < allChars.length; i++) {
      const nextChar = allChars[(currentIdx + i) % allChars.length]
      if (!glyphs.has(nextChar) && nextChar !== pendingCrop.char) {
        setActiveChar(nextChar)
        return
      }
    }
    setActiveChar(null)
  }, [pendingCrop, glyphs])

  const rejectCrop = useCallback(() => {
    setPendingCrop(null)
  }, [])

  const removeGlyph = useCallback((char: string) => {
    setGlyphs((prev) => {
      const next = new Map(prev)
      next.delete(char)
      return next
    })
  }, [])

  const totalChars = CATEGORIES.reduce((s, c) => s + c.chars.length, 0)

  return (
    <div className="space-y-4">
      {/* Barre d'état */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {activeChar ? (
            <span>
              Cliquez sur un <strong className="text-lg text-primary">« {activeChar} »</strong> dans l'image
            </span>
          ) : (
            <span className="text-muted-foreground">Sélectionnez un caractère ci-dessous, puis cliquez dans l'image</span>
          )}
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {glyphs.size}/{totalChars}
        </span>
      </div>

      {/* Zone image */}
      <div className="rounded-lg border bg-muted/20">
        {/* Contrôles image */}
        <div className="flex items-center gap-3 border-b px-3 py-2">
          {imageUrls.length > 1 && (
            <div className="flex gap-1">
              {imageUrls.map((_, idx) => (
                <Button
                  key={idx}
                  variant={idx === activeImageIdx ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveImageIdx(idx)}
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={0.5}
              max={4}
              step={0.1}
              className="w-28"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Taille crop:</span>
            <Slider
              value={[cropSize]}
              onValueChange={([v]) => setCropSize(v)}
              min={30}
              max={120}
              step={5}
              className="w-24"
            />
            <span>{cropSize}px</span>
          </div>
        </div>

        {/* Image */}
        <div
          ref={containerRef}
          className="relative max-h-[50vh] overflow-auto"
        >
          <img
            ref={imgRef}
            src={imageUrls[activeImageIdx]}
            alt="Recette manuscrite"
            className={cn(
              'block origin-top-left',
              activeChar ? 'cursor-crosshair' : 'cursor-default'
            )}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            onClick={handleImageClick}
            draggable={false}
          />
        </div>
      </div>

      {/* Confirmation du crop */}
      {pendingCrop && (
        <div className="flex items-center gap-4 rounded-lg border-2 border-primary bg-primary/5 p-3">
          <img
            src={pendingCrop.dataUrl}
            alt={pendingCrop.char}
            className="h-16 w-16 rounded border object-contain bg-white"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Ce crop correspond bien à « <strong className="text-primary">{pendingCrop.char}</strong> » ?
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={rejectCrop}>
              <X className="mr-1 h-4 w-4" />
              Non
            </Button>
            <Button size="sm" onClick={confirmCrop}>
              <Check className="mr-1 h-4 w-4" />
              Oui
            </Button>
          </div>
        </div>
      )}

      {/* Grille de sélection des caractères */}
      {CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">{cat.label}</h4>
          <div className="flex flex-wrap gap-1.5">
            {cat.chars.map((char) => {
              const glyph = glyphs.get(char)
              const isActive = activeChar === char

              return (
                <button
                  key={char}
                  type="button"
                  onClick={() => {
                    if (glyph) {
                      // Déjà collecté : cliquer pour resélectionner ou supprimer
                      if (isActive) {
                        removeGlyph(char)
                        setActiveChar(char)
                      } else {
                        setActiveChar(char)
                      }
                    } else {
                      setActiveChar(char)
                    }
                  }}
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-md border-2 text-sm transition-all',
                    isActive && 'border-primary ring-2 ring-primary/30 scale-110 z-10',
                    glyph && !isActive && 'border-green-500 bg-green-50',
                    !glyph && !isActive && 'border-dashed border-muted-foreground/30 hover:border-muted-foreground/60'
                  )}
                  title={glyph ? `« ${char} » collecté — cliquer pour remplacer` : `Sélectionner « ${char} »`}
                >
                  {glyph ? (
                    <img src={glyph.dataUrl} alt={char} className="h-9 w-9 object-contain" />
                  ) : (
                    <span className={cn(
                      'text-base',
                      isActive ? 'font-bold text-primary' : 'text-muted-foreground/50'
                    )}>
                      {char}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Bouton terminer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {glyphs.size === 0
            ? 'Collectez au moins quelques caractères pour générer la police'
            : `${glyphs.size} caractère${glyphs.size > 1 ? 's' : ''} collecté${glyphs.size > 1 ? 's' : ''}`}
        </p>
        <Button
          onClick={() => onComplete(glyphs)}
          disabled={glyphs.size < 5}
        >
          Continuer avec {glyphs.size} caractères
        </Button>
      </div>
    </div>
  )
}
