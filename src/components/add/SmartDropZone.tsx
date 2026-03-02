import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, ImageIcon, Link2, PenLine, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SmartDropZoneProps {
  onImage: (file: File) => void
  onPdf: (file: File) => void
  onUrl: (url: string) => void
  onManual: () => void
}

export function SmartDropZone({ onImage, onPdf, onUrl, onManual }: SmartDropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [urlError, setUrlError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const dispatchFile = useCallback(
    (file: File) => {
      if (file.type === 'application/pdf') {
        onPdf(file)
      } else if (file.type.startsWith('image/')) {
        onImage(file)
      }
    },
    [onImage, onPdf],
  )

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) onImage(file)
          return
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onImage])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) dispatchFile(file)
    },
    [dispatchFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) dispatchFile(file)
      // Reset pour pouvoir re-sélectionner le même fichier
      e.target.value = ''
    },
    [dispatchFile],
  )

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlValue.trim()
    if (!trimmed) return
    try {
      new URL(trimmed)
      setUrlError('')
      onUrl(trimmed)
    } catch {
      setUrlError('URL invalide')
    }
  }, [urlValue, onUrl])

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 border-dashed transition-all duration-200',
        'p-5 sm:p-8',
        dragOver
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border hover:border-primary/40',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-5">
        {/* Icône + Titre */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold sm:text-2xl">Ajouter une recette</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Photographiez, importez ou saisissez votre recette
          </p>
        </div>

        {/* Boutons principaux — empilés sur mobile, côte à côte sur desktop */}
        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-14 gap-3 text-base"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-5 w-5" />
            Prendre une photo
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 gap-3 text-base"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
            Galerie / PDF
          </Button>
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Séparateur */}
        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* URL input */}
        <div className="w-full space-y-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Coller un lien de recette..."
                value={urlValue}
                onChange={(e) => {
                  setUrlValue(e.target.value)
                  setUrlError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                className="h-11 pl-10 text-base"
              />
            </div>
            <Button className="h-11" onClick={handleUrlSubmit} disabled={!urlValue.trim()}>
              Importer
            </Button>
          </div>
          {urlError && (
            <p className="text-sm text-destructive">{urlError}</p>
          )}
        </div>

        {/* Saisie manuelle */}
        <Button variant="secondary" className="h-12 w-full gap-2 text-base" onClick={onManual}>
          <PenLine className="h-4 w-4" />
          Saisie manuelle
        </Button>

        {/* Formats acceptés */}
        <p className="text-center text-xs text-muted-foreground">
          JPG · PNG · PDF · Ctrl+V pour coller une image
        </p>
      </div>
    </div>
  )
}
