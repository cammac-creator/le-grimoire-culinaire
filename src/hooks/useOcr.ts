import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { OcrResult } from '@/types'

export function useOcr() {
  return useMutation({
    mutationFn: async (imageUrl: string): Promise<OcrResult> => {
      const { data, error } = await supabase.functions.invoke('ocr-recipe', {
        body: { image_url: imageUrl },
      })

      if (error) throw error
      return data as OcrResult
    },
  })
}
