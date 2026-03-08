import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { OcrResult } from '@/types'

export function useOcr() {
  return useMutation({
    mutationFn: async (imageUrl: string): Promise<OcrResult> => {
      const { data, error } = await supabase.functions.invoke('ocr-recipe', {
        body: { image_url: imageUrl },
      })

      if (error) {
        const ctx = (error as Record<string, unknown>).context
        const msg = typeof ctx === 'object' && ctx !== null && 'error' in ctx
          ? (ctx as { error: string }).error
          : error.message
        throw new Error(msg || 'Erreur lors de la reconnaissance')
      }

      return data as OcrResult
    },
  })
}
