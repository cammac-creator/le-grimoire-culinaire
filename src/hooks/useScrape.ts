import { useMutation } from '@tanstack/react-query'
import type { OcrResult } from '@/types'

export function useScrape() {
  return useMutation({
    mutationFn: async (url: string): Promise<OcrResult> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

      let res: Response
      try {
        res = await fetch(`${supabaseUrl}/functions/v1/scrape-recipe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({ url }),
        })
      } catch (err) {
        throw new Error(`Erreur réseau : ${err instanceof Error ? err.message : 'connexion impossible'}`)
      }

      let body: Record<string, unknown>
      try {
        body = await res.json()
      } catch {
        throw new Error(`Réponse invalide du serveur (HTTP ${res.status})`)
      }

      if (!res.ok) {
        throw new Error((body.error as string) ?? `Erreur serveur (HTTP ${res.status})`)
      }

      return body as unknown as OcrResult
    },
  })
}
