import { useCallback, useState } from 'react'
import { FileUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PdfUploaderProps {
  onFileSelected: (file: File) => void
  maxSizeMb?: number
}

export function PdfUploader({ onFileSelected, maxSizeMb = 100 }: PdfUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback(
    (file: File) => {
      setError('')
      if (!file.type.includes('pdf')) {
        setError('Seuls les fichiers PDF sont acceptés.')
        return
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`Fichier trop volumineux (max ${maxSizeMb} Mo)`)
        return
      }
      onFileSelected(file)
    },
    [maxSizeMb, onFileSelected],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <FileUp className="h-10 w-10 text-muted-foreground" />
          <span className="mt-3 text-sm font-medium">
            Glissez un PDF ici ou cliquez pour sélectionner
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            PDF multi-pages — max {maxSizeMb} Mo
          </span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleChange}
            className="hidden"
          />
        </label>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
