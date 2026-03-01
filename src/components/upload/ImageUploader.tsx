import { useCallback, useEffect, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  bucket: string
  folder: string
  onUpload: (path: string, url: string) => void
  accept?: string
  maxSizeMb?: number
  className?: string
}

export function ImageUploader({
  bucket,
  folder,
  onUpload,
  accept = 'image/*',
  maxSizeMb = 10,
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // Cleanup Object URL on unmount or preview change
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const upload = useCallback(
    async (file: File) => {
      setError('')
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`Fichier trop volumineux (max ${maxSizeMb} Mo)`)
        return
      }

      setUploading(true)
      const ext = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)

      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)

      setPreview(URL.createObjectURL(file))
      onUpload(fileName, data.publicUrl)
      setUploading(false)
    },
    [bucket, folder, maxSizeMb, onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) upload(file)
    },
    [upload]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            uploading && 'pointer-events-none opacity-50'
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="max-h-48 rounded" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6"
                onClick={(e) => {
                  e.preventDefault()
                  if (preview) URL.revokeObjectURL(preview)
                  setPreview(null)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Upload en cours...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="mt-2 text-sm text-muted-foreground">
                    Glissez une image ou cliquez pour sélectionner
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Max {maxSizeMb} Mo
                  </span>
                </>
              )}
            </>
          )}
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </label>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
