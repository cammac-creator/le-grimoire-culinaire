import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CroppedGlyph } from '@/lib/character-extractor'
import { assembleFont, fontArrayBufferToBlob } from '@/lib/font-generator'
import type {
  HandwritingFont,
  FontSourceImage,
} from '@/types'

// ─── Queries ────────────────────────────────────────────

export function useHandwritingFonts() {
  return useQuery({
    queryKey: ['handwriting-fonts'],
    queryFn: async (): Promise<HandwritingFont[]> => {
      const { data, error } = await supabase
        .from('handwriting_fonts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as HandwritingFont[]
    },
  })
}

export function useHandwritingFont(id: string | undefined) {
  return useQuery({
    queryKey: ['handwriting-font', id],
    queryFn: async (): Promise<HandwritingFont> => {
      const { data, error } = await supabase
        .from('handwriting_fonts')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as HandwritingFont
    },
    enabled: !!id,
  })
}

export function useFontSourceImages(fontId: string | undefined) {
  return useQuery({
    queryKey: ['font-source-images', fontId],
    queryFn: async (): Promise<FontSourceImage[]> => {
      const { data, error } = await supabase
        .from('font_source_images')
        .select('*')
        .eq('font_id', fontId!)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as FontSourceImage[]
    },
    enabled: !!fontId,
  })
}

// ─── Mutations ──────────────────────────────────────────

export function useCreateHandwritingFont() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      authorName,
      userId,
    }: {
      authorName: string
      userId: string
    }): Promise<HandwritingFont> => {
      const fontName = `Écriture de ${authorName}`

      const { data, error } = await supabase
        .from('handwriting_fonts')
        .insert({
          user_id: userId,
          author_name: authorName,
          font_name: fontName,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return data as HandwritingFont
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handwriting-fonts'] })
    },
  })
}

export function useLabelCharacters() {
  return useMutation({
    mutationFn: async (montageBase64: string): Promise<Record<string, string>> => {
      const { data, error } = await supabase.functions.invoke('extract-characters', {
        body: { image_base64: montageBase64, content_type: 'image/png' },
      })

      if (error) throw error
      return (data as { labels: Record<string, string> }).labels
    },
  })
}

interface GenerateFontParams {
  fontId: string
  glyphs: Map<string, CroppedGlyph>
  fontName: string
  authorName: string
  onProgress?: (phase: string, current: number, total: number) => void
}

export function useGenerateFont() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fontId,
      glyphs,
      fontName,
      authorName,
      onProgress,
    }: GenerateFontParams): Promise<HandwritingFont> => {
      // Mettre le status en processing
      await supabase
        .from('handwriting_fonts')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', fontId)

      try {
        // Assembler la police
        const buffer = await assembleFont(
          glyphs,
          fontName,
          authorName,
          (current, total) => onProgress?.('Vectorisation', current, total)
        )

        const blob = fontArrayBufferToBlob(buffer)
        const storagePath = `${fontId}/${fontName.replace(/\s+/g, '-').toLowerCase()}.ttf`

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('handwriting-fonts')
          .upload(storagePath, blob, {
            contentType: 'font/ttf',
            upsert: true,
          })

        if (uploadError) throw uploadError

        // Calculer la couverture
        const coverage: Record<string, boolean> = {}
        for (const [char] of glyphs) {
          coverage[char] = true
        }

        // Mettre à jour la DB
        const { data, error } = await supabase
          .from('handwriting_fonts')
          .update({
            storage_path: storagePath,
            character_coverage: coverage,
            status: 'ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', fontId)
          .select()
          .single()

        if (error) throw error
        return data as HandwritingFont
      } catch (err) {
        // Marquer l'erreur en DB
        await supabase
          .from('handwriting_fonts')
          .update({
            status: 'error',
            error_message: err instanceof Error ? err.message : 'Erreur inconnue',
            updated_at: new Date().toISOString(),
          })
          .eq('id', fontId)

        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handwriting-fonts'] })
    },
  })
}

export function useDeleteHandwritingFont() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (font: HandwritingFont): Promise<void> => {
      // Supprimer le fichier du Storage si présent
      if (font.storage_path) {
        await supabase.storage.from('handwriting-fonts').remove([font.storage_path])
      }

      // Supprimer l'entrée DB (cascade supprime font_source_images)
      const { error } = await supabase
        .from('handwriting_fonts')
        .delete()
        .eq('id', font.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handwriting-fonts'] })
    },
  })
}

// ─── Utilitaire : chargement dynamique de police ────────

const loadedFonts = new Set<string>()

export async function loadFontFace(font: HandwritingFont): Promise<boolean> {
  if (!font.storage_path || font.status !== 'ready') return false
  if (loadedFonts.has(font.id)) return true

  try {
    const { data } = supabase.storage
      .from('handwriting-fonts')
      .getPublicUrl(font.storage_path)

    const fontFace = new FontFace(font.font_name, `url(${data.publicUrl})`)
    await fontFace.load()
    document.fonts.add(fontFace)
    loadedFonts.add(font.id)
    return true
  } catch {
    return false
  }
}
