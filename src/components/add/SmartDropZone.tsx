import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Link2, PenLine } from 'lucide-react'
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

  // Dispatch file based on MIME type
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

  // Clipboard paste listener (Ctrl+V / Cmd+V images)
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

  // Drag & drop handlers
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

  // File input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) dispatchFile(file)
    },
    [dispatchFile],
  )

  // URL import
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
        'relative rounded-2xl border-2 border-dashed p-8 transition-all duration-200',
        dragOver
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border hover:border-primary/40',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">Ajouter une recette</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deposez une image, un PDF ou collez une photo
          </p>
        </div>

        {/* File picker button */}
        <Button
          size="lg"
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-5 w-5" />
          Choisir un fichier
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* URL input */}
        <div className="w-full space-y-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://marmiton.org/..."
                value={urlValue}
                onChange={(e) => {
                  setUrlValue(e.target.value)
                  setUrlError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleUrlSubmit} disabled={!urlValue.trim()}>
              Importer
            </Button>
          </div>
          {urlError && (
            <p className="text-sm text-destructive">{urlError}</p>
          )}
        </div>

        {/* Separator */}
        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Manual entry */}
        <Button variant="secondary" className="w-full gap-2" onClick={onManual}>
          <PenLine className="h-4 w-4" />
          Saisie manuelle
        </Button>

        {/* Accepted formats */}
        <p className="text-center text-xs text-muted-foreground">
          JPG &middot; PNG &middot; PDF &middot; Ctrl+V pour coller une image
        </p>
      </div>
    </div>
  )
}
