import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { OcrResult } from '@/types'

export function useScrape() {
  return useMutation({
    mutationFn: async (url: string): Promise<OcrResult> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifie')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-recipe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ url }),
        }
      )

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du scraping')
      }

      return result as OcrResult
    },
  })
}
