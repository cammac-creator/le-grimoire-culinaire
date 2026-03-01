import { useMutation } from '@tanstack/react-query'
import type { OcrResult } from '@/types'

export function useOcr() {
  return useMutation({
    mutationFn: async (imageUrl: string): Promise<OcrResult> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

      const res = await fetch(`${supabaseUrl}/functions/v1/ocr-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ image_url: imageUrl }),
      })

      const body = await res.json()

      if (!res.ok) {
        throw new Error(body.error ?? `Erreur OCR (HTTP ${res.status})`)
      }

      return body as OcrResult
    },
  })
}
