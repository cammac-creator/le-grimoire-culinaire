import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { OcrResult } from '@/types'

export function useScrape() {
  return useMutation({
    mutationFn: async (url: string): Promise<OcrResult> => {
      const { data, error } = await supabase.functions.invoke('scrape-recipe', {
        body: { url },
      })

      if (error) throw error
      return data as OcrResult
    },
  })
}
